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
  Menu,
} from "lucide-react";

import { useAppContext } from "../../context/AppContext";
import { auth, db } from "../../firebase/config";
import AuthModal from "../auth/AuthModal";
import ForgotPasswordModal from "../auth/ForgotPasswordModal";
import MobileMenuDrawer from "./MobileMenuDrawer";
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
    // Notification from Context
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    // Categories
    categories,
    selectedCategory,
    setSelectedCategory,
  } = useAppContext();

  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  // Removed local notifications state
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
    // ... (Keep existing image search logic)
    const file = event.target.files[0];
    if (!file) return;

    setIsUploadingImage(true);
    toast.info("Đang phân tích hình ảnh...");

    const CLOUDINARY_CLOUD_NAME = "dzvcgfkxs";
    const CLOUDINARY_UPLOAD_PRESET = "user_avatars";

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
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
      const tags = data?.info?.detection?.google_vision_ai?.tags;

      if (tags && tags.length > 0) {
        const searchKeywords = tags.slice(0, 3).join(" ");
        setLocalSearch(searchKeywords);
        setSearchQuery(searchKeywords);
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

  // Removed local notification useEffect

  // Removed local notification useEffect

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

  return (
    <>
      <header className="header bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          {/* Mobile Layout */}
          <div className="md:hidden flex flex-col space-y-3">
            {/* Top Row: Logo + Chat + Theme */}
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <button
                  onClick={() => setIsDrawerOpen(true)}
                  className="mr-3 p-1 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                >
                  <Menu size={24} />
                </button>
                <Link to="/" className="flex items-center text-green-600 font-bold text-xl">
                  <Leaf size={28} className="mr-2" />
                  FreshFood
                </Link>
              </div>
              <div className="flex items-center space-x-3">
                 <button
                  onClick={toggleTheme}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                >
                  {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
                </button>
                {/* Chat button placeholder if needed, or rely on floating widget */}
              </div>
            </div>

            {/* Middle Row: Search Bar (Full Width) */}
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                className="w-full pl-10 pr-12 py-2 rounded-full border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 dark:text-white"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                 <label
                  htmlFor="image-search-input-mobile"
                  className="p-1 text-gray-500"
                >
                  <Camera size={18} />
                </label>
                 <button onClick={handleVoiceSearch} className="p-1 text-gray-500">
                  <Mic size={18} />
                </button>
              </div>
               <input
                type="file"
                id="image-search-input-mobile"
                className="hidden"
                accept="image/*"
                onChange={handleImageSearch}
              />
            </div>

            {/* Bottom Row: Branch + Cart */}
            <div className="flex justify-between items-center">
               {/* Branch Selector */}
               <div className="relative flex-1 mr-4">
                  {selectedBranch && selectedDistrict ? (
                    <button
                      onClick={() => setIsBranchDropdownOpen(!isBranchDropdownOpen)}
                      className="flex items-center text-sm text-gray-700 dark:text-gray-200 truncate max-w-[200px]"
                    >
                      <MapPin size={16} className="mr-1 text-green-600 flex-shrink-0" />
                      <span className="truncate">{selectedDistrict}, {selectedBranch.city}</span>
                      <ChevronDown size={14} className="ml-1" />
                    </button>
                  ) : (
                     <span className="text-sm text-gray-500 italic">Chọn chi nhánh...</span>
                  )}
                   {isBranchDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-700 rounded-md shadow-lg py-1 z-50">
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

               {/* Cart */}
               <Link to="/cart" className="relative p-2 text-gray-600 dark:text-gray-300">
                  <ShoppingCart size={24} />
                  {cart.length > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                      {cart.length}
                    </span>
                  )}
               </Link>
            </div>
          </div>

          {/* Desktop Layout (Hidden on Mobile) */}
          <div className="hidden md:flex items-center justify-between">
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
                <Link to="/notifications" className="relative header-action-button">
                  <Bell size={24} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Link>
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

      <MobileMenuDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </>
  );
};

export default Header;
