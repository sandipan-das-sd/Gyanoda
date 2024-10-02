import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  useFonts,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_400Regular,
} from "@expo-google-fonts/nunito";
import { router } from "expo-router";
import { SERVER_URI } from "@/utils/uri";
export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  let [fontsLoaded, fontError] = useFonts({
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_400Regular,
  });

  if (!fontsLoaded && !fontError) {
    return null;
  }

  const handleSend = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${SERVER_URI}/forget-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Success", "Reset password link sent to your email.");
      } else {
        Alert.alert("Error", data.message || "Something went wrong!");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to send reset password email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#E5ECF9", "#F6F7F9"]} style={styles.container}>
      <Text style={[styles.headerText, { fontFamily: "Nunito_600SemiBold" }]}>
        Reset Email Password
      </Text>
      <TextInput
        style={[styles.input, { fontFamily: "Nunito_400Regular" }]}
        placeholder="example@email.com"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TouchableOpacity
        style={styles.button}
        onPress={handleSend}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text
            style={[styles.buttonText, { fontFamily: "Nunito_600SemiBold" }]}
          >
            Send
          </Text>
        )}
      </TouchableOpacity>
      <View style={styles.loginLink}>
        <Text style={[styles.backText, { fontFamily: "Nunito_700Bold" }]}>
          Back To?
        </Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.loginText, { fontFamily: "Nunito_700Bold" }]}>
            Login
          </Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  headerText: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#3876EE",
    width: "50%",
    height: 45,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 50,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
  },
  loginLink: {
    flexDirection: "row",
    marginTop: 30,
  },
  loginText: {
    color: "#3876EE",
    marginLeft: 5,
    fontSize: 16,
  },
  backText: { fontSize: 16 },
});
