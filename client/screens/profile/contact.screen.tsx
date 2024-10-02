import React, { useState, ReactNode } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ScrollView,
  Dimensions,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
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
import { Feather } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

// Error Boundary Component
class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.log("Error:", error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <Text style={styles.errorText}>
          Something went wrong. Please try again later.
        </Text>
      );
    }
    return this.props.children;
  }
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  message: string;
}

// Main Component
const ContactUsScreen: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  let [fontsLoaded, fontError] = useFonts({
    Raleway_600SemiBold,
    Raleway_700Bold,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  if (!fontsLoaded && !fontError) {
    return <ActivityIndicator size="large" color="#2467EC" />;
  }

  if (fontError) {
    console.error("Error loading fonts:", fontError);
  }

  const handleEmailPress = () => {
    Linking.openURL("mailto:support@gyanoda.com").catch((err) =>
      console.error("An error occurred while opening email", err)
    );
  };

  const handlePhonePress = () => {
    Linking.openURL("tel:+919073963347").catch((err) =>
      console.error("An error occurred while making a call", err)
    );
  };

  const handleSubmit = () => {
    if (
      !formData.name ||
      !formData.email ||
      !formData.phone ||
      !formData.message
    ) {
      Alert.alert(
        "Incomplete Form",
        "Please fill out all fields before sending your message."
      );
      return;
    }

    const phoneNumber = "+919073963347";
    const message = `Name: ${formData.name}\nEmail: ${formData.email}\nPhone: ${formData.phone}\n\nMessage: ${formData.message}`;

    let url =
      Platform.OS === "android"
        ? `sms:${phoneNumber}?body=${encodeURIComponent(message)}`
        : `sms:${phoneNumber}&body=${encodeURIComponent(message)}`;

    Linking.openURL(url)
      .then(() => {
        setFormData({ name: "", email: "", phone: "", message: "" });
        Alert.alert("Success", "Your message has been sent successfully.");
      })
      .catch((err) => {
        console.error("An error occurred while sending message", err);
        Alert.alert("Error", "Could not open messaging app. Please try again.");
      });
  };

  return (
    <ErrorBoundary>
      <LinearGradient colors={["#E5ECF9", "#F6F7F9"]} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.container}>
            <Text style={styles.title}>Contact Us</Text>

            <Text style={styles.description}>
              We'd love to hear from you! If you have any questions, feedback,
              or inquiries, please don't hesitate to reach out to us.
            </Text>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.emailButton}
                onPress={handleEmailPress}
              >
                <Feather name="mail" size={20} color="white" />
                <Text style={styles.buttonText}>Email Us</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.phoneButton}
                onPress={handlePhonePress}
              >
                <View style={styles.phoneIconContainer}>
                  <Feather name="phone" size={20} color="#4CAF50" />
                </View>
                <View style={styles.phoneTextContainer}>
                  <Text style={styles.phoneButtonText}>Call Us</Text>
                  <Text style={styles.phoneNumber}>+91 9073963347</Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.formContainer}>
              <Text style={styles.formTitle}>Send us a message</Text>
              <TextInput
                style={styles.input}
                placeholder="Your Name"
                value={formData.name}
                onChangeText={(text) =>
                  setFormData({ ...formData, name: text })
                }
              />
              <TextInput
                style={styles.input}
                placeholder="Your Email"
                value={formData.email}
                onChangeText={(text) =>
                  setFormData({ ...formData, email: text })
                }
                keyboardType="email-address"
              />
              <TextInput
                style={styles.input}
                placeholder="Your Phone Number"
                value={formData.phone}
                onChangeText={(text) =>
                  setFormData({ ...formData, phone: text })
                }
                keyboardType="phone-pad"
              />
              <TextInput
                style={[styles.input, styles.messageInput]}
                placeholder="Your Message"
                value={formData.message}
                onChangeText={(text) =>
                  setFormData({ ...formData, message: text })
                }
                multiline
              />
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
              >
                <Text style={styles.submitButtonText}>Send Message</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.addressTitle}>Our Address:</Text>
            <Text style={styles.addressText}>
              218, Basudevpur Road Saratpally Shyamnagar{"\n"}
              743127{"\n"}P.O - Shyamnagar , North 24 pgs
            </Text>

            <Text style={styles.additionalInfo}>
              Our support team is available Monday to Friday, 9 AM to 5 PM IST.
              We aim to respond to all inquiries within 24 hours.
            </Text>

            <Text style={styles.additionalInfo}>
              For urgent matters, please call us directly or include "URGENT" in
              your message.
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingTop: 60,
    paddingBottom: 40,
  },
  container: {
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontFamily: "Raleway_700Bold",
    marginBottom: 15,
    textAlign: "center",
    color: "#333",
  },
  description: {
    fontSize: 16,
    fontFamily: "Nunito_400Regular",
    marginBottom: 20,
    textAlign: "center",
    color: "#666",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  emailButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 5,
    borderRadius: 25,
    backgroundColor: "#2467EC",
    flex: 1,
    marginRight: 10,
  },
  buttonText: {
    color: "white",
    fontSize: 14,
    fontFamily: "Raleway_600SemiBold",
    marginLeft: 8,
  },
  phoneButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 5,
    borderRadius: 25,
    backgroundColor: "white",
    flex: 1,
    marginLeft: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  phoneIconContainer: {
    backgroundColor: "#E8F5E9",
    borderRadius: 50,
    padding: 8,
    marginRight: 8,
  },
  phoneTextContainer: {
    flex: 1,
  },
  phoneButtonText: {
    color: "#4CAF50",
    fontSize: 14,
    fontFamily: "Raleway_600SemiBold",
  },
  phoneNumber: {
    color: "#333",
    fontSize: 12,
    fontFamily: "Nunito_600SemiBold",
  },
  formContainer: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  formTitle: {
    fontSize: 18,
    fontFamily: "Raleway_700Bold",
    marginBottom: 15,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    fontFamily: "Nunito_400Regular",
  },
  messageInput: {
    height: 100,
    textAlignVertical: "top",
  },
  submitButton: {
    backgroundColor: "#2467EC",
    padding: 12,
    borderRadius: 25,
    alignItems: "center",
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Raleway_600SemiBold",
  },
  addressTitle: {
    fontSize: 18,
    fontFamily: "Raleway_700Bold",
    marginBottom: 10,
    textAlign: "center",
    color: "#333",
  },
  addressText: {
    fontSize: 14,
    fontFamily: "Nunito_400Regular",
    textAlign: "center",
    lineHeight: 22,
    color: "#666",
    marginBottom: 20,
  },
  additionalInfo: {
    fontSize: 14,
    fontFamily: "Nunito_400Regular",
    textAlign: "center",
    color: "#666",
    marginBottom: 10,
  },
  errorText: {
    fontSize: 16,
    fontFamily: "Nunito_600SemiBold",
    color: "red",
    textAlign: "center",
    marginTop: 20,
  },
});

export default ContactUsScreen;
