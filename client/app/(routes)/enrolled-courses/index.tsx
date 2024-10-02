import React, { useEffect, useState, useCallback } from "react";
import {
  FlatList,
  View,
  RefreshControl,
  Text,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import { useRouter } from "expo-router";
import CourseCard from "@/components/cards/course.card";
import Loader from "@/components/loader/loader";
import useUser from "@/hooks/auth/useUser";
import { SERVER_URI } from "@/utils/uri";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface CourseType {
  _id: string;
  name: string;
}

export default function EnrolledCourses() {
  const [courses, setCourses] = useState<CourseType[]>([]);
  const [courseLoading, setCourseLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useUser();
  const router = useRouter();

  const fetchPurchasedCourses = useCallback(async () => {
    if (!user?._id) return;

    setCourseLoading(true);
    try {
      const response = await axios.get(
        `${SERVER_URI}/get-all-courses/${user._id}`,
        {
          headers: {
            "access-token": await AsyncStorage.getItem("access_token"),
            "refresh-token": await AsyncStorage.getItem("refresh_token"),
          },
        }
      );

      if (response.data.success) {
        setCourses(response.data.courses);
      } else {
        console.error("Failed to fetch purchased courses");
      }
    } catch (error) {
      console.error("Error fetching purchased courses:", error);
    } finally {
      setCourseLoading(false);
    }
  }, [user?._id]);

  useEffect(() => {
    fetchPurchasedCourses();
  }, [fetchPurchasedCourses]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPurchasedCourses();
    setRefreshing(false);
  }, [fetchPurchasedCourses]);

  if (courseLoading && courses.length === 0) {
    return <Loader />;
  }

  return (
    <LinearGradient colors={["#E5ECF9", "#F6F7F9"]} style={{ flex: 1 }}>
      {courses.length === 0 ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text style={{ fontSize: 18, marginBottom: 20 }}>
            You don't have any enrolled courses
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: "#007AFF",
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: 5,
            }}
            onPress={() => router.push("/(tabs)/courses")}
          >
            <Text style={{ color: "white", fontSize: 16 }}>
              Explore Courses
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          style={{ paddingRight: 11 }}
          data={courses}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item._id.toString()}
          renderItem={({ item }) => <CourseCard item={item} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </LinearGradient>
  );
}
