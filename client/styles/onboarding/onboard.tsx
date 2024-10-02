import { StyleSheet } from "react-native";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import {
  responsiveHeight,
  responsiveWidth,
} from "react-native-responsive-dimensions";

export const styles = StyleSheet.create({
  firstContainer: {
    alignItems: "center",
    marginTop: 50,
  },
  logo: {
    width: wp("55%"),
    height: hp("20%"),
  },
  titleWrapper: {
    flexDirection: "row",
  },
  titleTextShape1: {
    position: "absolute",
    left: -28,
    top: -20,
  },
  titleText: {
    fontSize: hp("3%"),
    margin: 4,
    textAlign: "center",
  },
  titleTextShape2: {
    position: "absolute",
    right: -40,
    top: -20,
  },
  titleShape3: {
    position: "absolute",
    left: 60,
  },
  dscpWrapper: {
    marginTop: 30,
  },
  dscpText: {
    textAlign: "center",
    margin: 4,
    color: "#575757",
    fontSize: hp("2%"),
  },
  buttonWrapper: {
    backgroundColor: "#2467EC",
    width: wp("50%"),
    paddingVertical: 18,
    borderRadius: 50,
    marginTop: 40,
  },
  buttonText: {
    color: "white",
    textAlign: "center",
  },
  welcomeButtonStyle: {
    backgroundColor: "#2467EC",
    width: responsiveWidth(88),
    height: responsiveHeight(5.5),
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 50,
  },
});
