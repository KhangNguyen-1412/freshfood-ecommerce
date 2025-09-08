import React, { useState } from "react";
import { X } from "lucide-react";
import "../../styles/auth.css"; // <-- Import file CSS

const ReauthenticationModal = ({ onConfirm, onCancel }) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsProcessing(true);
    try {
      await onConfirm(password);
    } catch (err) {
      setError("Mật khẩu không chính xác hoặc đã có lỗi xảy ra.");
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 animate-fade-in">
      <div className="auth-panel">
        <button
          onClick={onCancel}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
        >
          <X size={24} />
        </button>
        <h2 className="auth-title text-red-600">Xác nhận hành động</h2>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
          Để đảm bảo an toàn, vui lòng nhập lại mật khẩu của bạn để tiếp tục.
        </p>

        {error && <p className="auth-error-message">{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              className="block text-gray-700 dark:text-gray-300 mb-2"
              htmlFor="password"
            >
              Mật khẩu
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isProcessing}
            className="auth-danger-button"
          >
            {isProcessing ? "Đang xử lý..." : "Xác nhận"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReauthenticationModal;
