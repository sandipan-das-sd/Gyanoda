import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";

interface ShareableContentProps {
  questionText: string;
  appLogo: any; // Assuming you have an app logo image
}

const ShareableContent: React.FC<ShareableContentProps> = ({
  questionText,
  appLogo,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image source={appLogo} style={styles.logo} />
        <Text style={styles.appName}>Gyanoda</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>Check out this question:</Text>
        <Text style={styles.questionText}>{questionText}</Text>
      </View>
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Download our app to see the video solution!
        </Text>
        <Text style={styles.linkText}>
          play.google.com/store/apps/details?id=com.study_bloom.gyanoda
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 300,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: 8,
  },
  appName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2467EC",
  },
  content: {
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333333",
  },
  questionText: {
    fontSize: 14,
    color: "#555555",
    marginBottom: 12,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
    paddingTop: 12,
  },
  footerText: {
    fontSize: 12,
    color: "#666666",
    marginBottom: 4,
  },
  linkText: {
    fontSize: 10,
    color: "#2467EC",
  },
});

export default ShareableContent;
