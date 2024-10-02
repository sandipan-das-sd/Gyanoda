import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import React, { useRef, useState, useEffect } from "react";
import Button from "@/components/button/button";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { SERVER_URI } from "@/utils/uri";
import { Toast } from "react-native-toast-notifications";

export default function VerifyAccountScreen() {
  const [code, setCode] = useState<string[]>(new Array(4).fill(""));
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputs = useRef<React.RefObject<TextInput>[]>(
    [...Array(4)].map(() => React.createRef<TextInput>())
  );

  useEffect(() => {
    let interval = setInterval(() => {
      setTimer((prevTimer) => {
        if (prevTimer === 0) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prevTimer - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleInput = (text: string, index: number) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);
    if (text && index < 3) {
      inputs.current[index + 1]?.current?.focus();
    }
    if (text === "" && index > 0) {
      inputs.current[index - 1]?.current?.focus();
    }
  };

  const handleSubmit = async () => {
    if (isLoading) return;
    setIsLoading(true);
    const otp = code.join("");
    const activation_token = await AsyncStorage.getItem("activation_token");
    if (activation_token) {
      try {
        await axios.post(`${SERVER_URI}/activate-user`, {
          activation_token,
          activation_code: otp,
        });
        Toast.show("Your account activated successfully!", {
          type: "success",
          placement: "bottom",
          duration: 4000,
        });
        setCode(new Array(4).fill(""));
        router.push("/(routes)/login");
      } catch (error) {
        Toast.show("Invalid OTP or OTP is expired", {
          type: "danger",
          placement: "bottom",
          duration: 4000,
        });
      }
    } else {
      Toast.show("Activation token not found", {
        type: "danger",
        placement: "bottom",
        duration: 4000,
      });
    }
    setIsLoading(false);
  };

  const handleResendCode = async () => {
    if (!canResend || isResending) return;
    setIsResending(true);
    try {
      const userInfoString = await AsyncStorage.getItem("user_info");
      if (!userInfoString) {
        Toast.show("User information not found. Please sign up again.", {
          type: "danger",
          placement: "bottom",
          duration: 5000,
        });
        setIsResending(false);
        return;
      }

      const userInfo = JSON.parse(userInfoString);

      const res = await axios.post(`${SERVER_URI}/registration`, {
        name: userInfo.name,
        email: userInfo.email,
        password: userInfo.password,
        phone: userInfo.phone,
        location: userInfo.location,
      });

      await AsyncStorage.setItem("activation_token", res.data.activationToken);

      Toast.show(
        "New verification code sent successfully. Please check your email and mobile SMS.",
        {
          type: "success",
          placement: "bottom",
          duration: 5000,
        }
      );
      setTimer(60);
      setCanResend(false);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        "Failed to resend code. Please try again.";
      Toast.show(errorMessage, {
        type: "danger",
        placement: "bottom",
        duration: 5000,
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>Verification Code</Text>
      <Text style={styles.subText}>
        We have sent the verification code to your email address and Mobile
        Number
      </Text>
      <View style={styles.inputContainer}>
        {code.map((_, index) => (
          <TextInput
            key={index}
            style={styles.inputBox}
            keyboardType="number-pad"
            maxLength={1}
            onChangeText={(text) => handleInput(text, index)}
            value={code[index]}
            ref={inputs.current[index]}
            autoFocus={index === 0}
          />
        ))}
      </View>
      <View style={styles.timerContainer}>
        <Text style={styles.timerText}>
          {timer > 0
            ? `Resend code in ${timer}s`
            : "You can now resend the code"}
        </Text>
      </View>
      <View style={{ marginTop: 10 }}>
        <Button title="Verify" onPress={handleSubmit} />
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#3876EE" />
          </View>
        )}
      </View>
      <TouchableOpacity
        style={[styles.resendButton, !canResend && styles.resendButtonDisabled]}
        onPress={handleResendCode}
        disabled={!canResend || isResending}
      >
        {isResending ? (
          <ActivityIndicator size="small" color="#3876EE" />
        ) : (
          <Text
            style={[
              styles.resendButtonText,
              !canResend && styles.resendButtonTextDisabled,
            ]}
          >
            Resend Code
          </Text>
        )}
      </TouchableOpacity>
      <View style={styles.loginLink}>
        <Text style={[styles.backText, { fontFamily: "Nunito_700Bold" }]}>
          Back To?
        </Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.loginText, { fontFamily: "Nunito_700Bold" }]}>
            Sign In
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  headerText: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    marginBottom: 20,
  },
  inputBox: {
    width: 60,
    height: 60,
    borderWidth: 1,
    borderColor: "#808080",
    textAlign: "center",
    marginRight: 10,
    borderRadius: 10,
    fontSize: 20,
  },
  timerContainer: {
    marginBottom: 10,
  },
  timerText: {
    fontSize: 14,
    color: "#666",
  },
  resendButton: {
    marginTop: 10,
    padding: 10,
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendButtonText: {
    color: "#3876EE",
    fontSize: 16,
  },
  resendButtonTextDisabled: {
    color: "#666",
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
  backText: {
    fontSize: 16,
  },
  loadingOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.7)",
  },
});
