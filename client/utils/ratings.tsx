import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { View } from "react-native";

export default function Ratings({ rating }: { rating: any }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (i <= rating) {
      stars.push(
        <FontAwesome
          key={`star-full-${i}`}
          name="star"
          size={18}
          color={"#FF8D07"}
        />
      );
    } else if (i === Math.ceil(rating) && !Number.isInteger(rating)) {
      stars.push(
        <Ionicons
          key={`star-half-${i}`}
          name="star-half-outline"
          size={18}
          color={"#FF8D07"}
        />
      );
    } else {
      stars.push(
        <Ionicons
          key={`star-outline-${i}`}
          name="star-outline"
          size={18}
          color={"#FF8D07"}
        />
      );
    }
  }

  return (
    <View style={{ flexDirection: "row", marginTop: 4, marginLeft: 2, gap: 4 }}>
      {stars}
    </View>
  );
}
