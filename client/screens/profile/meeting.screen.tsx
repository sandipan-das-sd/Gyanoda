import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from "react-native";

export default function MeetingScreen() {
  const [meetingId, setMeetingId] = useState("");

  const joinMeeting = () => {
    // Logic to join a meeting would go here
    console.log(`Joining meeting with ID: ${meetingId}`);
  };

  const startNewMeeting = () => {
    // Logic to start a new meeting would go here
    console.log("Starting a new meeting");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Video Meeting</Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter meeting ID"
          value={meetingId}
          onChangeText={setMeetingId}
        />
        <TouchableOpacity style={styles.button} onPress={joinMeeting}>
          <Text style={styles.buttonText}>Join Meeting</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.button} onPress={startNewMeeting}>
        <Text style={styles.buttonText}>Start New Meeting</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  inputContainer: {
    width: "100%",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
});
