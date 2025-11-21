import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Bell, User } from "lucide-react";
import { useAppContext } from "../../context/AppContext";

const MobileBottomNav = () => {
  const location = useLocation();
  const { unreadCount } = useAppContext();

  const isActive = (path) => location.pathname === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t dark:border-gray-700 shadow-lg z-50 md:hidden pb-safe">
      <div className="flex justify-around items-center h-16">
        <Link
          to="/"
          className={`flex flex-col items-center justify-center w-full h-full ${
            isActive("/")
              ? "text-green-600 dark:text-green-400"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          <Home size={24} />
          <span className="text-xs mt-1">Trang chủ</span>
        </Link>

        <Link
          to="/notifications"
          className={`relative flex flex-col items-center justify-center w-full h-full ${
            isActive("/notifications")
              ? "text-green-600 dark:text-green-400"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          <div className="relative">
            <Bell size={24} />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>
          <span className="text-xs mt-1">Thông báo</span>
        </Link>

        <Link
          to="/profile"
          className={`flex flex-col items-center justify-center w-full h-full ${
            isActive("/profile")
              ? "text-green-600 dark:text-green-400"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          <User size={24} />
          <span className="text-xs mt-1">Cá nhân</span>
        </Link>
      </div>
    </div>
  );
};

export default MobileBottomNav;
