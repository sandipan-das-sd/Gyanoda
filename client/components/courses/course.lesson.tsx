import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Image,
  Animated,
  ScrollView,
} from "react-native";
import { Entypo, MaterialIcons } from "@expo/vector-icons";
import { Video, ResizeMode } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");
const videoHeight = width * (9 / 16);

// JSON structure for videos
const videoData = [
  {
    id: "1007020735",
    title: "WBJEE Physics 2014 Solutions",
    subtitle: "Detailed explanations of Physics questions from WBJEE 2014",
    thumbnailUrl: "../../assets/gyano.png",
    section: "Physics",
  },
  {
    id: "1007843139",
    title: "WBJEE Physics 2015 Problem Solving",
    subtitle: "Step-by-step solutions for WBJEE 2015 Physics problems",
    thumbnailUrl: "https://example.com/wbjee-physics-2015.jpg",
    section: "Physics",
  },
  {
    id: "1007212492",
    title: "WBJEE Physics 2022 Analysis",
    subtitle: "In-depth analysis of WBJEE 2022 Physics paper",
    thumbnailUrl: "https://example.com/wbjee-physics-2022.jpg",
    section: "Physics",
  },
  {
    id: "1007031174",
    title: "WBJEE Physics 2019 Preparation",
    subtitle: "Key topics and strategies for WBJEE 2019 Physics",
    thumbnailUrl: "https://example.com/wbjee-physics-2024.jpg",
    section: "Physics",
  },

  // Mathematics Videos
  {
    id: "1008939163",
    title: "WBJEE Mathematics 2015 Solutions",
    subtitle: "Comprehensive solutions for WBJEE 2015 Mathematics questions",
    thumbnailUrl: "https://example.com/wbjee-math-2015.jpg",
    section: "Mathematics",
  },
  {
    id: "1009443471",
    title: "WBJEE Mathematics 2020 Problem Solving",
    subtitle: "Effective techniques for solving WBJEE 2020 Math problems",
    thumbnailUrl: "https://example.com/wbjee-math-2020.jpg",
    section: "Mathematics",
  },
  {
    id: "1009020366",
    title: "WBJEE Mathematics 2024 Preparation Guide",
    subtitle: "Essential topics and practice for WBJEE 2024 Mathematics",
    thumbnailUrl: "https://example.com/wbjee-math-2024.jpg",
    section: "Mathematics",
  },

  // Chemistry Videos
  {
    id: "1008398291",
    title: "WBJEE Chemistry 2014 Solutions",
    subtitle: "Detailed explanations of Chemistry questions from WBJEE 2014",
    thumbnailUrl: "https://example.com/wbjee-chemistry-2014.jpg",
    section: "Chemistry",
  },
  {
    id: "1008253490",
    title: "WBJEE Chemistry 2022 Analysis",
    subtitle: "Comprehensive analysis of WBJEE 2022 Chemistry paper",
    thumbnailUrl: "https://example.com/wbjee-chemistry-2020.jpg",
    section: "Chemistry",
  },
  {
    id: "1008217615",
    title: "WBJEE Chemistry 2020 Problem Solving",
    subtitle: "Effective strategies for WBJEE 2020 Chemistry questions",
    thumbnailUrl: "https://example.com/wbjee-chemistry-2022.jpg",
    section: "Chemistry",
  },
];

export default function CourseLesson() {
  const [visibleSections, setVisibleSections] = useState<Set<string>>(
    new Set<string>()
  );
  const [videoLinks, setVideoLinks] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [isPlaying, setIsPlaying] = useState<Record<string, boolean>>({});
  const videoRefs = useRef<Record<string, Video | null>>({});
  const fadeAnims = useRef<Record<string, Animated.Value>>({});
  const [currentlyPlayingVideo, setCurrentlyPlayingVideo] = useState<
    string | null
  >(null);

  const videoSections: string[] = [
    ...new Set(videoData.map((video) => video.section)),
  ];

  useEffect(() => {
    videoSections.forEach((section) => {
      fadeAnims.current[section] = new Animated.Value(0);
    });
  }, []);

  const toggleSection = async (section: string) => {
    const newVisibleSections = new Set(visibleSections);
    if (newVisibleSections.has(section)) {
      newVisibleSections.delete(section);
      for (const video of videoData.filter((v) => v.section === section)) {
        await pauseVideo(video.id);
      }
    } else {
      newVisibleSections.add(section);
    }
    setVisibleSections(newVisibleSections);

    Animated.timing(fadeAnims.current[section], {
      toValue: newVisibleSections.has(section) ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const togglePlayPause = async (videoId: string) => {
    const videoRef = videoRefs.current[videoId];
    if (videoRef) {
      const status = await videoRef.getStatusAsync();
      if (status.isLoaded) {
        if (status.isPlaying) {
          await pauseVideo(videoId);
          setCurrentlyPlayingVideo(null);
        } else {
          if (currentlyPlayingVideo && currentlyPlayingVideo !== videoId) {
            await pauseVideo(currentlyPlayingVideo);
          }
          await videoRef.playAsync();
          setIsPlaying((prev) => ({ ...prev, [videoId]: true }));
          setCurrentlyPlayingVideo(videoId);
        }
      }
    }
  };

  const fetchVimeoVideoUrl = async (videoId: string) => {
    try {
      const response = await fetch(
        `https://api.vimeo.com/videos/${videoId}?fields=files`,
        {
          headers: {
            Authorization: `bearer 3bf28d224161d1f6aa19abe18b9aa16d`,
            Accept: "application/vnd.vimeo.*+json; version=3.4",
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch video data.");
      }
      const data = await response.json();
      return data?.files?.[0]?.link || null;
    } catch (error) {
      console.error("Error fetching Vimeo video URL:", error);
      return null;
    }
  };

  const loadVideo = async (videoId: string) => {
    setLoading((prev) => ({ ...prev, [videoId]: true }));
    const videoLink = await fetchVimeoVideoUrl(videoId);
    if (videoLink) {
      setVideoLinks((prev) => ({ ...prev, [videoId]: videoLink }));
      // Preload the video
      const videoRef = videoRefs.current[videoId];
      if (videoRef) {
        await videoRef.loadAsync({ uri: videoLink }, {}, false);
      }
    }
    setLoading((prev) => ({ ...prev, [videoId]: false }));
  };

  const pauseVideo = async (videoId: string) => {
    const videoRef = videoRefs.current[videoId];
    if (videoRef) {
      await videoRef.pauseAsync();
      setIsPlaying((prev) => ({ ...prev, [videoId]: false }));
    }
  };

  return (
    <ScrollView style={styles.container}>
      {videoSections.map((section: string, sectionIndex: number) => {
        const isSectionVisible = visibleSections.has(section);
        const sectionVideos = videoData.filter(
          (video) => video.section === section
        );

        return (
          <View key={sectionIndex} style={styles.sectionContainer}>
            <TouchableOpacity onPress={() => toggleSection(section)}>
              <LinearGradient
                colors={["#6707FE", "#4A00E0"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.sectionHeader}
              >
                <Text style={styles.sectionTitle}>{section}</Text>
                <Entypo
                  name={isSectionVisible ? "chevron-up" : "chevron-down"}
                  size={24}
                  color="#FFFFFF"
                />
              </LinearGradient>
            </TouchableOpacity>
            <Animated.View
              style={[
                styles.sectionContent,
                {
                  opacity: fadeAnims.current[section],
                  display: isSectionVisible ? "flex" : "none",
                },
              ]}
            >
              {sectionVideos.map((video, videoIndex) => (
                <View key={videoIndex} style={styles.videoItem}>
                  <View style={styles.itemContainer}>
                    <View style={styles.itemContainerWrapper}>
                      <View style={styles.itemTitleWrapper}>
                        <MaterialIcons
                          name="ondemand-video"
                          size={24}
                          color="#6707FE"
                        />
                        <Text style={styles.itemTitleText}>{video.title}</Text>
                      </View>
                    </View>
                    <Text style={styles.subtitleText}>{video.subtitle}</Text>
                  </View>
                  <View style={styles.videoContainer}>
                    {loading[video.id] ? (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#6707FE" />
                      </View>
                    ) : videoLinks[video.id] ? (
                      <View style={styles.videoWrapper}>
                        <Video
                          ref={(ref) => (videoRefs.current[video.id] = ref)}
                          source={{ uri: videoLinks[video.id] }}
                          rate={1.0}
                          volume={1.0}
                          isMuted={false}
                          resizeMode={ResizeMode.CONTAIN}
                          shouldPlay={false}
                          isLooping={false}
                          style={styles.video}
                          useNativeControls={false}
                        />
                        <TouchableOpacity
                          style={styles.playPauseButton}
                          onPress={() => togglePlayPause(video.id)}
                        >
                          <MaterialIcons
                            name={isPlaying[video.id] ? "pause" : "play-arrow"}
                            size={36}
                            color="#FFFFFF"
                          />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.loadVideoButton}
                        onPress={() => loadVideo(video.id)}
                      >
                        <Image
                          source={{ uri: video.thumbnailUrl }}
                          style={styles.thumbnail}
                        />
                        <LinearGradient
                          colors={["rgba(0,0,0,0.5)", "rgba(0,0,0,0.8)"]}
                          style={styles.thumbnailOverlay}
                        >
                          <Text style={styles.loadVideoButtonText}>
                            Tap to load video
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </Animated.View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  sectionContainer: {
    marginBottom: 16,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  sectionContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  videoItem: {
    marginTop: 16,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  itemContainer: {
    padding: 16,
  },
  itemContainerWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemTitleWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemTitleText: {
    marginLeft: 12,
    color: "#333333",
    fontSize: 18,
    fontWeight: "500",
  },
  subtitleText: {
    color: "#666666",
    fontSize: 14,
    marginTop: 8,
  },
  videoContainer: {
    width: "100%",
    height: videoHeight,
  },
  videoWrapper: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000000",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F0F0F0",
  },
  loadVideoButton: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  thumbnailOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  loadVideoButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  playPauseButton: {
    position: "absolute",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
  },
});
