import axios from "axios";
import { useAuthStore } from "../stores/auth";

export const api = axios.create({ baseURL: "/api/v1", timeout: 30_000, withCredentials: true });

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.headers["x-correlation-id"] = crypto.randomUUID();
  return config;
});

api.interceptors.response.use(undefined, async (error) => {
  if (error.response?.status === 401) useAuthStore.getState().logout();
  return Promise.reject(error);
});
