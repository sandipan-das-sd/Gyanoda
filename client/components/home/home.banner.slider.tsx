import React from "react";
import { View, Image, TouchableOpacity } from "react-native";
import { useFonts, Raleway_700Bold } from "@expo-google-fonts/raleway";
import { Nunito_400Regular, Nunito_700Bold } from "@expo-google-fonts/nunito";
import { styles } from "@/styles/home/banner.style";
import Swiper from "react-native-swiper";
import { bannerData } from "@/constants/constants";
import { useRouter } from "expo-router";

interface HomeBannerSliderProps {
  activeDotColor?: string;
}

export default function HomeBannerSlider({
  activeDotColor = "#FFFFFF",
}: HomeBannerSliderProps) {
  const router = useRouter();

  let [fontsLoaded, fontError] = useFonts({
    Raleway_700Bold,
    Nunito_400Regular,
    Nunito_700Bold,
  });

  if (!fontsLoaded && !fontError) {
    return null;
  }

  const handleBannerPress = () => {
    router.push("/(tabs)/courses");
  };

  return (
    <View style={styles.outerContainer}>
      <View style={styles.container}>
        <Swiper
          dotStyle={styles.dot}
          activeDotStyle={[
            styles.activeDot,
            { backgroundColor: activeDotColor },
          ]}
          autoplay={true}
          autoplayTimeout={5}
        >
          {bannerData.map((item: BannerDataTypes, index: number) => (
            <TouchableOpacity
              key={index}
              onPress={handleBannerPress}
              style={styles.slide}
            >
              <Image source={item.bannerImageUrl!} style={styles.background} />
            </TouchableOpacity>
          ))}
        </Swiper>
      </View>
    </View>
  );
}
