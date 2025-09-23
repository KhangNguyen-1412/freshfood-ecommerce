import React, { useState } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { Link, useNavigate } from "react-router-dom";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { toast } from "react-toastify";
import {
  Leaf,
  Search,
  Moon,
  Sun,
  ShoppingCart,
  User,
  Shield,
  LogOut,
  Package,
  MapPin,
  ChevronDown,
  Bell,
  Mic,
  Camera,
} from "lucide-react";

import { useAppContext } from "../../context/AppContext";
import { auth, db } from "../../firebase/config";
import AuthModal from "../auth/AuthModal";
import ForgotPasswordModal from "../auth/ForgotPasswordModal";
import "../../styles/layout.css";

const Header = () => {
  const {
    user,
    userData,
    cart,
    theme,
    toggleTheme,
    setSearchQuery,
    branches,
    selectedBranch,
    handleSelectBranch,
    selectedDistrict,
    resetBranchSelection,
    clearCart,
  } = useAppContext();

  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState("");

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  // Cấu hình cho tìm kiếm bằng giọng nói
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  // Cập nhật ô tìm kiếm khi người dùng nói
  React.useEffect(() => {
    if (transcript) {
      setLocalSearch(transcript);
    }
  }, [transcript]);

  const handleImageSearch = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploadingImage(true);
    toast.info("Đang phân tích hình ảnh...");

    // Thông tin Cloudinary (nên đưa vào biến môi trường)
    const CLOUDINARY_CLOUD_NAME = "dzvcgfkxs";
    const CLOUDINARY_UPLOAD_PRESET = "user_avatars"; // Bạn có thể tạo một preset riêng cho image search

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    // Yêu cầu Cloudinary trả về thông tin từ add-on nhận dạng ảnh
    formData.append("detection", "google_vision_ai");

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );
      const data = await res.json();

      // Lấy các tags từ kết quả của Google Vision
      const tags = data?.info?.detection?.google_vision_ai?.tags;

      if (tags && tags.length > 0) {
        // Lấy 3 tag đầu tiên có độ tin cậy cao nhất làm từ khóa
        const searchKeywords = tags.slice(0, 3).join(" ");
        setLocalSearch(searchKeywords);
        setSearchQuery(searchKeywords); // Thực hiện tìm kiếm ngay
        navigate("/");
        toast.success(`Đã tìm thấy các từ khóa: "${searchKeywords}"`);
      } else {
        toast.warn("Không thể nhận dạng được đối tượng trong ảnh.");
      }
    } catch (error) {
      toast.error("Lỗi khi phân tích hình ảnh.");
    } finally {
      setIsUploadingImage(false);
    }
  };
  const handleLogout = async () => {
    const userId = user?.uid;
    if (
      window.confirm(
        "Đăng xuất sẽ xóa vĩnh viễn giỏ hàng của bạn. Bạn có chắc chắn?"
      )
    ) {
      try {
        if (userId) {
          await clearCart(userId);
        }
        await signOut(auth);
        setShowProfileMenu(false);
        navigate("/");
        toast.success("Đã đăng xuất thành công.");
      } catch (error) {
        toast.error("Đã có lỗi xảy ra khi đăng xuất.");
        console.error("Logout Error:", error);
      }
    }
  };

  // Lấy thông báo cho người dùng
  React.useEffect(() => {
    if (user) {
      const notifQuery = query(
        collection(db, "users", user.uid, "notifications"),
        orderBy("createdAt", "desc")
      );
      const unsubscribe = onSnapshot(notifQuery, (snapshot) => {
        setNotifications(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
      });
      return () => unsubscribe();
    } else {
      setNotifications([]);
    }
  }, [user]);

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      const notifRef = doc(
        db,
        "users",
        user.uid,
        "notifications",
        notification.id
      );
      await updateDoc(notifRef, { isRead: true });
    }
    navigate(notification.link || "/profile");
    setShowNotifications(false);
  };

  const handleMarkAllAsRead = async () => {
    if (!user || unreadCount === 0) return;

    const batch = writeBatch(db);
    const unreadNotifications = notifications.filter((n) => !n.isRead);

    unreadNotifications.forEach((notification) => {
      const notifRef = doc(
        db,
        "users",
        user.uid,
        "notifications",
        notification.id
      );
      batch.update(notifRef, { isRead: true });
    });

    try {
      await batch.commit();
      toast.info("Đã đánh dấu tất cả là đã đọc.");
    } catch (error) {
      console.error("Lỗi khi đánh dấu đã đọc:", error);
      toast.error("Đã có lỗi xảy ra.");
    }
  };

  const handleVoiceSearch = () => {
    if (!browserSupportsSpeechRecognition) {
      return toast.error(
        "Trình duyệt của bạn không hỗ trợ nhận dạng giọng nói."
      );
    }
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      resetTranscript();
      SpeechRecognition.startListening({
        continuous: false,
        language: "vi-VN",
      });
    }
  };
  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      setSearchQuery(localSearch);
      navigate("/");
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <>
      <header className="header">
        <div className="header-container">
          <Link to="/" className="header-brand">
            <Leaf size={32} className="mr-2" />
            FreshFood
          </Link>

          {/* Thêm link đến trang Combo */}
          <Link to="/combos" className="header-nav-link">
            <Package size={20} className="mr-1" />
            Combo
          </Link>

          {selectedBranch && selectedDistrict && (
            <div className="relative">
              <button
                onClick={() => setIsBranchDropdownOpen(!isBranchDropdownOpen)}
                className="flex items-center text-sm text-gray-600 dark:text-gray-300"
              >
                <MapPin
                  size={16}
                  className="mr-2 text-gray-400 flex-shrink-0"
                />
                <div className="text-left">
                  <span className="text-xs text-gray-500">Giao đến</span>
                  <p className="font-semibold leading-tight">
                    {selectedDistrict}, {selectedBranch.city}
                  </p>
                </div>
                <ChevronDown size={16} className="ml-1" />
              </button>
              {isBranchDropdownOpen && (
                <div className="absolute top-full mt-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg py-1 z-50">
                  {branches.map((branch) => (
                    <button
                      key={branch.id}
                      onClick={() => {
                        handleSelectBranch(branch);
                        setIsBranchDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                    >
                      {branch.branchName}
                    </button>
                  ))}
                  <div className="border-t dark:border-gray-600 my-1"></div>
                  <button
                    onClick={() => {
                      resetBranchSelection();
                      setIsBranchDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    Chọn địa chỉ khác...
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="w-full max-w-xl hidden md:block">
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                className="header-search-input"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
              <Search
                size={20}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="file"
                id="image-search-input"
                className="hidden"
                accept="image/*"
                onChange={handleImageSearch}
              />
              <label
                htmlFor="image-search-input"
                title="Tìm kiếm bằng hình ảnh"
                className={`absolute right-12 top-1/2 -translate-y-1/2 p-1 rounded-full cursor-pointer transition-colors ${
                  isUploadingImage
                    ? "text-blue-500 animate-spin"
                    : "text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                <Camera size={18} />
              </label>
              <button
                onClick={handleVoiceSearch}
                title="Tìm kiếm bằng giọng nói"
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors ${
                  listening
                    ? "bg-red-500 text-white animate-pulse"
                    : "text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                <Mic size={18} />
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="header-action-button p-2 rounded-full"
            >
              {theme === "light" ? <Moon size={22} /> : <Sun size={22} />}
            </button>

            {user && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative header-action-button"
                >
                  <Bell size={24} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-700 rounded-md shadow-lg z-50 animate-fade-in max-h-96 overflow-y-auto">
                    <div className="p-3 border-b dark:border-gray-600 flex justify-between items-center">
                      <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                        Thông báo
                      </h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllAsRead}
                          className="text-xs text-blue-500 hover:underline"
                        >
                          Đánh dấu đã đọc
                        </button>
                      )}
                    </div>
                    {notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification)}
                          className={`p-3 border-b dark:border-gray-600 last:border-0 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer ${
                            !notification.isRead
                              ? "bg-blue-50 dark:bg-blue-900/20"
                              : ""
                          }`}
                        >
                          <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">
                            {notification.title}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {notification.createdAt
                              ?.toDate()
                              .toLocaleString("vi-VN")}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="p-4 text-center text-sm text-gray-500">
                        Bạn chưa có thông báo nào.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            <Link to="/cart" className="relative header-action-button">
              <ShoppingCart size={24} />
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </Link>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center space-x-2 header-profile-button"
                >
                  <img
                    src={
                      user.photoURL || `https://i.pravatar.cc/150?u=${user.uid}`
                    }
                    alt="avatar"
                    className="h-8 w-8 rounded-full object-cover"
                  />
                  <span className="hidden lg:inline">
                    {userData?.displayName || "User"}
                  </span>
                </button>
                {showProfileMenu && (
                  <div className="header-profile-menu">
                    <Link
                      to="/profile"
                      onClick={() => setShowProfileMenu(false)}
                      className="header-profile-menu-item"
                    >
                      <User size={16} className="mr-2" /> Hồ sơ của tôi
                    </Link>
                    {userData?.role === "admin" && (
                      <Link
                        to="/admin"
                        onClick={() => setShowProfileMenu(false)}
                        className="header-profile-menu-item"
                      >
                        <Shield size={16} className="mr-2" /> Trang Admin
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="header-profile-menu-item"
                    >
                      <LogOut size={16} className="mr-2" /> Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-2">
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-4 py-2 text-sm font-medium text-green-600 border border-green-600 rounded-md hover:bg-green-50 dark:hover:bg-green-900/20"
                >
                  Đăng nhập
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSwitchToForgotPassword={() => {
            setShowAuthModal(false);
            setShowForgotPasswordModal(true);
          }}
        />
      )}
      {showForgotPasswordModal && (
        <ForgotPasswordModal
          onClose={() => setShowForgotPasswordModal(false)}
          onSwitchToLogin={() => {
            setShowForgotPasswordModal(false);
            setShowAuthModal(true);
          }}
        />
      )}
    </>
  );
};

export default Header;
