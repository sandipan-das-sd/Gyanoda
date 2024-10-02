import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import axios from "axios";
import { SERVER_URI } from "@/utils/uri";
import io from "socket.io-client";
import useUser from "@/hooks/auth/useUser";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRef } from "react";
interface Notification {
  _id: string;
  textNotification: string;
  imageNotification?: string;
  linkNotification?: string;
  createdAt: string;
  read: boolean;
  userId?: string;
  count: number;
}

interface NotificationCount {
  totalCount: number;
  unreadCount: number;
}

export default function NotificationScreen() {
  const { user, loading: userLoading } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationCount, setNotificationCount] = useState<NotificationCount>(
    { totalCount: 0, unreadCount: 0 }
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchNotificationCount = useCallback(async () => {
    if (!user?._id) return;
    try {
      const accessToken = await AsyncStorage.getItem("access_token");
      const refreshToken = await AsyncStorage.getItem("refresh_token");
      const response = await axios.get(
        `${SERVER_URI}/notification-count/${user._id}`,
        {
          headers: {
            "access-token": accessToken,
            "refresh-token": refreshToken,
          },
        }
      );
      setNotificationCount(response.data);
    } catch (error) {
      console.error("Error fetching notification count:", error);
    }
  }, [user?._id]);

  const fetchNotifications = useCallback(async () => {
    if (!user?._id) return;
    try {
      const accessToken = await AsyncStorage.getItem("access_token");
      const refreshToken = await AsyncStorage.getItem("refresh_token");

      const allNotificationsResponse = await axios.get(
        `${SERVER_URI}/all-notifications`,
        {
          headers: {
            "access-token": accessToken,
            "refresh-token": refreshToken,
          },
        }
      );

      const groupedNotifications =
        allNotificationsResponse.data.notifications.reduce(
          (acc: Notification[], n: Notification) => {
            const existingNotification = acc.find(
              (existing) => existing.textNotification === n.textNotification
            );
            if (existingNotification) {
              existingNotification.count += 1;
            } else {
              acc.push({ ...n, count: 1 });
            }
            return acc;
          },
          []
        );

      setNotifications(groupedNotifications);
      setNotificationCount({
        totalCount: allNotificationsResponse.data.totalCount,
        unreadCount: groupedNotifications.filter((n: Notification) => !n.read)
          .length,
      });
      setError(null);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setError("Failed to fetch notifications. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  const setupSocket = useCallback(() => {
    const socket = io(SERVER_URI);

    const handleAuthentication = async () => {
      const accessToken = await AsyncStorage.getItem("access_token");
      socket.emit("authenticate", { token: accessToken });
    };

    socket.on("connect", handleAuthentication);

    socket.on("authenticated", () => {
      console.log("Socket authenticated");
      if (user?._id) {
        socket.emit("join", user._id);
      }
    });

    socket.on("adminNotification", async (newNotification: Notification) => {
      setNotifications((prevNotifications) => {
        const existingNotification = prevNotifications.find(
          (n) => n.textNotification === newNotification.textNotification
        );
        if (existingNotification) {
          return prevNotifications.map((n) =>
            n.textNotification === newNotification.textNotification
              ? { ...n, count: n.count + 1 }
              : n
          );
        } else {
          return [{ ...newNotification, count: 1 }, ...prevNotifications];
        }
      });
      await fetchNotificationCount();
    });

    socket.on("notificationsCleared", ({ clearedCount }) => {
      setNotifications((prevNotifications) =>
        prevNotifications.filter((n) => !n.read)
      );
      setNotificationCount((prevCount) => ({
        totalCount: prevCount.totalCount - clearedCount,
        unreadCount: prevCount.unreadCount,
      }));
      Alert.alert(
        "Success",
        `${clearedCount} notifications cleared successfully`
      );
    });

    return socket;
  }, [user?._id, fetchNotificationCount]);

  useEffect(() => {
    if (userLoading) return;

    const fetchInitialData = async () => {
      await fetchNotifications();
      await fetchNotificationCount();
    };

    fetchInitialData();

    // Set up continuous fetching
    intervalRef.current = setInterval(() => {
      fetchNotifications();
      fetchNotificationCount();
    }, 5000); // Fetch every 5 seconds

    const socket = setupSocket();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      socket.disconnect();
    };
  }, [
    user?._id,
    userLoading,
    fetchNotifications,
    fetchNotificationCount,
    setupSocket,
  ]);

  const clearNotifications = async () => {
    if (!user?._id) return;
    const readNotifications = notifications.filter((n) => n.read);
    if (readNotifications.length === 0) {
      Alert.alert(
        "No Notifications to Clear",
        "There are no read notifications to clear."
      );
      return;
    }
    try {
      const accessToken = await AsyncStorage.getItem("access_token");
      const refreshToken = await AsyncStorage.getItem("refresh_token");
      await axios.delete(`${SERVER_URI}/clear-notifications/${user._id}`, {
        headers: {
          "access-token": accessToken,
          "refresh-token": refreshToken,
        },
      });
    } catch (error) {
      console.error("Error clearing notifications:", error);
      Alert.alert("Error", "Failed to clear notifications. Please try again.");
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const accessToken = await AsyncStorage.getItem("access_token");
      const refreshToken = await AsyncStorage.getItem("refresh_token");
      await axios.put(
        `${SERVER_URI}/mark-notification-read/${notificationId}`,
        {},
        {
          headers: {
            "access-token": accessToken,
            "refresh-token": refreshToken,
          },
        }
      );
      setNotifications((prevNotifications) =>
        prevNotifications.map((notification) =>
          notification._id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
      setNotificationCount((prevCount) => ({
        ...prevCount,
        unreadCount: Math.max(0, prevCount.unreadCount - 1),
      }));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const renderNotificationItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.notificationItem, !item.read && styles.unreadNotification]}
      onPress={() => markAsRead(item._id)}
    >
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Feather
            name={item.read ? "check-circle" : "bell"}
            size={24}
            color={item.read ? "#4CAF50" : "#2467EC"}
          />
          <Text style={styles.notificationTimestamp}>
            {new Date(item.createdAt).toLocaleString()}
          </Text>
        </View>
        <Text style={styles.notificationMessage}>{item.textNotification}</Text>
        {item.userId === user?._id && (
          <Text style={styles.userSpecificTag}>Personal</Text>
        )}
        {item.count > 1 && (
          <View style={styles.countBadge}>
            <Text style={styles.notificationCount}>{item.count}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (userLoading || loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#2467EC" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          onPress={fetchNotifications}
          style={styles.retryButton}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.notificationCounts}>
          <View style={styles.countItem}>
            <Feather name="bell" size={20} color="#2467EC" />
            <Text style={styles.countText}>
              {notificationCount.unreadCount}
            </Text>
          </View>
          <View style={styles.countItem}>
            <Feather name="check-circle" size={20} color="#4CAF50" />
            <Text style={styles.countText}>
              {notificationCount.totalCount - notificationCount.unreadCount}
            </Text>
          </View>
        </View>
        {notifications.length > 0 && (
          <TouchableOpacity
            onPress={clearNotifications}
            style={styles.clearButton}
          >
            <Feather name="trash-2" size={24} color="#2467EC" />
          </TouchableOpacity>
        )}
      </View>
      {notifications.length > 0 ? (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Feather name="inbox" size={64} color="#C4C4C4" />
          <Text style={styles.emptyText}>Your inbox is empty</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  notificationCounts: {
    flexDirection: "row",
    alignItems: "center",
  },
  countItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  countText: {
    marginLeft: 4,
    fontSize: 16,
    fontWeight: "bold",
    color: "#1F2937",
  },
  clearButton: {
    padding: 8,
  },
  listContainer: {
    padding: 16,
  },
  notificationItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: "#2467EC",
  },
  notificationContent: {
    padding: 16,
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  notificationMessage: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1F2937",
    marginBottom: 8,
  },
  notificationTimestamp: {
    fontSize: 12,
    color: "#6B7280",
  },
  userSpecificTag: {
    fontSize: 12,
    color: "#2467EC",
    fontWeight: "600",
    marginTop: 4,
  },
  countBadge: {
    position: "absolute",
    bottom: 12,
    right: 12,
    backgroundColor: "#2467EC",
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  notificationCount: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 18,
    color: "#6B7280",
    marginTop: 16,
    fontWeight: "500",
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 18,
    color: "#EF4444",
    marginBottom: 16,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#2467EC",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});
