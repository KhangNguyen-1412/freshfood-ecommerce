import React, { useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../firebase/config";
import { X } from "lucide-react";
import "../../styles/auth.css"; // <-- Import file CSS

const AuthModal = ({ onClose, onSwitchToForgotPassword }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        await updateProfile(userCredential.user, { displayName });
        await setDoc(doc(db, "users", userCredential.user.uid), {
          displayName,
          email,
          role: "customer",
          createdAt: serverTimestamp(),
        });
      }
      onClose();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      onClose();
    } catch (err) {
      setError(err.message);
      console.error("Lỗi đăng nhập Google:", err);
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
          {isLogin ? "Đăng Nhập" : "Đăng Ký"}
        </h2>

        {error && <p className="auth-error-message">{error}</p>}

        <button
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center py-2.5 border dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors mb-4"
        >
          <svg className="w-5 h-5 mr-3" viewBox="0 0 48 48">
            {/* SVG path data */}
          </svg>
          <span>Tiếp tục với Google</span>
        </button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">
              HOẶC
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="mb-4">
              <label
                className="block text-gray-700 dark:text-gray-300 mb-2"
                htmlFor="displayName"
              >
                Tên hiển thị
              </label>
              <input
                type="text"
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="auth-input"
                required
              />
            </div>
          )}
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
          <div className="mb-6">
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
          <button type="submit" className="auth-submit-button">
            {isLogin ? "Đăng Nhập" : "Đăng Ký"}
          </button>
        </form>

        <p className="text-center mt-4">
          {isLogin ? "Chưa có tài khoản?" : "Đã có tài khoản?"}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-green-600 hover:underline ml-1 font-semibold"
          >
            {isLogin ? "Đăng ký ngay" : "Đăng nhập"}
          </button>
        </p>
        {isLogin && (
          <p className="text-center mt-2">
            <button
              onClick={onSwitchToForgotPassword}
              className="text-sm text-gray-500 hover:underline"
            >
              Quên mật khẩu?
            </button>
          </p>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
