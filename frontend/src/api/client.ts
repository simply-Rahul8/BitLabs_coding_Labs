import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1"
});

apiClient.interceptors.request.use((config) => {
  const token =
    window.localStorage.getItem("access_token") ?? window.localStorage.getItem("bitlabs_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
