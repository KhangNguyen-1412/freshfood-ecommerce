import React, { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../firebase/config";
import { X } from "lucide-react";
import "../../styles/auth.css"; // <-- Import file CSS

const ForgotPasswordModal = ({ onClose, onSwitchToLogin }) => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage(
        "Email đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư của bạn."
      );
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 animate-fade-in">
      <div className="auth-panel">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
        >
          <X size={24} />
        </button>
        <h2 className="auth-title text-green-700 dark:text-green-400">
          Quên Mật Khẩu
        </h2>

        {error && <p className="auth-error-message">{error}</p>}
        {message && <p className="auth-info-message">{message}</p>}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              className="block text-gray-700 dark:text-gray-300 mb-2"
              htmlFor="email"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
              required
            />
          </div>
          <button type="submit" className="auth-submit-button">
            Gửi Email Đặt Lại
          </button>
        </form>

        <p className="text-center mt-4">
          Quay lại?
          <button
            onClick={onSwitchToLogin}
            className="text-green-600 hover:underline ml-1 font-semibold"
          >
            Đăng nhập
          </button>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
