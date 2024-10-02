import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ImageBackground,
} from "react-native";
import {
  Entypo,
  FontAwesome,
  Fontisto,
  Ionicons,
  SimpleLineIcons,
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  useFonts,
  Raleway_700Bold,
  Raleway_600SemiBold,
} from "@expo-google-fonts/raleway";
import {
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_700Bold,
  Nunito_600SemiBold,
} from "@expo-google-fonts/nunito";
import { commonStyles } from "@/styles/common/common.styles";
import { router, useLocalSearchParams } from "expo-router";
import axios from "axios";
import { SERVER_URI } from "@/utils/uri";
import { Toast } from "react-native-toast-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CheckBox } from "react-native-elements";

export default function LoginScreen() {
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [buttonSpinner, setButtonSpinner] = useState(false);
  const [userInfo, setUserInfo] = useState({
    email: "",
    password: "",
  });
  const [required, setRequired] = useState("");
  const [error, setError] = useState({
    password: "",
  });
  const [rememberMe, setRememberMe] = useState(false);
  const { reset } = useLocalSearchParams();

  useEffect(() => {
    if (reset === "true") {
      router.setParams({ reset: "false" });
    }
  }, [reset]);

  let [fontsLoaded, fontError] = useFonts({
    Raleway_600SemiBold,
    Raleway_700Bold,
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_700Bold,
    Nunito_600SemiBold,
  });

  useEffect(() => {
    const loadRememberedUser = async () => {
      const rememberedEmail = await AsyncStorage.getItem("userEmail");
      if (rememberedEmail) {
        setUserInfo((prevState) => ({ ...prevState, email: rememberedEmail }));
        setRememberMe(true);
      }
    };
    loadRememberedUser();
  }, []);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  const handlePasswordValidation = (value: string) => {
    const password = value;
    const passwordSpecialCharacter = /(?=.*[!@#$&*])/;
    const passwordOneNumber = /(?=.*[0-9])/;
    const passwordSixValue = /(?=.{6,})/;

    if (!passwordSpecialCharacter.test(password)) {
      setError({
        ...error,
        password: "Write at least one special character",
      });
      setUserInfo({ ...userInfo, password: "" });
    } else if (!passwordOneNumber.test(password)) {
      setError({
        ...error,
        password: "Write at least one number",
      });
      setUserInfo({ ...userInfo, password: "" });
    } else if (!passwordSixValue.test(password)) {
      setError({
        ...error,
        password: "Write at least 6 characters",
      });
      setUserInfo({ ...userInfo, password: "" });
    } else {
      setError({
        ...error,
        password: "",
      });
      setUserInfo({ ...userInfo, password: value });
    }
  };

  const handleSignIn = async () => {
    console.log("Sending login request:", {
      email: userInfo.email,
      password: userInfo.password,
    });

    setButtonSpinner(true);

    try {
      const response = await axios.post(`${SERVER_URI}/login`, {
        email: userInfo.email,
        password: userInfo.password,
      });
      console.log("Login response:", response.data);

      if (response.data.accessToken) {
        await AsyncStorage.setItem("access_token", response.data.accessToken);
      } else {
        console.error("No access token received.");
      }

      if (response.data.refreshToken) {
        await AsyncStorage.setItem("refresh_token", response.data.refreshToken);
      } else {
        console.error("No refresh token received.");
      }

      if (rememberMe) {
        await AsyncStorage.setItem("rememberMe", "true");
        await AsyncStorage.setItem("userEmail", userInfo.email);
      } else {
        await AsyncStorage.removeItem("rememberMe");
        await AsyncStorage.removeItem("userEmail");
      }

      router.push("/(tabs)");
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        if (error.code === "ECONNABORTED" || !error.response) {
          console.error("Network error:", error.message);
          Toast.show("Network error. Please check your internet connection.", {
            type: "danger",
          });
        } else {
          console.error(
            "Login error:",
            error.response ? error.response.data : error.message
          );
          Toast.show("Incorrect email or password!", {
            type: "danger",
          });
        }
      } else {
        console.error("Unexpected error:", error);
        Toast.show("An unexpected error occurred.", {
          type: "danger",
        });
      }
    } finally {
      setButtonSpinner(false);
    }
  };

  return (
    <ImageBackground
      source={require("@/assets/bg.png")}
      style={styles.backgroundImage}
    >
      <LinearGradient
        colors={["rgba(229, 236, 249, 0.9)", "rgba(246, 247, 249, 0.9)"]}
        style={styles.gradientOverlay}
      >
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <Image
            style={styles.signInImage}
            source={require("@/assets/sign-in/Tablet_login.png")}
          />
          <Text style={[styles.welcomeText, { fontFamily: "Raleway_700Bold" }]}>
            Welcome Champ!
          </Text>
          <Text style={styles.learningText}>
            Login to your existing account of Gyanoda
          </Text>
          <View style={styles.inputContainer}>
            <View>
              <TextInput
                style={[styles.input, { paddingLeft: 40 }]}
                keyboardType="email-address"
                value={userInfo.email}
                placeholder="example@email.com"
                onChangeText={(value) =>
                  setUserInfo({ ...userInfo, email: value })
                }
              />
              <Fontisto
                style={{ position: "absolute", left: 26, top: 17.8 }}
                name="email"
                size={20}
                color={"#A1A1A1"}
              />
              {required && (
                <View style={commonStyles.errorContainer}>
                  <Entypo name="cross" size={18} color={"red"} />
                </View>
              )}
              <View style={{ marginTop: 15 }}>
                <TextInput
                  style={styles.input}
                  keyboardType="default"
                  secureTextEntry={!isPasswordVisible}
                  defaultValue=""
                  placeholder="Enter password..."
                  onChangeText={handlePasswordValidation}
                />
                <TouchableOpacity
                  style={styles.visibleIcon}
                  onPress={() => setPasswordVisible(!isPasswordVisible)}
                >
                  {isPasswordVisible ? (
                    <Ionicons
                      name="eye-off-outline"
                      size={23}
                      color={"#747474"}
                    />
                  ) : (
                    <Ionicons name="eye-outline" size={23} color={"#747474"} />
                  )}
                </TouchableOpacity>
                <SimpleLineIcons
                  style={styles.icon2}
                  name="lock"
                  size={20}
                  color={"#A1A1A1"}
                />
              </View>
              {error.password && (
                <View style={[commonStyles.errorContainer, { top: 145 }]}>
                  <Entypo name="cross" size={18} color={"red"} />
                  <Text style={{ color: "red", fontSize: 11, marginTop: -1 }}>
                    {error.password}
                  </Text>
                </View>
              )}
              <TouchableOpacity
                onPress={() => router.push("/(routes)/forgot-password")}
              >
                <Text
                  style={[
                    styles.forgotSection,
                    { fontFamily: "Nunito_600SemiBold" },
                  ]}
                >
                  Forgot Password?
                </Text>
              </TouchableOpacity>
              <View style={styles.checkboxContainer}>
                <CheckBox
                  checked={rememberMe}
                  onPress={() => setRememberMe(!rememberMe)}
                />
                <Text style={styles.checkboxText}>Remember me</Text>
              </View>

              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleSignIn}
              >
                {buttonSpinner ? (
                  <ActivityIndicator size="small" color={"white"} />
                ) : (
                  <Text style={styles.loginButtonText}>Login</Text>
                )}
              </TouchableOpacity>

              <View style={styles.signupRedirect}>
                <Text style={styles.signupText}>Don't have an account?</Text>
                <TouchableOpacity
                  onPress={() => router.push("/(routes)/sign-up")}
                >
                  <Text style={styles.signupLink}>Sign Up</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  gradientOverlay: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingTop: 20,
  },
  signInImage: {
    width: "60%",
    height: 250,
    alignSelf: "center",
    marginTop: 50,
  },
  welcomeText: {
    textAlign: "center",
    fontSize: 24,
  },
  learningText: {
    textAlign: "center",
    color: "#575757",
    fontSize: 15,
    marginTop: 5,
  },
  inputContainer: {
    marginHorizontal: 16,
    marginTop: 30,
    rowGap: 30,
  },
  input: {
    height: 55,
    marginHorizontal: 16,
    borderRadius: 8,
    paddingLeft: 35,
    fontSize: 16,
    backgroundColor: "white",
    color: "#1A1A1A",
  },
  visibleIcon: {
    position: "absolute",
    right: 30,
    top: 15,
  },
  icon2: {
    position: "absolute",
    left: 23,
    top: 17.8,
    marginTop: -2,
  },
  forgotSection: {
    marginHorizontal: 16,
    textAlign: "right",
    fontSize: 16,
    marginTop: 10,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    marginHorizontal: 2,
  },
  checkboxText: {
    marginLeft: -15,
    fontSize: 16,
    fontFamily: "Nunito_500Medium",
  },
  loginButton: {
    padding: 16,
    borderRadius: 50,
    marginHorizontal: 50,
    backgroundColor: "#2467EC",
    marginTop: 15,
  },
  loginButtonText: {
    color: "white",
    textAlign: "center",
    fontSize: 16,
    fontFamily: "Raleway_700Bold",
  },
  signupRedirect: {
    flexDirection: "row",
    marginHorizontal: 16,
    justifyContent: "center",
    marginBottom: 20,
    marginTop: 20,
  },
  signupText: {
    fontSize: 18,
    fontFamily: "Raleway_600SemiBold",
  },
  signupLink: {
    fontSize: 18,
    fontFamily: "Raleway_600SemiBold",
    color: "#2467EC",
    marginLeft: 5,
  },
});
