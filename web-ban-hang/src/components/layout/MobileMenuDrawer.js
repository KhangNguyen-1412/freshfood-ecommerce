import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { X, ChevronDown, ChevronRight, LogOut, User, Shield } from "lucide-react";
import { useAppContext } from "../../context/AppContext";
import { auth } from "../../firebase/config";
import { signOut } from "firebase/auth";

import { motion, AnimatePresence } from "framer-motion";

const MobileMenuDrawer = ({ isOpen, onClose }) => {
  const {
    categories,
    selectedCategory,
    setSelectedCategory,
    user,
    userData,
    clearCart,
  } = useAppContext();
  const navigate = useNavigate();
  const [expandedParents, setExpandedParents] = useState({});

  // Reset expanded state when drawer closes
  useEffect(() => {
    if (!isOpen) {
      setExpandedParents({});
    }
  }, [isOpen]);

  const handleCategoryClick = (categoryId) => {
    setSelectedCategory(categoryId);
    navigate("/");
    onClose();
  };

  const toggleParent = (parentId) => {
    setExpandedParents((prev) => ({
      ...prev,
      [parentId]: !prev[parentId],
    }));
  };

  const handleLogout = async () => {
    if (window.confirm("Bạn có chắc chắn muốn đăng xuất?")) {
      try {
        if (user?.uid) {
          await clearCart(user.uid);
        }
        await signOut(auth);
        navigate("/");
        onClose();
      } catch (error) {
        console.error("Logout Error:", error);
      }
    }
  };

  // Organize categories into parent-child structure
  const parentCategories = categories.filter((cat) => !cat.parentId);
  const getChildCategories = (parentId) =>
    categories.filter((cat) => cat.parentId === parentId);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={onClose}
          ></motion.div>

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative w-4/5 max-w-xs bg-white dark:bg-gray-800 h-full shadow-xl flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center bg-green-600 text-white">
              <h2 className="font-bold text-lg">Danh mục</h2>
              <button onClick={onClose} className="p-1 hover:bg-green-700 rounded">
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* User Info (Optional, handy for mobile) */}
              {user && (
                <div className="mb-6 pb-4 border-b dark:border-gray-700">
                  <div className="flex items-center space-x-3 mb-3">
                    <img
                      src={user.photoURL || `https://i.pravatar.cc/150?u=${user.uid}`}
                      alt="avatar"
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-gray-100">
                        {userData?.displayName || "User"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[150px]">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <Link
                    to="/profile"
                    onClick={onClose}
                    className="flex items-center text-sm text-gray-600 dark:text-gray-300 hover:text-green-600 mb-2"
                  >
                    <User size={16} className="mr-2" /> Hồ sơ cá nhân
                  </Link>
                  {userData?.role === "admin" && (
                    <Link
                      to="/admin"
                      onClick={onClose}
                      className="flex items-center text-sm text-gray-600 dark:text-gray-300 hover:text-green-600"
                    >
                      <Shield size={16} className="mr-2" /> Trang quản trị
                    </Link>
                  )}
                </div>
              )}

              {/* Category List */}
              <nav className="space-y-1">
                <button
                  onClick={() => handleCategoryClick(null)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedCategory === null
                      ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                      : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  Tất cả sản phẩm
                </button>

                {parentCategories.map((parent) => {
                  const children = getChildCategories(parent.id);
                  const isExpanded = expandedParents[parent.id];
                  const isSelected = selectedCategory === parent.id;

                  return (
                    <div key={parent.id}>
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => handleCategoryClick(parent.id)}
                          className={`flex-1 text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                            isSelected
                              ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                              : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                          }`}
                        >
                          {parent.name}
                        </button>
                        {children.length > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleParent(parent.id);
                            }}
                            className="p-2 text-gray-500 hover:text-green-600"
                          >
                            <motion.div
                              animate={{ rotate: isExpanded ? 180 : 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <ChevronDown size={16} />
                            </motion.div>
                          </button>
                        )}
                      </div>

                      {/* Sub-categories */}
                      <AnimatePresence>
                        {children.length > 0 && isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="ml-4 border-l-2 border-gray-200 dark:border-gray-700 pl-2 mt-1 space-y-1">
                              {children.map((child) => (
                                <button
                                  key={child.id}
                                  onClick={() => handleCategoryClick(child.id)}
                                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                                    selectedCategory === child.id
                                      ? "text-green-600 font-medium"
                                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                                  }`}
                                >
                                  {child.name}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </nav>
            </div>

            {/* Footer */}
            {user ? (
              <div className="p-4 border-t dark:border-gray-700">
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-red-600 bg-red-50 dark:bg-red-900/20 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                >
                  <LogOut size={18} className="mr-2" /> Đăng xuất
                </button>
              </div>
            ) : (
              <div className="p-4 border-t dark:border-gray-700 grid grid-cols-2 gap-3">
                 <div className="col-span-2 text-center text-sm text-gray-500">
                    Vui lòng đăng nhập để mua sắm
                 </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default MobileMenuDrawer;
