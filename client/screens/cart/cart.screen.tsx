import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback } from "react";
import { Entypo, FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Loader from "@/components/loader/loader";
import useUser from "@/hooks/auth/useUser";
import { SERVER_URI } from "@/utils/uri";
import RazorpayCheckout from "react-native-razorpay";
import { Redirect, router } from "expo-router";
import { AxiosError } from "axios";
import { Toast } from "react-native-toast-notifications";
export default function CartScreen() {
  const [cartItems, setCartItems] = useState<CoursesType[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const { user, loading } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [purchasedCourses, setPurchasedCourses] = useState<string[]>([]);
  useEffect(() => {
    const fetchCartItems = async () => {
      const cart: any = await AsyncStorage.getItem("cart");
      setCartItems(JSON.parse(cart));
    };
    fetchCartItems();
  }, []);
  useEffect(() => {
    const fetchPurchasedCourses = async () => {
      if (user && user._id) {
        try {
          const response = await axios.get(
            `${SERVER_URI}/get-all-courses/${user._id}`
          );
          const purchasedCoursesIds = response.data.courses.map(
            (course: any) => course._id
          );
          setPurchasedCourses(purchasedCoursesIds);

          // Filter out purchased courses from cart
          const filteredCart = cartItems.filter(
            (item) => !purchasedCoursesIds.includes(item._id)
          );
          setCartItems(filteredCart);
          await AsyncStorage.setItem("cart", JSON.stringify(filteredCart));
        } catch (error) {
          console.error("Error fetching purchased courses:", error);
        }
      }
    };
    fetchPurchasedCourses();
  }, [user]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const cart: any = await AsyncStorage.getItem("cart");
    let parsedCart = JSON.parse(cart);

    // Filter out purchased courses
    parsedCart = parsedCart.filter(
      (item: CoursesType) => !purchasedCourses.includes(item._id)
    );

    setCartItems(parsedCart);
    await AsyncStorage.setItem("cart", JSON.stringify(parsedCart));
    setRefreshing(false);
  }, [purchasedCourses]);

  const calculateTotalPrice = () => {
    const totalPrice = cartItems.reduce((total, item) => total + item.price, 0);
    return totalPrice.toFixed(2);
  };

  const handleCourseDetails = (courseDetails: any) => {
    router.push({
      pathname: "/(routes)/course-details",
      params: { item: JSON.stringify(courseDetails) },
    });
  };

  const handleRemoveItem = async (item: any) => {
    const existingCartData = await AsyncStorage.getItem("cart");
    const cartData = existingCartData ? JSON.parse(existingCartData) : [];
    const updatedCartData = cartData.filter((i: any) => i._id !== item._id);
    await AsyncStorage.setItem("cart", JSON.stringify(updatedCartData));
    setCartItems(updatedCartData);
  };

  interface ErrorResponse {
    error?: string;
  }

  const handlePayment = async () => {
    setIsLoading(true);
    try {
      const accessToken = await AsyncStorage.getItem("access_token");
      const refreshToken = await AsyncStorage.getItem("refresh_token");
      const amount = Math.round(
        cartItems.reduce((total, item) => total + item.price, 0) * 100
      );

      console.log("Sending order creation request with amount:", amount);

      const paymentOrderResponse = await axios.post(
        `${SERVER_URI}/create-order`,
        { amount, currency: "INR" },
        {
          headers: {
            "access-token": accessToken,
            "refresh-token": refreshToken,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Server response:", paymentOrderResponse.data);

      const { id: order_id, amount: orderAmount } = paymentOrderResponse.data;

      const options = {
        description: "Course Purchase",
        image:
          "https://res.cloudinary.com/dv9h1noz9/image/upload/v1725727334/pamg8mftyshstqe1whay.png",
        currency: "INR",
        key: "rzp_live_sHX5TUP5I7LvKX",
        amount: orderAmount,
        name: "Gyanoda ",
        order_id: order_id,
        prefill: {
          email: user?.email || "user@example.com",
          contact: user?.phone || "9999999999",
          name: user?.name || "Gyanoda",
        },
        theme: { color: "#7CB9E8" },
      };

      console.log("Razorpay options:", options);

      RazorpayCheckout.open(options as any)
        .then((data) => {
          console.log("Razorpay success callback data:", data);
          Alert.alert("Success", `Payment ID: ${data.razorpay_payment_id}`);
          verifyPayment(data);
        })
        .catch((error) => {
          console.error("Razorpay Error:", error);
          Alert.alert(
            "Error",
            error.code && error.description
              ? `Payment failed: ${error.code} | ${error.description}`
              : `Payment Failed :-(`
          );
        });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ErrorResponse>;
        console.error("Axios error in handlePayment:", {
          message: axiosError.message,
          response: axiosError.response?.data,
          status: axiosError.response?.status,
          headers: axiosError.response?.headers,
        });

        const errorMessage =
          axiosError.response?.data?.error ||
          axiosError.message ||
          "An unknown error occurred";
        Alert.alert("Error", `Failed to create order: ${errorMessage}`);
      } else {
        console.error("Unknown error in handlePayment:", error);
        Alert.alert("Error", "An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const verifyPayment = async (paymentResponse: any) => {
    try {
      console.log("Verifying payment with response:", paymentResponse);
      const accessToken = await AsyncStorage.getItem("access_token");
      const refreshToken = await AsyncStorage.getItem("refresh_token");

      const verificationData = {
        razorpay_order_id: paymentResponse.razorpay_order_id,
        razorpay_payment_id: paymentResponse.razorpay_payment_id,
        razorpay_signature: paymentResponse.razorpay_signature,
        courseIds: cartItems.map((item) => item._id),
      };

      console.log("Sending verification request with data:", verificationData);

      const response = await axios.post(
        `${SERVER_URI}/validate`,
        verificationData,
        {
          headers: {
            "access-token": accessToken,
            "refresh-token": refreshToken,
          },
        }
      );

      console.log("Verification response:", response.data);

      if (response.data.success) {
        // Changed condition here
        await AsyncStorage.removeItem("cart");
        setCartItems([]);
        setOrderSuccess(true);
        Alert.alert("Success", "Your course has been purchased successfully!");
        setTimeout(() => {
          router.replace("/(tabs)/courses");
        }, 3000);
      } else {
        console.error("Payment verification failed:", response.data);
        Alert.alert("Error", "Payment verification failed. Please try again.");
      }
    } catch (error) {
      console.error("Verification request failed:", error);
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ErrorResponse>;
        console.error("Axios error in verifyPayment:", {
          message: axiosError.message,
          response: axiosError.response?.data,
          status: axiosError.response?.status,
          headers: axiosError.response?.headers,
        });
      }
      Alert.alert("Error", "Verification request failed. Please try again.");
    }
  };

  return (
    <>
      {loading ? (
        <Loader />
      ) : (
        <LinearGradient
          colors={["#E5ECF9", "#F6F7F9"]}
          style={{ flex: 1, backgroundColor: "white" }}
        >
          {orderSuccess ? (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Image
                source={require("@/assets/images/account_confirmation.png")}
                style={{
                  width: 200,
                  height: 200,
                  resizeMode: "contain",
                  marginBottom: 20,
                }}
              />
              <View style={{ alignItems: "center", marginBottom: 20 }}>
                <Text style={{ fontSize: 22, fontFamily: "Raleway_700Bold" }}>
                  Payment Successful!
                </Text>
                <Text
                  style={{
                    fontSize: 15,
                    marginTop: 5,
                    color: "#575757",
                    fontFamily: "Nunito_400Regular",
                  }}
                >
                  Thank you for your purchase!
                </Text>
              </View>
              <View style={{ alignItems: "center", marginBottom: 20 }}>
                <Text style={{ fontSize: 16, color: "575757" }}>
                  You will receive one email shortly!
                </Text>
              </View>
            </View>
          ) : (
            <>
              <FlatList
                data={cartItems}
                keyExtractor={(item) => item._id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={{
                      flexDirection: "row",
                      marginVertical: 8,
                      marginHorizontal: 8,
                      borderRadius: 8,
                      padding: 10,
                      backgroundColor: "white",
                    }}
                  >
                    <TouchableOpacity onPress={() => handleCourseDetails(item)}>
                      <Image
                        source={{ uri: item.thumbnail?.url! }}
                        style={{
                          width: 100,
                          height: 100,
                          marginRight: 16,
                          borderRadius: 8,
                        }}
                      />
                    </TouchableOpacity>
                    <View style={{ flex: 1, justifyContent: "space-between" }}>
                      <TouchableOpacity
                        onPress={() => handleCourseDetails(item)}
                      >
                        <Text
                          style={{
                            fontSize: 16,
                            fontWeight: "600",
                            fontFamily: "Nunito_700Bold",
                          }}
                        >
                          {item?.name}
                        </Text>
                      </TouchableOpacity>
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                        }}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                          }}
                        >
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              marginRight: 16,
                            }}
                          >
                            <Entypo
                              name="dot-single"
                              size={24}
                              color={"gray"}
                            />
                            <Text
                              style={{
                                fontSize: 16,
                                color: "#808080",
                                fontFamily: "Nunito_400Regular",
                              }}
                            >
                              {item.level}
                            </Text>
                          </View>
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              marginRight: 16,
                            }}
                          >
                            <FontAwesome
                              name="inr"
                              size={14}
                              color={"#808080"}
                            />
                            <Text
                              style={{
                                marginLeft: 3,
                                fontSize: 16,
                                color: "#808080",
                              }}
                            >
                              {item.price}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={{
                          backgroundColor: "#FF6347",
                          borderRadius: 50,
                          padding: 5,
                          marginTop: 10,
                          width: 100,
                          alignSelf: "flex-start",
                        }}
                        onPress={() => handleRemoveItem(item)}
                      >
                        <Text
                          style={{
                            color: "white",
                            fontSize: 16,
                            textAlign: "center",
                            fontFamily: "Nunito_600SemiBold",
                          }}
                        >
                          Remove
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={() => (
                  <View
                    style={{
                      flex: 1,
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 20,
                    }}
                  >
                    <Image
                      source={require("@/assets/cart_1.png")}
                      style={{ width: 200, height: 200, resizeMode: "contain" }}
                    />
                    <Text
                      style={{
                        fontSize: 24,
                        marginTop: 20,
                        color: "#333",
                        fontFamily: "Raleway_600SemiBold",
                      }}
                    >
                      Your Cart is Empty!
                    </Text>
                  </View>
                )}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                  />
                }
              />

              <View style={{ marginBottom: 25 }}>
                {cartItems?.length === 0 ||
                  (cartItems?.length > 0 && (
                    <Text
                      style={{
                        fontSize: 18,
                        textAlign: "center",
                        marginTop: 20,
                        fontFamily: "Nunito_700Bold",
                      }}
                    >
                      Total Price: ₹{calculateTotalPrice()}
                    </Text>
                  ))}
                {cartItems?.length === 0 ||
                  (cartItems?.length > 0 && (
                    <TouchableOpacity
                      style={{
                        backgroundColor: "#007BFF",
                        borderRadius: 50,
                        padding: 10,
                        marginTop: 20,
                        width: "80%",
                        alignSelf: "center",
                        flexDirection: "row",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                      onPress={handlePayment}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <ActivityIndicator
                          size="small"
                          color="white"
                          style={{ marginRight: 10 }}
                        />
                      ) : null}
                      <Text
                        style={{
                          color: "white",
                          fontSize: 18,
                          textAlign: "center",
                          fontFamily: "Nunito_600SemiBold",
                        }}
                      >
                        {isLoading ? "Processing..." : "Go for payment"}
                      </Text>
                    </TouchableOpacity>
                  ))}
              </View>
            </>
          )}
        </LinearGradient>
      )}
    </>
  );
}
