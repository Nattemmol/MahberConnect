import axios from "axios";
import { useAuthStore } from "@/lib/stores/auth-store";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to inject the JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Add a response interceptor to handle 401s (token expiry) and log responses
apiClient.interceptors.response.use(
  (response) => {
    try {
      const method = (response.config?.method || "get")
        .toString()
        .toUpperCase();
      const url = response.config?.url || response.request?.responseURL || "";
      // Log the URL and the response body (data)
      console.log(`[apiClient] ${method} ${url} ->`, response.data);
    } catch (err) {
      console.log("[apiClient] Failed to log response", err);
    }
    return response;
  },
  (error) => {
    try {
      const method = (error.config?.method || "unknown")
        .toString()
        .toUpperCase();
      const base = error.config?.baseURL || API_URL;
      const url = error.config?.url || "";
      const fullUrl = `${base}${url}`;
      const hasAuthHeader = !!error.config?.headers?.Authorization;
      const hasAuthStoreToken = !!useAuthStore.getState().token;
      const hasAuth = hasAuthHeader || hasAuthStoreToken;

      console.error(
        `[apiClient] Error ${method} ${fullUrl} ->`,
        error.response?.status,
        error.response?.statusText,
        error.response?.data || error.message,
        { hasAuth },
      );
    } catch (err) {
      console.error("[apiClient] Failed to log error", err);
    }

    if (error.response?.status === 401) {
      // Clear auth state and redirect to login if unauthorized
      useAuthStore.getState().logout();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);
