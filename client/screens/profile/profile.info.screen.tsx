import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  useFonts,
  Raleway_600SemiBold,
  Raleway_700Bold,
} from "@expo-google-fonts/raleway";
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from "@expo-google-fonts/nunito";
import { Ionicons } from "@expo/vector-icons";
import useUser from "@/hooks/auth/useUser";
import axios from "axios";
import { SERVER_URI } from "@/utils/uri";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Loader from "@/components/loader/loader";

export default function ProfileDetailsScreen() {
  const { user, refetch } = useUser();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(true);

  let [fontsLoaded, fontError] = useFonts({
    Raleway_600SemiBold,
    Raleway_700Bold,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  useEffect(() => {
    fetchUserProfile();
  }, [user]);

  const fetchUserProfile = () => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setPhone(user.phone?.toString() || "");
      setLocation(user.location || "");
      setFetchingProfile(false);
    }
  };

  const updateProfileHandler = async () => {
    setLoading(true);
    try {
      const accessToken = await AsyncStorage.getItem("access_token");
      const refreshToken = await AsyncStorage.getItem("refresh_token");
      const userId = user?._id;

      if (!userId) {
        Alert.alert("Error", "User ID not found");
        return;
      }

      const response = await axios.put(
        `${SERVER_URI}/get-info-update/${userId}`,
        { name },
        {
          headers: {
            "access-token": accessToken,
            "refresh-token": refreshToken,
          },
        }
      );

      if (response.data && response.data.user) {
        Alert.alert("Success", "Name updated successfully");
        refetch(); // Refetch user data to update the context
        router.back();
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      if (axios.isAxiosError(error) && error.response) {
        // Handle specific error messages from the server
        Alert.alert(
          "Error",
          error.response.data.message || "Failed to update profile"
        );
      } else {
        Alert.alert("Error", "An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!fontsLoaded && !fontError) {
    return null;
  }

  if (fetchingProfile) {
    return <Loader />;
  }

  return (
    <LinearGradient colors={["#E5ECF9", "#F6F7F9"]} style={styles.gradient}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile Details</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.inputContainer}>
            <Ionicons
              name="person-outline"
              size={24}
              color="#2467EC"
              style={styles.icon}
            />
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons
              name="mail-outline"
              size={24}
              color="#2467EC"
              style={styles.icon}
            />
            <TextInput
              style={[styles.input, styles.readOnlyInput]}
              value={email}
              editable={false}
              placeholder="Your email"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons
              name="call-outline"
              size={24}
              color="#2467EC"
              style={styles.icon}
            />
            <TextInput
              style={[styles.input, styles.readOnlyInput]}
              value={phone}
              editable={false}
              placeholder="Your phone number"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons
              name="location-outline"
              size={24}
              color="#2467EC"
              style={styles.icon}
            />
            <TextInput
              style={[styles.input, styles.readOnlyInput]}
              value={location}
              editable={false}
              placeholder="Your location"
              placeholderTextColor="#999"
            />
          </View>

          <TouchableOpacity
            style={styles.updateButton}
            onPress={updateProfileHandler}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.updateButtonText}>Update Name</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Welcome, Champ!</Text>
          <Text style={styles.infoText}>
            You can only update your name here. the other fields can't be
            updatable.
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: "Raleway_700Bold",
    color: "#333",
    textAlign: "center",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    fontFamily: "Nunito_400Regular",
    color: "#1A1A1A",
  },
  updateButton: {
    backgroundColor: "#2467EC",
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 10,
  },
  updateButtonText: {
    color: "white",
    fontSize: 18,
    fontFamily: "Raleway_600SemiBold",
  },
  infoCard: {
    backgroundColor: "#F0F4FF",
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 30,
  },
  infoTitle: {
    fontSize: 20,
    fontFamily: "Raleway_700Bold",
    color: "#2467EC",
    marginBottom: 10,
  },
  infoText: {
    fontSize: 16,
    fontFamily: "Nunito_400Regular",
    color: "#333",
    lineHeight: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  readOnlyInput: {
    color: "#666",
  },
});
