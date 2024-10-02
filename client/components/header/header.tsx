import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
} from "react-native";
import { Raleway_700Bold } from "@expo-google-fonts/raleway";
import { useFonts } from "expo-font";
import useUser from "@/hooks/auth/useUser";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Skeleton } from "@rneui/themed";
import io from "socket.io-client";
import axios from "axios";
import { SERVER_URI } from "@/utils/uri";

// Custom hook for typing animation
const useTypingAnimation = (text: string, typingSpeed = 150) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isTypingComplete, setIsTypingComplete] = useState(false);

  useEffect(() => {
    let i = 0;
    setIsTypingComplete(false);
    setDisplayedText("");

    const typingInterval = setInterval(() => {
      if (i < text.length) {
        setDisplayedText((prev) => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(typingInterval);
        setIsTypingComplete(true);
      }
    }, typingSpeed);

    return () => clearInterval(typingInterval);
  }, [text, typingSpeed]);

  return { displayedText, isTypingComplete };
};

export default function Header({
  refreshKey,
  onImageUpdate,
}: {
  refreshKey: number;
  onImageUpdate: () => void;
}) {
  const [cartItems, setCartItems] = useState([]);
  const [notificationCount, setNotificationCount] = useState({
    totalCount: 0,
    unreadCount: 0,
  });
  const [imageLoading, setImageLoading] = useState(true);
  const { user, refetch } = useUser();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const imageUrl = user?.avatar?.url || null;

  const { displayedText, isTypingComplete } = useTypingAnimation(
    user?.name || "Champ!!",
    100
  );

  const shakeAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shakeAnimation, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnimation, {
          toValue: -1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnimation, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [shakeAnimation]);

  const shakeInterpolation = shakeAnimation.interpolate({
    inputRange: [-1, 1],
    outputRange: ["-10deg", "10deg"],
  });

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

  useEffect(() => {
    fetchNotificationCount();

    intervalRef.current = setInterval(() => {
      fetchNotificationCount();
    }, 5000);

    const socket = io(SERVER_URI);

    const handleAuthentication = async () => {
      const accessToken = await AsyncStorage.getItem("access_token");
      socket.emit("authenticate", { token: accessToken });
    };

    socket.on("connect", handleAuthentication);

    socket.on("authenticated", () => {
      if (user?._id) {
        socket.emit("join", user._id);
      }
    });

    socket.on("adminNotification", async () => {
      await fetchNotificationCount();
    });

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      socket.disconnect();
    };
  }, [user?._id, fetchNotificationCount]);

  useEffect(() => {
    const fetchCartItems = async () => {
      const cart = await AsyncStorage.getItem("cart");
      setCartItems(JSON.parse(cart ?? "") || []);
    };
    fetchCartItems();
  }, [refreshKey]);

  useEffect(() => {
    refetch();
  }, [refreshKey, refetch]);

  useEffect(() => {
    onImageUpdate();
  }, [onImageUpdate]);

  let [fontsLoaded] = useFonts({
    Raleway_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerWrapper}>
        <TouchableOpacity onPress={() => router.push("/(tabs)/profile")}>
          <View style={styles.imageContainer}>
            {imageLoading && (
              <Skeleton
                width={45}
                height={45}
                animation="wave"
                style={styles.skeleton}
              />
            )}
            {imageUrl ? (
              <Image
                source={{ uri: imageUrl }}
                style={[styles.image, imageLoading && styles.imageHidden]}
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            ) : (
              <Image
                source={require("@/assets/icons/User.png")}
                style={styles.image}
                onLoad={handleImageLoad}
              />
            )}
          </View>
        </TouchableOpacity>
        <View>
          <View style={styles.helloContainer}>
            <Text style={[styles.helloText, { fontFamily: "Raleway_700Bold" }]}>
              Hello
            </Text>
            <Animated.Text
              style={[
                styles.helloEmoji,
                {
                  fontFamily: "Raleway_700Bold",
                  transform: [{ rotate: shakeInterpolation }],
                },
              ]}
            >
              👋
            </Animated.Text>
          </View>
          <Text style={[styles.text, { fontFamily: "Raleway_700Bold" }]}>
            {displayedText}
            {!isTypingComplete && <Text style={styles.cursor}>|</Text>}
            {isTypingComplete && " 😊"}
          </Text>
        </View>
      </View>
      <View style={styles.iconContainer}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.push("/(routes)/notification")}
        >
          <Feather name="bell" size={26} color="black" />
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>
              {notificationCount.unreadCount}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.push("/(routes)/cart")}
        >
          <Feather name="shopping-bag" size={26} color="black" />
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>{cartItems?.length}</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    width: "100%",
  },
  headerWrapper: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  imageContainer: {
    position: "relative",
    width: 45,
    height: 45,
    marginRight: 8,
    borderRadius: 100,
    overflow: "hidden",
  },
  image: {
    width: 45,
    height: 45,
    borderRadius: 100,
  },
  imageHidden: {
    opacity: 0,
  },
  skeleton: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 45,
    height: 45,
    borderRadius: 100,
    backgroundColor: "#FDD6D7",
  },
  text: {
    fontSize: 16,
  },
  iconContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    borderWidth: 1,
    borderColor: "#E1E2E5",
    width: 45,
    height: 45,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    marginLeft: 8,
  },
  badgeContainer: {
    width: 20,
    height: 20,
    backgroundColor: "#2467EC",
    position: "absolute",
    borderRadius: 50,
    right: -5,
    top: -5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: 14,
  },
  helloText: {
    color: "#7C7C80",
    fontSize: 14,
  },
  helloContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  helloEmoji: {
    marginLeft: 1,
    fontSize: 14,
  },
  cursor: {
    opacity: 1,
    fontWeight: "100",
    color: "#000",
  },
});
