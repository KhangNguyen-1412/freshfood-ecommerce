import apiService from "./apiService";

const authService = {
  /**
   * Gửi yêu cầu đăng nhập đến server.
   * @param {object} credentials - Chứa email và password.
   * @returns {Promise<object>} - Dữ liệu trả về từ server (ví dụ: user info và token).
   */
  login: (credentials) => {
    // credentials có dạng { email: 'user@example.com', password: '123' }
    return apiService.post("/auth/login", credentials);
  },

  /**
   * Gửi yêu cầu đăng ký tài khoản mới.
   * @param {object} userData - Thông tin người dùng (displayName, email, password).
   * @returns {Promise<object>} - Dữ liệu trả về từ server.
   */
  register: (userData) => {
    return apiService.post("/auth/register", userData);
  },

  /**
   * Lấy thông tin người dùng hiện tại (dựa trên token đã gửi).
   * @returns {Promise<object>} - Thông tin chi tiết của người dùng.
   */
  getCurrentUser: () => {
    return apiService.get("/auth/me");
  },

  /**
   * Gửi yêu cầu quên mật khẩu.
   * @param {string} email - Email của người dùng cần reset mật khẩu.
   * @returns {Promise<object>} - Thông báo thành công từ server.
   */
  forgotPassword: (email) => {
    return apiService.post("/auth/forgot-password", { email });
  },
};

export default authService;
