import { appRoute } from "@/config/appRoute";
import axios from "axios";

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_REACT_APP_API || "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token"); // or get from auth context

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
    (error) => {
        if (error.response?.status === 401) {
           
            localStorage.removeItem('token');
            window.location.href = appRoute.home;
        }
        return Promise.reject(error);
    }
)

const axiosInstanceAzure = axios.create({
  baseURL: process.env.NEXT_PUBLIC_REACT_APP_API || "http://localhost:3000",
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstanceAzure.interceptors.request.use((config) => {
  const refreshToken = localStorage.getItem("refresh_token");

  return config;
});

export const setRefreshToken = (refreshToken: string) => {
  localStorage.setItem("refresh_token", refreshToken);
  axiosInstanceAzure.defaults.headers.common['Authorization'] = refreshToken
}


export const removeRefreshToken = () => {
  localStorage.removeItem("refresh_token");
  axiosInstanceAzure.defaults.headers.common['Authorization'] = ''
}
export const setToken = (token: string) => {
  localStorage.setItem("token", token);
  axiosInstance.defaults.headers.common['Authorization'] = token
}

export const removeToken = () => {
  localStorage.removeItem("token");
  axiosInstance.defaults.headers.common['Authorization'] = ''
}


export { axiosInstance, axiosInstanceAzure };

