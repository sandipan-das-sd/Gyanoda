import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { SERVER_URI } from "@/utils/uri";
import useUser from "@/hooks/auth/useUser";
import Loader from "@/components/loader/loader";
import CourseLesson from "@/components/courses/course.lesson";

const CourseDetailScreen = () => {
  const [activeButton, setActiveButton] = useState("About");
  const { user, loading } = useUser();
  const [isPrerequisitesExpanded, setIsPrerequisitesExpanded] = useState(false);
  const [isBenefitsExpanded, setIsBenefitsExpanded] = useState(false);
  const { item } = useLocalSearchParams();
  const courseData: CoursesType = JSON.parse(item as string);
  const [isPurchaseLoading, setIsPurchaseLoading] = useState(true);
  const [checkPurchased, setCheckPurchased] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInCart, setIsInCart] = useState(false);
  const [isAboutExpanded, setIsAboutExpanded] = useState(false);

  const fetchPurchasedCourses = useCallback(async () => {
    if (user && user._id) {
      try {
        setIsPurchaseLoading(true);
        const response = await axios.get(
          `${SERVER_URI}/get-all-courses/${user._id}`
        );
        const purchasedCourses = response.data.courses;
        const isPurchased = purchasedCourses.some(
          (course: any) => course._id === courseData._id
        );
        setCheckPurchased(isPurchased);
      } catch (error) {
        console.error("Error fetching purchased courses:", error);
      } finally {
        setIsPurchaseLoading(false);
      }
    }
  }, [user, courseData._id]);

  const renderRatingAndPurchaseStatus = () => (
    <View style={styles.ratingAndPurchaseContainer}>
      {checkPurchased && <Text style={styles.purchasedText}>Purchased</Text>}
    </View>
  );

  const checkIfInCart = useCallback(async () => {
    const existingCartData = await AsyncStorage.getItem("cart");
    const cartData = existingCartData ? JSON.parse(existingCartData) : [];
    const itemExists = cartData.some(
      (item: any) => item._id === courseData._id
    );
    setIsInCart(itemExists);
  }, [courseData._id]);

  useEffect(() => {
    fetchPurchasedCourses();
    checkIfInCart();
  }, [fetchPurchasedCourses, checkIfInCart]);

  const handleAddToCart = async () => {
    setIsLoading(true);
    const existingCartData = await AsyncStorage.getItem("cart");
    const cartData = existingCartData ? JSON.parse(existingCartData) : [];
    const itemExists = cartData.some(
      (item: any) => item._id === courseData._id
    );
    if (!itemExists) {
      cartData.push(courseData);
      await AsyncStorage.setItem("cart", JSON.stringify(cartData));
      setIsInCart(true);
    }
    setTimeout(() => {
      setIsLoading(false);
    }, 1500);
  };

  const handleGoToCourse = async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      router.push({
        pathname: "/(routes)/course-access",
        params: { courseData: JSON.stringify(courseData) },
      });
    } catch (error) {
      console.error("Error navigating to course:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderLimitedContent = (content: string, isExpanded: boolean) => {
    const limitedContent =
      content.slice(0, 150) + (content.length > 150 ? "..." : "");
    return isExpanded ? content : limitedContent;
  };

  const renderExpandButton = (
    content: string,
    isExpanded: boolean,
    setExpanded: (value: boolean) => void
  ) => {
    if (content.length > 150) {
      return (
        <TouchableOpacity onPress={() => setExpanded(!isExpanded)}>
          <Text style={styles.expandButton}>
            {isExpanded ? "Show Less" : "Show More"}
          </Text>
        </TouchableOpacity>
      );
    }
    return null;
  };

  const renderActionButton = () => {
    if (isPurchaseLoading) {
      return (
        <View style={styles.loadingButton}>
          <ActivityIndicator size="small" color="#FFFFFF" />
        </View>
      );
    }

    if (checkPurchased) {
      return (
        <TouchableOpacity
          style={[styles.actionButton, isLoading && styles.disabledButton]}
          onPress={handleGoToCourse}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.actionButtonText}>Go to the course</Text>
          )}
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={[styles.actionButton, isLoading && styles.disabledButton]}
        onPress={
          isInCart ? () => router.push("/(routes)/cart") : handleAddToCart
        }
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.actionButtonText}>
            {isInCart ? "Go to cart" : "Add to cart"}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <LinearGradient colors={["#E5ECF9", "#F6F7F9"]} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Image
          source={{ uri: courseData?.thumbnail?.url }}
          style={styles.thumbnail}
        />
        <View style={styles.contentContainer}>
          <Text style={styles.courseTitle}>{courseData?.name}</Text>
          {renderRatingAndPurchaseStatus()}

          <View style={styles.ratingContainer}>
            <FontAwesome name="star" size={14} color="#FFB800" />
            <Text style={styles.ratingText}>{courseData?.ratings}</Text>
            <Text style={styles.studentsText}>
              {courseData?.purchased} students
            </Text>
          </View>
          {!checkPurchased && (
            <View style={styles.priceContainer}>
              <Text style={styles.price}>₹{courseData?.price}</Text>
              <Text style={styles.originalPrice}>
                ₹{courseData?.estimatedPrice}
              </Text>
            </View>
          )}

          <View style={styles.tabContainer}>
            {["About", "Lessons"].map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeButton === tab && styles.activeTab]}
                onPress={() => setActiveButton(tab)}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeButton === tab && styles.activeTabText,
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {activeButton === "About" && (
            <View style={styles.sectionContainer}>
              <View style={styles.box}>
                <Text style={styles.sectionTitle}>About Course</Text>
                <Text style={styles.description}>
                  {renderLimitedContent(
                    courseData?.description,
                    isAboutExpanded
                  )}
                </Text>
                {renderExpandButton(
                  courseData?.description,
                  isAboutExpanded,
                  setIsAboutExpanded
                )}
              </View>

              <View style={styles.box}>
                <Text style={styles.sectionTitle}>Course Prerequisites</Text>
                <Text style={styles.description}>
                  {renderLimitedContent(
                    courseData?.prerequisites
                      .map((item) => item.title)
                      .join(". "),
                    isPrerequisitesExpanded
                  )}
                </Text>
                {renderExpandButton(
                  courseData?.prerequisites
                    .map((item) => item.title)
                    .join(". "),
                  isPrerequisitesExpanded,
                  setIsPrerequisitesExpanded
                )}
              </View>

              <View style={styles.box}>
                <Text style={styles.sectionTitle}>Course Benefits</Text>
                <Text style={styles.description}>
                  {renderLimitedContent(
                    courseData?.benefits.map((item) => item.title).join(". "),
                    isBenefitsExpanded
                  )}
                </Text>
                {renderExpandButton(
                  courseData?.benefits.map((item) => item.title).join(". "),
                  isBenefitsExpanded,
                  setIsBenefitsExpanded
                )}
              </View>
            </View>
          )}

          {activeButton === "Lessons" && (
            <View style={[styles.sectionContainer, styles.box]}>
              <CourseLesson courseDetails={courseData} />
            </View>
          )}
        </View>
      </ScrollView>
      <View style={styles.footer}>{renderActionButton()}</View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  thumbnail: {
    width: "100%",
    height: 230,
  },
  contentContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    padding: 24,
    paddingTop: 32,
  },
  courseTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#1A1A1A",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  ratingText: {
    marginLeft: 6,
    fontSize: 16,
    color: "#141517",
    fontWeight: "600",
  },
  studentsText: {
    marginLeft: 16,
    fontSize: 16,
    color: "#525258",
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  price: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2467EC",
  },
  originalPrice: {
    fontSize: 20,
    color: "#808080",
    textDecorationLine: "line-through",
    marginLeft: 12,
  },
  tabContainer: {
    flexDirection: "row",
    marginBottom: 20,
    borderRadius: 30,
    overflow: "hidden",
    backgroundColor: "#E1E9F8",
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 25,
  },
  activeTab: {
    backgroundColor: "#2467EC",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#525258",
  },
  activeTabText: {
    color: "#fff",
  },
  sectionContainer: {
    marginBottom: 24,
  },
  box: {
    backgroundColor: "#F8F9FA",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#1A1A1A",
  },
  description: {
    fontSize: 16,
    color: "#525258",
    lineHeight: 24,
    marginBottom: 12,
  },
  expandButton: {
    color: "#2467EC",
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 8,
  },
  footer: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E1E9F8",
  },
  actionButton: {
    backgroundColor: "#2467EC",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
  },
  disabledButton: {
    opacity: 0.7,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  loadingButton: {
    backgroundColor: "#2467EC",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
  },
  ratingAndPurchaseContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  purchasedIndicator: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  purchasedText: {
    color: "#4CAF50",
    fontWeight: "bold",
    fontSize: 18,
  },
});

export default CourseDetailScreen;
