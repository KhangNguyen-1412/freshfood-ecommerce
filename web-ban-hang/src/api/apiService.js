import axios from "axios";
import { toast } from "react-toastify";

// Tạo một instance của Axios với các cấu hình mặc định
const apiService = axios.create({
  baseURL: "https://your-backend-api.com/api/v1", // URL gốc của API backend
  timeout: 10000, // Thời gian tối đa cho một yêu cầu (10 giây)
  headers: {
    "Content-Type": "application/json",
  },
});

// --- Interceptor để thêm token vào mỗi request ---
apiService.interceptors.request.use(
  (config) => {
    // Lấy token từ localStorage (hoặc bất kỳ nơi nào bạn lưu trữ)
    const token = localStorage.getItem("accessToken");
    if (token) {
      // Nếu có token, gắn vào header Authorization
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // Xử lý lỗi nếu có lỗi trong quá trình thiết lập request
    return Promise.reject(error);
  }
);

// --- Interceptor để xử lý response hoặc lỗi chung ---
apiService.interceptors.response.use(
  (response) => {
    // Bất kỳ mã trạng thái nào nằm trong phạm vi 2xx sẽ kích hoạt hàm này
    // Chỉ trả về phần data của response
    return response.data;
  },
  (error) => {
    // Bất kỳ mã trạng thái nào nằm ngoài phạm vi 2xx sẽ kích hoạt hàm này
    const message =
      error.response?.data?.message || error.message || "Đã có lỗi xảy ra";

    // Xử lý các lỗi cụ thể
    if (error.response?.status === 401) {
      // Ví dụ: Xử lý khi token hết hạn
      toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      // Xóa thông tin user và chuyển hướng về trang đăng nhập
      localStorage.removeItem("accessToken");
      window.location.href = "/login";
    } else {
      // Hiển thị các lỗi khác
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

export default apiService;
