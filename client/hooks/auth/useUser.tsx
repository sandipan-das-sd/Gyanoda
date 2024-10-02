import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { SERVER_URI } from "@/utils/uri";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface User {
  _id: string;
  name: string;
  email: string;
  phone: number;
  location: string;
  avatar?: {
    url: string;
  };
  courses?: Array<{ _id: string }>;
}

export default function useUser() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState("");

  const fetchUser = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const accessToken = await AsyncStorage.getItem("access_token");
      const refreshToken = await AsyncStorage.getItem("refresh_token");

      const response = await axios.get(`${SERVER_URI}/me`, {
        headers: {
          "access-token": accessToken,
          "refresh-token": refreshToken,
        },
      });

      setUser(response.data.user);
    } catch (error: any) {
      setError(error?.message || "An error occurred");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);
  const logout = useCallback(async () => {
    try {
      await axios.get(`${SERVER_URI}/logout`, {
        withCredentials: true,
      });
      setUser(null);
    } catch (error) {
      console.error("Error during logout:", error);
    }
  }, []);
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const refetch = useCallback(() => {
    fetchUser();
  }, [fetchUser]);

  return { loading, user, error, refetch, logout };
}
