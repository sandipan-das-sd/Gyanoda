import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Animated,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import * as ScreenCapture from "expo-screen-capture";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SERVER_URI } from "@/utils/uri";
import CustomVideoPlayer from "@/CustomVideoPlayer/CustomVideoPlayer";
import { Toast } from "react-native-toast-notifications";
import { AntDesign } from "@expo/vector-icons";
import { debounce } from "lodash";
import axios from "axios";
import useUser from "@/hooks/auth/useUser";
import { checkAndCleanCache } from "@/utils/cacheManagement";

interface Course {
  _id: string;
  name: string;
  tags: string;
}

interface Year {
  _id: string;
  year: number;
}

interface Subject {
  _id: string;
  name: string;
}

interface Question {
  _id: string;
  questionText: string;
  questionImage?: { url: string };
  answerImage?: { url: string };
  videoLink?: string;
  likes: number;
  dislikes: number;
  year: number; // Add this line
  subject: string; // Add this line
}

interface DoubtModalProps {
  isVisible: boolean;
  onClose: () => void;

  questions: Question[];
  onSubmit: (selectedQuestions: string[], timeSlot: string) => void;
}

const DoubtModal: React.FC<DoubtModalProps> = ({
  isVisible,
  onClose,
  questions,
  onSubmit,
}) => {
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [timeSlot, setTimeSlot] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [step, setStep] = useState(1);
  const [showScrollSuggestion, setShowScrollSuggestion] = useState(false);
  const scrollSuggestionOpacity = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const suggestionTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showSuggestion = () => {
    setShowScrollSuggestion(true);
    Animated.timing(scrollSuggestionOpacity, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    if (suggestionTimerRef.current) {
      clearTimeout(suggestionTimerRef.current);
    }
    suggestionTimerRef.current = setTimeout(() => {
      Animated.timing(scrollSuggestionOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        setShowScrollSuggestion(false);
      });
    }, 3000);
  };

  const toggleQuestionSelection = (questionId: string) => {
    setSelectedQuestions((prev) => {
      const newSelection = prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId];

      if (newSelection.length > prev.length) {
        showSuggestion();
      }

      return newSelection;
    });
  };
  const handleNextStep = () => {
    if (selectedQuestions.length === 0) {
      Alert.alert("Error", "Please select at least one question");
      return;
    }
    setStep(2);
  };

  const handlePrevStep = () => {
    setStep(1);
  };

  const handleScrollToEnd = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };
  const handleSubmit = async () => {
    if (!timeSlot.trim()) {
      Alert.alert("Error", "Please enter a preferred time slot");
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit(selectedQuestions, timeSlot);
      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setIsSubmitted(false);
        setSelectedQuestions([]);
        setTimeSlot("");
        setStep(1);
        onClose();
      }, 2000);
    } catch (error) {
      setIsSubmitting(false);
      Alert.alert("Error", "Failed to submit doubt. Please try again.");
    }
  };

  useEffect(() => {
    return () => {
      if (suggestionTimerRef.current) {
        clearTimeout(suggestionTimerRef.current);
      }
    };
  }, []);
  const renderQuestionSelection = () => (
    <>
      <Text style={styles.sectionTitle}>Select Questions:</Text>
      {questions.map((q) => (
        <TouchableOpacity
          key={q._id}
          style={styles.questionItem}
          onPress={() => toggleQuestionSelection(q._id)}
        >
          <View
            style={[
              styles.checkbox,
              selectedQuestions.includes(q._id) && styles.checkedBox,
            ]}
          >
            {selectedQuestions.includes(q._id) && (
              <AntDesign name="check" size={16} color="#fff" />
            )}
          </View>
          <Text style={styles.questionText}>{q.questionText}</Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity
        style={[
          styles.submitButton,
          selectedQuestions.length === 0 && styles.disabledButton,
        ]}
        onPress={handleNextStep}
        disabled={selectedQuestions.length === 0}
      >
        <Text style={styles.submitButtonText}>Add Preferred Time Slot</Text>
      </TouchableOpacity>
    </>
  );

  const renderTimeSlotInput = () => (
    <>
      <Text style={styles.sectionTitle}>Preferred Time Slot:</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., Monday 2-4 PM"
        value={timeSlot}
        onChangeText={setTimeSlot}
      />
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.backButton} onPress={handlePrevStep}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.submitButton, styles.submitButtonSmall]}
          onPress={handleSubmit}
          disabled={isSubmitting || isSubmitted}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : isSubmitted ? (
            <Text style={styles.submitButtonText}>Doubt Submitted</Text>
          ) : (
            <Text style={styles.submitButtonText}>Submit Doubt</Text>
          )}
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <AntDesign name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Submit Your Doubt</Text>
          <ScrollView ref={scrollViewRef} style={styles.scrollView}>
            {step === 1 ? renderQuestionSelection() : renderTimeSlotInput()}
          </ScrollView>
          {showScrollSuggestion && (
            <TouchableOpacity onPress={handleScrollToEnd}>
              <Animated.View
                style={[
                  styles.scrollSuggestion,
                  { opacity: scrollSuggestionOpacity },
                ]}
              >
                <AntDesign name="arrowdown" size={20} color="#007bff" />
                <Text style={styles.scrollSuggestionText}>
                  Tap to scroll down
                </Text>
              </Animated.View>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};
const CourseAccess: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedCourseName, setSelectedCourseName] = useState("");
  const [years, setYears] = useState<Year[]>([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [videoLink, setVideoLink] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [videoQualities, setVideoQualities] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTag, setSearchTag] = useState("");
  const [isLoadingYears, setIsLoadingYears] = useState(false);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  const [isSearchButtonClicked, setIsSearchButtonClicked] = useState(false);
  const [lastSearchTerm, setLastSearchTerm] = useState("");
  const [likedQuestions, setLikedQuestions] = useState<Record<string, boolean>>(
    {}
  );
  const { user, loading: userLoading } = useUser();
  const [dislikedQuestions, setDislikedQuestions] = useState<
    Record<string, boolean>
  >({});
  const [ghostLoading, setGhostLoading] = useState(true);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [loadingVideoId, setLoadingVideoId] = useState<string | null>(null);
  const [isDoubtModalVisible, setIsDoubtModalVisible] = useState(false);

  const getGuidanceText = () => {
    if (!selectedCourse) {
      return "Please select a course to go ahead";
    }
    if (!selectedYear) {
      return "Please select a year to continue";
    }
    if (!selectedSubject) {
      return "Please select a subject to start";
    }
    return "";
  };

  const canShowDoubtButton = selectedCourse && selectedYear && selectedSubject;

  useEffect(() => {
    ScreenCapture.preventScreenCaptureAsync();
    const timer = setTimeout(() => {
      setGhostLoading(false);
    }, 2000);

    return () => {
      clearTimeout(timer);
    };
  }, []);
  useEffect(() => {
    const initializeComponent = async () => {
      await checkAndCleanCache();
      ScreenCapture.preventScreenCaptureAsync();
    };

    initializeComponent();

    const timer = setTimeout(() => {
      setGhostLoading(false);
    }, 2000);

    return () => {
      clearTimeout(timer);
    };
  }, []);
  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((term: string) => {
      handleSearch(term);
    }, 300),
    [selectedCourse, selectedYear, selectedSubject]
  );

  useEffect(() => {
    if (searchTerm) {
      debouncedSearch(searchTerm);
    }
  }, [searchTerm, debouncedSearch]);
  const handleDoubtSubmit = async (
    selectedQuestions: string[],
    timeSlot: string
  ) => {
    try {
      const accessToken = await AsyncStorage.getItem("access_token");
      const refreshToken = await AsyncStorage.getItem("refresh_token");
      if (!accessToken) {
        throw new Error("No access token found. Please log in.");
      }

      console.log("Submitting doubt with data:", {
        selectedQuestions,
        timeSlot,
      });

      // Find the full question objects for the selected question IDs
      const questionsData = questions
        .filter((q) => selectedQuestions.includes(q._id))
        .map((question, index) => ({
          questionNumber: index + 1,
          questionId: question._id,
          questionText: question.questionText,
        }));

      const currentDate = new Date().toISOString();

      const response = await fetch(`${SERVER_URI}/get-doubt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          questions: questionsData,
          timeSlot,
          date: currentDate,
        }),
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(
          `Failed to submit doubt: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log("Parsed response data:", data);

      Toast.show("Doubt submitted successfully");
      setIsDoubtModalVisible(false);
    } catch (error) {
      console.error("Error submitting doubt:", error);
      Alert.alert(
        "Error",
        `Failed to submit doubt. Please try again. (${
          (error as Error).message
        })`
      );
    }
  };

  const handleSearch = useCallback(
    async (term: string) => {
      if (!selectedCourse) {
        Alert.alert("Error", "Please select a course before searching.");
        setIsSearchButtonClicked(false);
        return;
      }

      setIsSearching(true);
      try {
        const accessToken = await AsyncStorage.getItem("access_token");
        const refreshToken = await AsyncStorage.getItem("refresh_token");
        const response = await axios.get(
          `${SERVER_URI}/course/${selectedCourse}/filter-questions`,
          {
            // Add here: Include year and subject in the params
            params: {
              searchTerm: term,
              year: selectedYear,
              subject: selectedSubject,
            },
            headers: {
              "access-token": accessToken,
              "refresh-token": refreshToken,
            },
          }
        );

        const data = response.data;
        if (data.success) {
          const questionsWithMetadata = data.questions.map((q: Question) => ({
            ...q,
            year: q.year || selectedYear,
            subject: q.subject || selectedSubject,
          }));
          setFilteredQuestions(questionsWithMetadata);
          await loadLikeState(questionsWithMetadata);
          setSearchTag(term);
          // Add here: Update lastSearchTerm
          setLastSearchTerm(term);
        } else {
          Alert.alert("Error", "Failed to fetch filtered questions.");
        }
      } catch (error) {
        console.error("Error searching questions:", error);
        Alert.alert("Error", "Error searching questions.");
      } finally {
        setIsSearching(false);
        setIsSearchButtonClicked(false);
      }
    },
    [selectedCourse, selectedYear, selectedSubject]
  );

  // const handleRemoveSearchTag = () => {
  //   setSearchTag("");
  //   setFilteredQuestions([]);
  //   fetchQuestions();
  // };

  useEffect(() => {
    if (searchTerm === "") {
      setFilteredQuestions([]);
    }
  }, [searchTerm]);

  const handleSearchButtonClick = useCallback(() => {
    setIsSearchButtonClicked(true);
    handleSearch(searchTerm);
  }, [handleSearch, searchTerm]);

  const fetchCourses = useCallback(async () => {
    if (user?._id) {
      setLoading(true);
      try {
        const accessToken = await AsyncStorage.getItem("access_token");
        const refreshToken = await AsyncStorage.getItem("refresh_token");

        console.log("Fetching courses for user ID:", user._id); // Log user ID

        const response = await axios.get(
          `${SERVER_URI}/get-all-courses/${user._id}`,
          {
            headers: {
              "access-token": accessToken,
              "refresh-token": refreshToken,
            },
          }
        );

        const data = response.data;
        if (data.success) {
          console.log("Fetched courses:", data.courses.length); // Log number of fetched courses
          setCourses(data.courses || []);
        } else {
          console.error(
            "Failed to fetch courses:",
            data.message || "Unknown error"
          );
          Alert.alert("Error", "Failed to fetch courses.");
        }
      } catch (error) {
        console.error("Error fetching courses:", error);
        if (error instanceof Error) {
          console.error("Error message:", error.message);
          console.error("Error stack:", error.stack);
        }
        Alert.alert("Error", "Error fetching courses.");
      } finally {
        setLoading(false);
        setGhostLoading(false);
      }
    } else {
      console.log("No user ID available"); // Log when user ID is not available
      setCourses([]);
    }
  }, [user?._id]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleCourseChange = (courseId: string) => {
    setSelectedCourse(courseId);
    const course = courses.find((c) => c._id === courseId);
    setSelectedCourseName(course ? course.name : "");
    setSelectedYear("");
    setSelectedSubject("");
    setQuestions([]);
    setSearchTag("");
    setFilteredQuestions([]);
  };

  const fetchYears = useCallback(async () => {
    if (selectedCourse && user?._id) {
      setLoading(true);
      try {
        const accessToken = await AsyncStorage.getItem("access_token");
        const refreshToken = await AsyncStorage.getItem("refresh_token");
        const response = await axios.get(
          `${SERVER_URI}/course/${selectedCourse}/years`,
          {
            headers: {
              "access-token": accessToken,
              "refresh-token": refreshToken,
            },
          }
        );
        const data = response.data;
        if (data.success) {
          setYears(data.years || []);
        } else {
          Alert.alert("Error", "Failed to fetch years.");
        }
      } catch (error) {
        console.error("Error fetching years:", error);
        Alert.alert("Error", "Error fetching years.");
      } finally {
        setLoading(false);
      }
    } else {
      setYears([]);
      setSubjects([]);
      setQuestions([]);
    }
  }, [selectedCourse, user?._id]);

  useEffect(() => {
    fetchYears();
  }, [fetchYears]);

  const fetchSubjects = useCallback(async () => {
    if (selectedYear && selectedCourse && user?._id) {
      setLoading(true);
      try {
        const accessToken = await AsyncStorage.getItem("access_token");
        const refreshToken = await AsyncStorage.getItem("refresh_token");
        const response = await axios.get(
          `${SERVER_URI}/course/${selectedCourse}/year/${selectedYear}/subjects`,
          {
            headers: {
              "access-token": accessToken,
              "refresh-token": refreshToken,
            },
          }
        );
        const data = response.data;
        if (data.success) {
          setSubjects(data.subjects || []);
        } else {
          Alert.alert("Error", "Failed to fetch subjects.");
        }
      } catch (error) {
        console.error("Error fetching subjects:", error);
        Alert.alert("Error", "Error fetching subjects.");
      } finally {
        setLoading(false);
      }
    } else {
      setSubjects([]);
      setQuestions([]);
    }
  }, [selectedYear, selectedCourse, user?._id]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const loadLikeState = async (fetchedQuestions: Question[]) => {
    const likedState: Record<string, boolean> = {};
    for (const question of fetchedQuestions) {
      const liked = await AsyncStorage.getItem(`liked_${question._id}`);
      likedState[question._id] = liked === "true";
    }
    setLikedQuestions(likedState);
  };

  const fetchQuestions = useCallback(async () => {
    if (selectedYear && selectedCourse && user?._id) {
      setLoading(true);
      try {
        const accessToken = await AsyncStorage.getItem("access_token");
        const refreshToken = await AsyncStorage.getItem("refresh_token");
        let url = `${SERVER_URI}/course/${selectedCourse}/year/${selectedYear}`;
        if (selectedSubject) {
          url += `/subject/${selectedSubject}`;
        }
        url += "/questions";

        const response = await axios.get(url, {
          headers: {
            "access-token": accessToken,
            "refresh-token": refreshToken,
          },
        });
        const data = response.data;
        if (data.success) {
          setQuestions(data.questions || []);
          await loadLikeState(data.questions);
        } else {
          console.log("No questions found or error occurred");
          setQuestions([]);
        }
      } catch (error) {
        console.error("Error fetching questions:", error);
        if (selectedSubject) {
          Alert.alert("Error", "Error fetching questions.");
        }
      } finally {
        setLoading(false);
      }
    } else {
      setQuestions([]);
    }
  }, [selectedSubject, selectedYear, selectedCourse, user?._id]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);
  const handleYearChange = useCallback(
    (yearId: string) => {
      setSelectedYear(yearId);
      setSelectedSubject("");
      setQuestions([]);
      setSearchTag("");
      setFilteredQuestions([]);
      // Fetch questions for the selected year without a subject
      if (yearId) {
        fetchQuestions();
      }
    },
    [fetchQuestions]
  );
  const handleSubjectChange = useCallback(
    (subjectId: string) => {
      setSelectedSubject(subjectId);
      setQuestions([]);
      setSearchTag("");
      setFilteredQuestions([]);
      if (subjectId) {
        fetchQuestions();
      }
    },
    [fetchQuestions]
  );
  const handleRemoveSearchTag = useCallback(() => {
    setSearchTag("");
    setFilteredQuestions([]);
    setSearchTerm("");
    if (selectedSubject && selectedYear && selectedCourse) {
      fetchQuestions();
    }
  }, [selectedSubject, selectedYear, selectedCourse, fetchQuestions]);

  const handleLike = async (questionId: string) => {
    try {
      const isCurrentlyLiked = likedQuestions[questionId];
      const endpoint = isCurrentlyLiked ? "unlike" : "like";
      const questionToUpdate = [...questions, ...filteredQuestions].find(
        (q) => q._id === questionId
      );

      if (!questionToUpdate) {
        console.error("Question not found");
        return;
      }

      const yearId = questionToUpdate.year?.toString() || selectedYear;
      const subjectId = questionToUpdate.subject || selectedSubject;

      if (!yearId || !subjectId) {
        console.error("Year or subject not found for the question");
        Toast.show("Error updating like: Missing year or subject", {
          type: "danger",
        });
        return;
      }

      const response = await fetch(
        `${SERVER_URI}/course/${selectedCourse}/year/${yearId}/subject/${subjectId}/question/${questionId}/${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "access-token": (await AsyncStorage.getItem("access_token")) || "",
            "refresh-token":
              (await AsyncStorage.getItem("refresh_token")) || "",
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        setLikedQuestions((prev) => ({
          ...prev,
          [questionId]: !isCurrentlyLiked,
        }));
        const updateQuestions = (prevQuestions: Question[]) =>
          prevQuestions.map((q) =>
            q._id === questionId ? { ...q, likes: data.likes } : q
          );
        setQuestions(updateQuestions);
        setFilteredQuestions(updateQuestions);
        await AsyncStorage.setItem(
          `liked_${questionId}`,
          (!isCurrentlyLiked).toString()
        );
        Toast.show(isCurrentlyLiked ? "Unliked" : "Liked");
      } else {
        Toast.show(data.message || "Failed to update like", { type: "danger" });
      }
    } catch (error) {
      console.error("Error updating like:", error);
      Toast.show("Error updating like");
    }
  };

  const handleDislike = async (questionId: string) => {
    try {
      const isCurrentlyDisliked = dislikedQuestions[questionId];
      const endpoint = isCurrentlyDisliked ? "undislike" : "dislike";
      const questionToUpdate = [...questions, ...filteredQuestions].find(
        (q) => q._id === questionId
      );

      if (!questionToUpdate) {
        console.error("Question not found");
        return;
      }

      const yearId = questionToUpdate.year?.toString() || selectedYear;
      const subjectId = questionToUpdate.subject || selectedSubject;

      if (!yearId || !subjectId) {
        console.error("Year or subject not found for the question");
        Toast.show("Error updating dislike: Missing year or subject", {
          type: "danger",
        });
        return;
      }

      const response = await fetch(
        `${SERVER_URI}/course/${selectedCourse}/year/${yearId}/subject/${subjectId}/question/${questionId}/${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "access-token": (await AsyncStorage.getItem("access_token")) || "",
            "refresh-token":
              (await AsyncStorage.getItem("refresh_token")) || "",
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        setDislikedQuestions((prev) => ({
          ...prev,
          [questionId]: !isCurrentlyDisliked,
        }));
        setLikedQuestions((prev) => ({ ...prev, [questionId]: false }));
        const updateQuestions = (prevQuestions: Question[]) =>
          prevQuestions.map((q) =>
            q._id === questionId
              ? { ...q, likes: data.likes, dislikes: data.dislikes }
              : q
          );
        setQuestions(updateQuestions);
        setFilteredQuestions(updateQuestions);
        await AsyncStorage.setItem(
          `disliked_${questionId}`,
          (!isCurrentlyDisliked).toString()
        );
        await AsyncStorage.setItem(`liked_${questionId}`, "false");
        Toast.show(isCurrentlyDisliked ? "Undisliked" : "Disliked");
      } else {
        Toast.show(data.message || "Failed to update dislike", {
          type: "danger",
        });
      }
    } catch (error) {
      console.error("Error updating dislike:", error);
      Toast.show("Error updating dislike");
    }
  };
  const handleDoubt = () => {
    setIsDoubtModalVisible(true);
  };

  const fetchVimeoVideoUrl = async (vimeoVideoId: string) => {
    try {
      const videoId = vimeoVideoId.split("/").pop();
      if (!videoId || !/^\d+$/.test(videoId)) {
        throw new Error("Invalid Vimeo video ID.");
      }
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
      const qualities = data.files.reduce(
        (acc: Record<string, string>, file: any) => {
          if (file.quality) {
            acc[file.quality] = file.link;
          }
          return acc;
        },
        {}
      );
      return { qualities, defaultQuality: data?.files?.[0]?.link };
    } catch (error) {
      console.error("Error fetching Vimeo video URL:", error);
      Alert.alert("Error", "Failed to fetch video URL.");
      return null;
    }
  };

  const handleOpenModal = async (vimeoVideoId: string) => {
    setLoadingVideoId(vimeoVideoId); // Set the loading state for this video
    try {
      const url = await fetchVimeoVideoUrl(vimeoVideoId);
      if (url) {
        setVideoLink(url.defaultQuality);
        setVideoQualities(url.qualities);
        setModalVisible(true);
      }
    } catch (error) {
      console.error("Error opening video modal:", error);
      Alert.alert("Error", "Failed to load the video. Please try again.");
    } finally {
      setLoadingVideoId(null); // Clear the loading state
    }
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setVideoLink(null);
  };

  const handleOpenImageModal = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setImageModalVisible(true);
  };

  const handleCloseImageModal = () => {
    setImageModalVisible(false);
    setSelectedImage(null);
  };

  const renderQuestion = useCallback(
    ({ item }: { item: Question }) => (
      <View style={styles.questionCard}>
        <View style={styles.questionHeader}>
          <Text style={styles.yearSubjectText}>
            Year: {item.year} | Subject: {item.subject}
          </Text>
        </View>
        <Text style={styles.questionText}>
          {item.questionText || "No question text available"}
        </Text>

        {item.questionImage && (
          <TouchableOpacity
            onPress={() =>
              item.questionImage && handleOpenImageModal(item.questionImage.url)
            }
          >
            <View style={styles.imageWrapper}>
              <Image
                source={{ uri: item.questionImage.url }}
                style={[styles.blurredImage, styles.questionImage]}
                blurRadius={1.5}
              />
              <Text style={styles.overlayText}>Click to view the question</Text>
            </View>
          </TouchableOpacity>
        )}

        {item.answerImage && (
          <TouchableOpacity
            onPress={() =>
              item.answerImage && handleOpenImageModal(item.answerImage.url)
            }
          >
            <View style={styles.imageWrapper}>
              <Image
                source={{ uri: item.answerImage.url }}
                style={[styles.blurredImage, styles.answerImage]}
                blurRadius={1.5}
              />
              <Text style={styles.overlayText}>Click to view the answer</Text>
            </View>
          </TouchableOpacity>
        )}

        {item.videoLink ? (
          <TouchableOpacity
            onPress={() => item.videoLink && handleOpenModal(item.videoLink)}
            style={[styles.videoButton, styles.roundedButton]}
            disabled={loadingVideoId === item.videoLink}
          >
            {loadingVideoId === item.videoLink ? (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="small" color="#ffffff" />
                <Text style={styles.loaderText}>Loading...</Text>
              </View>
            ) : (
              <Text style={styles.videoButtonText}>Watch Video Solution</Text>
            )}
          </TouchableOpacity>
        ) : (
          <Text style={styles.noVideoText}>
            No video available right now. Coming Soon! Stay tuned!!
          </Text>
        )}

        <View style={styles.interactionContainer}>
          <TouchableOpacity
            style={[
              styles.interactionButton,
              likedQuestions[item._id] && styles.activeLikeButton,
            ]}
            onPress={() => handleLike(item._id)}
          >
            <AntDesign
              name={likedQuestions[item._id] ? "like1" : "like2"}
              size={24}
              color={likedQuestions[item._id] ? "#007bff" : "black"}
            />
            <Text style={styles.interactionText}>{item.likes}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.interactionButton,
              dislikedQuestions[item._id] && styles.activeDislikeButton,
            ]}
            onPress={() => handleDislike(item._id)}
          >
            <AntDesign
              name={dislikedQuestions[item._id] ? "dislike1" : "dislike2"}
              size={24}
              color={dislikedQuestions[item._id] ? "#ff4757" : "black"}
            />
          </TouchableOpacity>
        </View>
      </View>
    ),
    [
      likedQuestions,
      dislikedQuestions,
      handleLike,
      handleDislike,
      loadingVideoId,
    ]
  );

  useEffect(() => {
    loadLikeState(questions);
  }, [questions]);
  return (
    <ScrollView style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search Questions by Chapters...."
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
        <TouchableOpacity
          style={[
            styles.searchButton,
            isSearchButtonClicked && styles.searchButtonClicked,
          ]}
          onPress={handleSearchButtonClick}
          disabled={isSearching}
        >
          {isSearching ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.searchButtonText}>Search</Text>
          )}
        </TouchableOpacity>
      </View>

      {loading || ghostLoading ? (
        <View style={styles.ghostLoader}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.ghostLoaderText}>Loading...</Text>
        </View>
      ) : (
        <>
          <View style={styles.pickerContainer}>
            <Text>Course:</Text>
            <Picker
              selectedValue={selectedCourse}
              onValueChange={handleCourseChange}
              style={styles.picker}
            >
              <Picker.Item label="Select a course" value="" />
              {courses.map((course) => (
                <Picker.Item
                  key={course._id}
                  label={`${course.name} (${course.tags})`}
                  value={course._id}
                />
              ))}
            </Picker>
          </View>

          <View style={styles.pickerContainer}>
            <Text>Year:</Text>
            <Picker
              selectedValue={selectedYear}
              onValueChange={handleYearChange}
              style={styles.picker}
              enabled={!!selectedCourse}
            >
              <Picker.Item label="Select a year" value="" />
              {years.map((year) => (
                <Picker.Item
                  key={year._id}
                  label={year.year.toString()}
                  value={year._id}
                />
              ))}
            </Picker>
          </View>

          <View style={styles.pickerContainer}>
            <Text>Subject:</Text>
            <Picker
              selectedValue={selectedSubject}
              onValueChange={handleSubjectChange}
              style={styles.picker}
              enabled={!!selectedYear}
            >
              <Picker.Item label="Select a subject" value="" />
              {subjects.map((subject) => (
                <Picker.Item
                  key={subject._id}
                  label={subject.name}
                  value={subject._id}
                />
              ))}
            </Picker>
            {searchTag && (
              <View style={styles.searchTagContainer}>
                <Text style={styles.searchTagText}>{searchTag}</Text>
                <TouchableOpacity onPress={handleRemoveSearchTag}>
                  <AntDesign name="close" size={20} color="#007bff" />
                </TouchableOpacity>
              </View>
            )}
          </View>
          {/* Conditional rendering of the Doubt button */}
          {canShowDoubtButton && (
            <TouchableOpacity style={styles.doubtButton} onPress={handleDoubt}>
              <Text style={styles.doubtButtonText}>Add Your Doubts</Text>
            </TouchableOpacity>
          )}

          <DoubtModal
            isVisible={isDoubtModalVisible}
            onClose={() => setIsDoubtModalVisible(false)}
            questions={questions}
            onSubmit={handleDoubtSubmit}
          />

          <View style={styles.questionsContainer}>
            <Text style={styles.subHeader}>Questions</Text>
            {filteredQuestions.length > 0 ? (
              <FlatList
                data={filteredQuestions}
                renderItem={renderQuestion}
                keyExtractor={(item) => item._id}
                initialNumToRender={5}
                maxToRenderPerBatch={10}
                windowSize={10}
              />
            ) : searchTerm !== "" ? (
              <Text style={styles.noQuestionsText}>
                No questions found for the given search term.
              </Text>
            ) : questions.length > 0 ? (
              <FlatList
                data={questions}
                renderItem={renderQuestion}
                keyExtractor={(item) => item._id}
                initialNumToRender={5}
                maxToRenderPerBatch={10}
                windowSize={10}
              />
            ) : (
              <Text style={styles.noQuestionsText}>{getGuidanceText()}</Text>
            )}
          </View>
        </>
      )}

      {/* Modal for video player */}
      <Modal
        transparent={true}
        visible={modalVisible}
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalContainer}>
          {videoLink && (
            <CustomVideoPlayer
              videoUri={videoLink}
              onClose={handleCloseModal}
              source={{ uri: videoLink }}
              qualities={videoQualities}
            />
          )}
        </View>
      </Modal>

      {/* Modal for full-screen image */}
      <Modal
        transparent={true}
        visible={imageModalVisible}
        onRequestClose={handleCloseImageModal}
      >
        <TouchableOpacity
          style={styles.imageModalContainer}
          onPress={handleCloseImageModal}
        >
          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              style={styles.fullScreenImage}
            />
          )}
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f2f4f5",
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  pickerContainer: {
    marginBottom: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    padding: 10,
  },
  picker: {
    height: 50,
    width: "100%",
    color: "#333",
  },
  questionsContainer: {
    flex: 1,
    marginTop: 20,
  },
  subHeader: {
    fontSize: 22,
    fontWeight: "600",
    color: "#444",
    marginBottom: 12,
  },
  questionCard: {
    marginBottom: 20,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#E9FFF9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  questionText: {
    fontSize: 16,
    color: "#333",
    marginBottom: 10,
  },
  questionImage: {
    width: "100%",
    height: "100%",
    borderWidth: 2,
    borderColor: "#ccc",
    borderRadius: 10,
  },
  answerImage: {
    width: "100%",
    height: "100%",
    borderWidth: 2,
    borderColor: "#ccc",
    borderRadius: 10,
  },
  imageWrapper: {
    position: "relative",
    width: "100%",
    height: 200,
    marginVertical: 12,
    borderRadius: 10,
    overflow: "hidden",
  },
  blurredImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    borderRadius: 10,
  },
  overlayText: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -90 }, { translateY: -10 }],
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    padding: 5,
    borderRadius: 5,
  },
  videoButton: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#007bff",
    alignItems: "center",
  },
  roundedButton: {
    borderRadius: 20,
  },
  videoButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  noVideoText: {
    fontSize: 16,
    color: "#666",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 10,
  },
  interactionContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 15,
  },
  interactionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    marginHorizontal: 5,
  },
  interactionText: {
    marginLeft: 5,
    fontSize: 16,
    fontWeight: "bold",
  },
  activeLikeButton: {
    backgroundColor: "#e6f3ff",
  },
  activeDislikeButton: {
    backgroundColor: "#ffe6e6",
  },
  ghostLoader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: 300,
  },
  ghostLoaderText: {
    marginTop: 10,
    fontSize: 16,
    color: "#007bff",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  imageModalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.8)",
  },
  fullScreenImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  noQuestionsText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FF5722",
    textAlign: "center",
    marginVertical: 20,
    backgroundColor: "#FFF3E0",
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FF5722",
  },
  doubtButton: {
    backgroundColor: "#2467EC",
    padding: 15,
    borderRadius: 50,
    alignItems: "center",
    marginVertical: 20,
  },
  doubtButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    width: "90%",
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  submitButton: {
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 50,
    alignItems: "center",
    marginTop: 10,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  closeButton: {
    marginTop: 10,
    padding: 10,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#007bff",
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 5,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  checkboxLabel: {
    marginLeft: 10,
    flex: 1,
  },
  selectedCourseText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#007bff",
    textAlign: "center",
    marginVertical: 10,
  },
  loaderContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  loaderText: {
    color: "#fff",
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "bold",
  },
  questionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  checkedBox: {
    backgroundColor: "#007bff",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#007bff",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  backButtonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "bold",
  },
  disabledButton: {
    backgroundColor: "#cccccc",
  },
  backButton: {
    backgroundColor: "#f0f0f0",
    padding: 15,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 20,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    maxHeight: 400,
  },
  sectiontitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#444",
    marginTop: 15,
    marginBottom: 10,
  },
  submitButtonSmall: {
    flex: 1,
    padding: 15,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 20,
    marginLeft: 10,
  },
  scrollSuggestion: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    padding: 10,
    backgroundColor: "#f0f8ff",
    borderRadius: 20,
  },
  scrollSuggestionText: {
    marginLeft: 10,
    color: "#007bff",
    fontWeight: "bold",
  },

  searchContainer: {
    flexDirection: "row",
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginRight: 10,
  },
  searchButton: {
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  searchButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  questionHeader: {
    marginBottom: 10,
    padding: 5,
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
  },
  yearSubjectText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "bold",
  },
  searchTagContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e6f3ff",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginBottom: 10,
  },
  searchTagText: {
    color: "#007bff",
    marginRight: 5,
  },

  searchButtonClicked: {
    backgroundColor: "#0056b3",
  },
});

export default CourseAccess;
