import React, { memo, useCallback, useState, useEffect } from "react";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Animated,
} from "react-native";
import { widthPercentageToDP as wp } from "react-native-responsive-screen";
import SkeletonLoader from "@/utils/skeleton.loader";
import useUser from "@/hooks/auth/useUser";
import axios from "axios";
import { SERVER_URI } from "@/utils/uri";

interface CoursesType {
  _id: string;
  thumbnail: { url: string };
  name: string;
  ratings: number;
  purchased: number;
  price: number;
  estimatedPrice: number;
  courseData: any[];
}

interface CourseCardProps {
  item: CoursesType;
  isLoading: boolean;
}

const LoadingIndicator = () => {
  const [rotation] = useState(new Animated.Value(0));

  const [messageIndex, setMessageIndex] = useState(0);

  const messages = ["Loading..."];

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();

    const messageTimer = setInterval(() => {
      setMessageIndex((prevIndex) => (prevIndex + 1) % messages.length);
    }, 4000);

    return () => clearInterval(messageTimer);
  }, []);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={loaderStyles.container}>
      <Animated.View
        style={[loaderStyles.spinner, { transform: [{ rotate: spin }] }]}
      >
        <FontAwesome name="circle-o-notch" size={40} color="#FFFFFF" />
      </Animated.View>
      <Text style={loaderStyles.loadingText}>{messages[messageIndex]}</Text>
    </View>
  );
};

const CourseCard: React.FC<CourseCardProps> = memo(
  ({ item, isLoading: initialLoading }) => {
    const [isClicked, setIsClicked] = useState(false);
    const [isPurchased, setIsPurchased] = useState(false);
    const { user } = useUser();

    useEffect(() => {
      const checkPurchaseStatus = async () => {
        if (user && user._id) {
          try {
            const response = await axios.get(
              `${SERVER_URI}/get-all-courses/${user._id}`
            );
            const purchasedCourses = response.data.courses;
            setIsPurchased(
              purchasedCourses.some(
                (course: CoursesType) => course._id === item._id
              )
            );
          } catch (error) {
            console.error("Error fetching purchase status:", error);
          }
        }
      };

      checkPurchaseStatus();
    }, [user, item._id]);

    const handlePress = useCallback(() => {
      setIsClicked(true);
      setTimeout(() => {
        const itemString = JSON.stringify(item);
        router.push({
          pathname: "/(routes)/course-details",
          params: { item: itemString },
        });
        setIsClicked(false);
      }, 1500);
    }, [item]);

    if (initialLoading) {
      return <SkeletonLoader />;
    }

    return (
      <TouchableOpacity
        style={styles.container}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <Image
          style={styles.thumbnail}
          source={{ uri: item?.thumbnail?.url }}
        />
        <View style={styles.contentContainer}>
          <Text
            style={styles.courseName}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {item.name}
          </Text>
          <View style={styles.ratingContainer}>
            <View style={styles.ratingBadge}>
              <FontAwesome name="star" size={14} color="#ffb800" />
              <Text style={styles.ratingText}>{item.ratings.toFixed(1)}</Text>
            </View>
            <Text style={styles.studentsText}>{item.purchased} Students</Text>
          </View>
          <View style={styles.priceContainer}>
            <View style={styles.priceWrapper}>
              {isPurchased ? (
                <Text style={styles.purchasedText}>Purchased</Text>
              ) : (
                <>
                  <View style={styles.priceInfo}>
                    <Text style={styles.currentPrice}>₹{item.price}</Text>
                    <Text style={styles.originalPrice}>
                      ₹{item.estimatedPrice}
                    </Text>
                  </View>
                </>
              )}
            </View>
            <View style={styles.lectureInfo}>
              <Ionicons name="list-outline" size={20} color="#8A8A8A" />
              <Text style={styles.lectureCount}>
                {item.courseData.length} Lectures
              </Text>
            </View>
          </View>
        </View>
        {isClicked && (
          <View style={styles.loaderOverlay}>
            <LoadingIndicator />
          </View>
        )}
      </TouchableOpacity>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    width: "95%",
    overflow: "hidden",
    margin: 15,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  thumbnail: {
    width: wp(86),
    height: wp(86) * (9 / 16),
    borderRadius: 8,
    alignSelf: "center",
    resizeMode: "cover",
  },
  contentContainer: {
    width: wp(85),
    paddingVertical: 10,
  },
  courseName: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: "left",
    marginBottom: 8,
    fontFamily: "Raleway_600SemiBold",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#141517",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  ratingText: {
    color: "white",
    fontSize: 14,
    marginLeft: 4,
    fontFamily: "Nunito_600SemiBold",
  },
  studentsText: {
    fontSize: 14,
    color: "#666",
    fontFamily: "Nunito_400Regular",
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  priceWrapper: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  currentPrice: {
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "Nunito_700Bold",
    color: "#2467EC",
  },
  originalPrice: {
    paddingLeft: 5,
    textDecorationLine: "line-through",
    fontSize: 14,
    fontWeight: "400",
    color: "#888",
    fontFamily: "Nunito_400Regular",
  },
  lectureInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  lectureCount: {
    marginLeft: 5,
    fontSize: 14,
    color: "#666",
    fontFamily: "Nunito_500Medium",
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  purchasedText: {
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "Nunito_700Bold",
    color: "#4CAF50",
  },
  priceInfo: {
    flexDirection: "row",
    alignItems: "baseline",
  },
});

const loaderStyles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
  spinner: {
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Nunito_600SemiBold",
    color: "#FFFFFF",
  },
});

export default CourseCard;
