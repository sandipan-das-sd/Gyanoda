import React, { useState, useRef, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  Dimensions,
  Text,
  TouchableWithoutFeedback,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { AVPlaybackStatus } from "expo-av";
import { Video, ResizeMode } from "expo-av";
import * as ScreenOrientation from "expo-screen-orientation";
import { FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ScreenCapture from "expo-screen-capture";

type CustomVideoPlayerProps = {
  videoUri: string;
  onClose: () => void;
  source: { uri: string };
  qualities: { [key: string]: string };
};

const CustomVideoPlayer: React.FC<CustomVideoPlayerProps> = ({
  videoUri,
  onClose,
  qualities,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(true);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [controlsVisible, setControlsVisible] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedQuality, setSelectedQuality] = useState<string>("auto");
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [activeSelectorType, setActiveSelectorType] = useState<
    "quality" | "speed" | null
  >(null);

  const videoRef = useRef<Video>(null);
  const hideControlsTimer = useRef<NodeJS.Timeout | null>(null);

  const qualityOptions = {
    auto: "Auto",
    sd: "360p",
    hd: "480p",
    hls: "1080p",
  };

  const speedOptions = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  useEffect(() => {
    ScreenCapture.preventScreenCaptureAsync();
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);

    return () => {
      ScreenOrientation.unlockAsync();
    };
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playAsync();
    }
    resetHideControlsTimer();
    return () => {
      if (hideControlsTimer.current) {
        clearTimeout(hideControlsTimer.current);
      }
    };
  }, []);

  const handleQualityChange = async (quality: string) => {
    setSelectedQuality(quality);
    if (videoRef.current) {
      const status: AVPlaybackStatus = await videoRef.current.getStatusAsync();
      let currentPosition = 0;

      if (status.isLoaded) {
        currentPosition = status.positionMillis;
      }

      await videoRef.current.loadAsync(
        { uri: qualities[quality] || qualities["auto"] },
        {},
        false
      );
      await videoRef.current.setPositionAsync(currentPosition);
      if (!isPaused) {
        await videoRef.current.playAsync();
      }
    }
  };

  const handleSpeedChange = async (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      await videoRef.current.setRateAsync(speed, true);
    }
  };

  const calculateVideoSize = () => {
    const screenWidth = Dimensions.get("window").width;
    const screenHeight = Dimensions.get("window").height;
    return { width: screenWidth, height: screenHeight };
  };

  const { width: videoWidth, height: videoHeight } = calculateVideoSize();

  const handlePlayPause = async () => {
    if (isPaused) {
      await videoRef.current?.playAsync();
    } else {
      await videoRef.current?.pauseAsync();
    }
    setIsPaused(!isPaused);
    resetHideControlsTimer();
  };

  const handleClose = async () => {
    await ScreenOrientation.lockAsync(
      ScreenOrientation.OrientationLock.PORTRAIT_UP
    );
    onClose();
  };

  const handleFullScreen = async () => {
    if (isFullscreen) {
      await ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP
      );
    } else {
      await ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.LANDSCAPE
      );
    }
    setIsFullscreen(!isFullscreen);
    resetHideControlsTimer();
  };

  const handlePlaybackStatusUpdate = (status: any) => {
    setCurrentTime(status.positionMillis / 1000);
    setDuration(status.durationMillis / 1000);

    setIsPlaying(status.isPlaying);
    setIsPaused(!status.isPlaying);
    setIsLoading(status.isBuffering);
  };

  const handleProgressBarPress = (event: any) => {
    const { locationX } = event.nativeEvent;
    const position = locationX / videoWidth;
    const seekTime = position * duration;
    videoRef.current?.setPositionAsync(seekTime * 1000);
    resetHideControlsTimer();
  };

  const seekForward = async () => {
    const newTime = Math.min(currentTime + 10, duration);
    await videoRef.current?.setPositionAsync(newTime * 1000);
    resetHideControlsTimer();
  };

  const seekBackward = async () => {
    const newTime = Math.max(currentTime - 10, 0);
    await videoRef.current?.setPositionAsync(newTime * 1000);
    resetHideControlsTimer();
  };

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  const progress = (currentTime / duration) * 100;

  const resetHideControlsTimer = () => {
    if (hideControlsTimer.current) {
      clearTimeout(hideControlsTimer.current);
    }
    setControlsVisible(true);
    hideControlsTimer.current = setTimeout(() => {
      setControlsVisible(false);
    }, 3000);
  };

  const handleTouch = () => {
    setControlsVisible(true);
    resetHideControlsTimer();
  };

  const toggleQualitySelector = () => {
    setActiveSelectorType(activeSelectorType === "quality" ? null : "quality");
  };

  const toggleSpeedSelector = () => {
    setActiveSelectorType(activeSelectorType === "speed" ? null : "speed");
  };

  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback onPress={handleTouch}>
        <View
          style={[
            styles.videoContainer,
            { width: videoWidth, height: videoHeight },
          ]}
        >
          <Video
            ref={videoRef}
            source={{ uri: videoUri }}
            style={styles.video}
            resizeMode={ResizeMode.CONTAIN}
            isLooping
            onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          />
          {isLoading && (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#4169E1" />
            </View>
          )}
          {controlsVisible && (
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.7)"]}
              style={styles.overlay}
            >
              <TouchableOpacity
                style={styles.fullscreenButton}
                onPress={handleFullScreen}
              >
                <FontAwesome5
                  name={isFullscreen ? "compress" : "expand"}
                  size={20}
                  color="#fff"
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClose}
              >
                <FontAwesome5 name="times" size={20} color="#fff" />
              </TouchableOpacity>
              <View style={styles.controls}>
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={seekBackward}
                >
                  <Text style={styles.controlButtonText}>-10s</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.controlButton, styles.playPauseButton]}
                  onPress={handlePlayPause}
                >
                  <FontAwesome5
                    name={isPaused ? "play" : "pause"}
                    size={24}
                    color="#fff"
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={seekForward}
                >
                  <Text style={styles.controlButtonText}>+10s</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.progressContainer}>
                <TouchableWithoutFeedback onPress={handleProgressBarPress}>
                  <View style={styles.progressBarContainer}>
                    <View
                      style={[styles.progressBar, { width: `${progress}%` }]}
                    />
                    <View
                      style={[styles.progressDot, { left: `${progress}%` }]}
                    />
                  </View>
                </TouchableWithoutFeedback>
                <View style={styles.timeAndQualityContainer}>
                  <View style={styles.timeContainer}>
                    <Text style={styles.timeText}>
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </Text>
                  </View>
                  <View style={styles.controlsContainer}>
                    <View style={styles.qualityContainer}>
                      <Text style={styles.controlLabel}>Quality:</Text>
                      <TouchableOpacity
                        style={styles.selectorButton}
                        onPress={toggleQualitySelector}
                      >
                        <Text style={styles.selectorButtonText}>
                          {
                            qualityOptions[
                              selectedQuality as keyof typeof qualityOptions
                            ]
                          }
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.speedContainer}>
                      <Text style={styles.controlLabel}>Speed:</Text>
                      <TouchableOpacity
                        style={styles.selectorButton}
                        onPress={toggleSpeedSelector}
                      >
                        <Text style={styles.selectorButtonText}>
                          {playbackSpeed}x
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
                {activeSelectorType === "quality" && (
                  <View style={styles.selector}>
                    {Object.entries(qualityOptions).map(([quality, label]) => (
                      <TouchableOpacity
                        key={quality}
                        style={[
                          styles.qualityButton,
                          selectedQuality === quality &&
                            styles.selectedQualityButton,
                        ]}
                        onPress={async () => {
                          await handleQualityChange(quality);
                          setActiveSelectorType(null);
                        }}
                      >
                        <Text
                          style={[
                            styles.qualityText,
                            selectedQuality === quality &&
                              styles.selectedQualityText,
                          ]}
                        >
                          {label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                {activeSelectorType === "speed" && (
                  <View style={styles.selector}>
                    {speedOptions.map((speed) => (
                      <TouchableOpacity
                        key={speed}
                        style={[
                          styles.speedButton,
                          playbackSpeed === speed && styles.selectedSpeedButton,
                        ]}
                        onPress={() => {
                          handleSpeedChange(speed);
                          setActiveSelectorType(null);
                        }}
                      >
                        <Text
                          style={[
                            styles.speedText,
                            playbackSpeed === speed && styles.selectedSpeedText,
                          ]}
                        >
                          {speed}x
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </LinearGradient>
          )}
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  videoContainer: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 10,
    backgroundColor: "#000",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  draggableContainer: {
    position: "absolute",
    zIndex: 1000,
  },
  video: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    alignItems: "center",
    padding: 20,
  },
  fullscreenButton: {
    position: "absolute",
    top: 20,
    right: 20,
  },
  closeButton: {
    position: "absolute",
    top: 20,
    left: 20,
  },
  controls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  controlButton: {
    padding: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    marginHorizontal: 15,
  },
  controlButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  playPauseButton: {
    padding: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  progressContainer: {
    width: "100%",
    marginBottom: -5,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 2,
    overflow: "visible",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#4169E1",
    borderRadius: 2,
  },
  progressDot: {
    position: "absolute",
    top: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#4169E1",
    transform: [{ translateX: -8 }],
  },
  qualityLabel: {
    color: "#fff",
    marginRight: 5,
    fontSize: 12,
  },
  qualitySelectorButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 15,
  },
  qualitySelectorButtonText: {
    color: "#fff",
    marginRight: 5,
    fontSize: 12,
  },
  qualitySelector: {
    position: "absolute",
    bottom: "100%",
    right: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 10,
    padding: 5,
    marginBottom: 5,
  },
  qualityButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  selectedQualityButton: {
    backgroundColor: "rgba(65,105,225,0.5)",
  },
  qualityText: {
    color: "#fff",
    fontSize: 12,
  },
  selectedQualityText: {
    fontWeight: "bold",
  },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  timeAndQualityContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 5,
  },
  timeContainer: {
    flexDirection: "row",
  },
  timeText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginRight: 10,
  },
  controlsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  qualityContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
  },
  speedContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  controlLabel: {
    color: "#fff",
    marginRight: 5,
    fontSize: 12,
  },
  speedSelector: {
    position: "absolute",
    bottom: "100%",
    right: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 10,
    padding: 5,
    marginBottom: 5,
  },
  speedButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  selectedSpeedButton: {
    backgroundColor: "rgba(65,105,225,0.5)",
  },
  speedText: {
    color: "#fff",
    fontSize: 12,
  },
  selectedSpeedText: {
    fontWeight: "bold",
  },
  selector: {
    position: "absolute",
    bottom: "100%",
    right: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 10,
    padding: 5,
    marginBottom: 5,
    maxHeight: 150,
  },

  selectorButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 15,
  },

  selectorButtonText: {
    color: "#fff",
    fontSize: 12,
  },
});

export default CustomVideoPlayer;
