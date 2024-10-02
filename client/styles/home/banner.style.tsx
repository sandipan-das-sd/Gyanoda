import { StyleSheet } from "react-native";
import { responsiveWidth } from "react-native-responsive-dimensions";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";

export const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  container: {
    width: wp("90%"),
    height: hp("30%"),
    borderRadius: 15,
    overflow: "hidden",
  },

  slide: {
    flex: 1,
    borderRadius: 15,
  },

  background: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  dot: {
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 3,
  },

  activeDot: {
    backgroundColor: "#FFFFFF",
    width: 12,
    height: 12,
    borderRadius: 6,
    marginHorizontal: 3,
  },

  backgroundView: {
    position: "absolute",
    zIndex: 5,
    padding: wp("5%"),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    height: "100%",
  },

  backgroundViewContainer: {
    width: wp("50%"),
  },

  backgroundViewText: {
    color: "white",
    fontSize: hp("3%"),
    fontWeight: "bold",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },

  backgroundViewOffer: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: hp("2%"),
    marginTop: hp("1%"),
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },

  backgroundViewImage: {
    width: wp("40%"),
    height: hp("25%"),
    resizeMode: "contain",
  },

  backgroundViewButtonContainer: {
    borderWidth: 2,
    borderColor: "#FFFFFF",
    paddingVertical: hp("1%"),
    paddingHorizontal: wp("5%"),
    borderRadius: 25,
    marginTop: hp("2%"),
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },

  backgroundViewButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: hp("2%"),
  },
});
