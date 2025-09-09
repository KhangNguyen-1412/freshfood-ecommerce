import axios from "axios";
import { toast } from "react-toastify";

const apiService = axios.create({
  baseURL: "https://your-backend-api.com/api/v1",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiService.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiService.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const message =
      error.response?.data?.message || error.message || "Đã có lỗi xảy ra";

    if (error.response?.status === 401) {
      toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      localStorage.removeItem("accessToken");
      window.location.href = "/login";
    } else {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

export default apiService;
