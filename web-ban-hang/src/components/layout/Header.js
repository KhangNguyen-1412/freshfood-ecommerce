import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  MapPin,
  ChevronDown,
} from "lucide-react";

import { useAppContext } from "../../context/AppContext";
import { auth } from "../../firebase/config";
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
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState("");

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

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      setSearchQuery(localSearch);
      navigate("/");
    }
  };

  return (
    <>
      <header className="header">
        <div className="header-container">
          {/* THAY THẾ <button> BẰNG <Link> */}
          <Link to="/" className="header-brand">
            <Leaf size={32} className="mr-2" />
            FreshFood
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
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="header-action-button p-2 rounded-full"
            >
              {theme === "light" ? <Moon size={22} /> : <Sun size={22} />}
            </button>

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
                  // === CLASS MỚI ĐƯỢC ÁP DỤNG VÀO ĐÂY ===
                  className="flex items-center space-x-2 header-profile-button"
                >
                  <img
                    src={
                      user.photoURL || `https://i.pravatar.cc/150?u=${user.uid}`
                    }
                    alt="avatar"
                    className="h-8 w-8 rounded-full object-cover"
                  />
                  {/* Bỏ font-semibold ở đây vì đã có trong class mới */}
                  <span className="hidden lg:inline">
                    {userData?.displayName || "User"}
                  </span>
                </button>
                {showProfileMenu && (
                  <div className="header-profile-menu">
                    {/* THAY THẾ <button> BẰNG <Link> */}
                    <Link
                      to="/profile"
                      onClick={() => setShowProfileMenu(false)}
                      className="header-profile-menu-item"
                    >
                      <User size={16} className="mr-2" /> Hồ sơ của tôi
                    </Link>
                    {userData?.role === "admin" && (
                      <Link
                        to="/admin" // Chuyển đến trang dashboard admin
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
