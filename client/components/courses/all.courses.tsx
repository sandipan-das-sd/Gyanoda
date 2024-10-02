import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  LayoutAnimation,
  UIManager,
  Platform,
  StyleSheet,
} from "react-native";
import {
  useFonts,
  Raleway_700Bold,
  Raleway_600SemiBold,
} from "@expo-google-fonts/raleway";
import {
  Nunito_600SemiBold,
  Nunito_500Medium,
} from "@expo-google-fonts/nunito";
import axios from "axios";
import { SERVER_URI } from "@/utils/uri";
import CourseCard from "../cards/course.card";
import { router } from "expo-router";
import NetInfo from "@react-native-community/netinfo";
import { MaterialIcons } from "@expo/vector-icons";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function AllCourses({ refresh }: { refresh: number }) {
  const [courses, setCourses] = useState<CoursesType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [networkError, setNetworkError] = useState(false);
  const flatListRef = useRef(null);

  const fetchCourses = async (retryCount = 0) => {
    setIsLoading(true);
    setNetworkError(false);

    try {
      const networkState = await NetInfo.fetch();

      if (!networkState.isConnected) {
        throw new Error("No internet connection");
      }

      const response = await axios.get(`${SERVER_URI}/get-courses`, {
        timeout: 30000, // Increase timeout to 30 seconds
      });
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setCourses(response.data.courses);
      setIsLoading(false);
    } catch (error) {
      console.error("Fetch courses error:", error);

      if (axios.isAxiosError(error)) {
        if (error.code === "ECONNABORTED") {
          console.log("Request timed out");
        } else if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.log(
            "Server responded with error:",
            error.response.status,
            error.response.data
          );
        } else if (error.request) {
          // The request was made but no response was received
          console.log("No response received:", error.request);
        } else {
          // Something happened in setting up the request that triggered an Error
          console.log("Error setting up request:", error.message);
        }
      }

      if (retryCount < 3) {
        console.log(`Retrying... Attempt ${retryCount + 1}`);
        setTimeout(() => fetchCourses(retryCount + 1), 2000); // Retry after 2 seconds
      } else {
        setNetworkError(true);
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [refresh]);

  let [fontsLoaded, fontError] = useFonts({
    Raleway_700Bold,
    Nunito_600SemiBold,
    Raleway_600SemiBold,
    Nunito_500Medium,
  });

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <View style={{ flex: 1, marginHorizontal: 10, marginTop: 5 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text
          style={{
            fontSize: 20,
            color: "#000000",
            fontFamily: "Raleway_700Bold",
          }}
        >
          Courses
        </Text>
        <TouchableOpacity onPress={() => router.push("/(tabs)/courses")}>
          <Text
            style={{
              fontSize: 15,
              color: "#2467EC",
              fontFamily: "Nunito_600SemiBold",
            }}
          >
            See All
          </Text>
        </TouchableOpacity>
      </View>
      {networkError ? (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={50} color="#FF6B6B" />
          <Text style={styles.errorText}>Network Error</Text>
          <Text style={styles.errorSubText}>
            Please check your internet connection and try again
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchCourses()}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          style={{ alignItems: "center" }}
          ref={flatListRef}
          data={isLoading ? Array(3).fill({}) : courses}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, index) =>
            item._id ? item._id.toString() : index.toString()
          }
          renderItem={({ item }) => (
            <CourseCard item={item} isLoading={isLoading} />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    borderRadius: 10,
    padding: 20,
    marginVertical: 10,
  },
  errorText: {
    fontSize: 18,
    fontFamily: "Raleway_700Bold",
    color: "#ff3b30",
    marginBottom: 10,
  },
  errorSubText: {
    fontSize: 14,
    fontFamily: "Nunito_500Medium",
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#2467EC",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: "#fff",
    fontFamily: "Nunito_600SemiBold",
    fontSize: 16,
  },
});
