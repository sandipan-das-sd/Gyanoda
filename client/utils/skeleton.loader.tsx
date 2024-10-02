import React from "react";
import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { widthPercentageToDP as wp } from "react-native-responsive-screen";

const SkeletonLoader = () => {
  return (
    <MotiView
      from={{ opacity: 0.5 }}
      animate={{ opacity: 1 }}
      transition={{ loop: true, duration: 1000 }}
      style={styles.container}
    >
      <LinearGradient
        colors={["#BCC6E7", "#D0D9E0", "#E4E7EB", "#BCC6E7"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.imageLoader} />
        <View style={styles.titleLoader} />
        <View style={styles.ratingLoader} />
        <View style={styles.priceLoader} />
      </LinearGradient>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 6,
    borderRadius: 12,
    width: "95%",
    height: 350,
    overflow: "hidden",
    margin: "auto",
    marginVertical: 15,
    padding: 8,
  },
  gradient: {
    flex: 1,
    padding: 8,
  },
  imageLoader: {
    width: wp(86),
    height: 220,
    borderRadius: 5,
    backgroundColor: "#D1D9E1",
    marginBottom: 10,
  },
  titleLoader: {
    width: "80%",
    height: 20,
    backgroundColor: "#D1D9E1",
    marginBottom: 10,
  },
  ratingLoader: {
    width: "40%",
    height: 20,
    backgroundColor: "#D1D9E1",
    marginBottom: 10,
  },
  priceLoader: {
    width: "60%",
    height: 20,
    backgroundColor: "#D1D9E1",
  },
});

export default SkeletonLoader;
