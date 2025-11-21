import React, { useEffect } from "react";
import { useAppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import { Bell, Check, Trash2 } from "lucide-react";
import SEO from "../components/common/SEO";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { toast } from "react-toastify";

const NotificationsPage = () => {
  const {
    user,
    notifications,
    markAsRead,
    markAllAsRead,
    loading,
  } = useAppContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
      toast.info("Vui lòng đăng nhập để xem thông báo.");
    }
  }, [user, loading, navigate]);

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleDeleteNotification = async (e, notificationId) => {
    e.stopPropagation();
    if (!user) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "notifications", notificationId));
      toast.success("Đã xóa thông báo.");
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("Lỗi khi xóa thông báo.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      <SEO title="Thông báo của bạn" />
      <div className="page-container max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center">
            <Bell className="mr-2" /> Thông báo
          </h1>
          {notifications.length > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center"
            >
              <Check size={16} className="mr-1" /> Đánh dấu tất cả đã đọc
            </button>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          {notifications.length > 0 ? (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors relative group ${
                    !notification.isRead ? "bg-blue-50 dark:bg-blue-900/20" : ""
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 pr-8">
                      <h3 className={`font-semibold text-gray-900 dark:text-gray-100 mb-1 ${!notification.isRead ? "text-blue-700 dark:text-blue-400" : ""}`}>
                        {notification.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                        {notification.message}
                      </p>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {notification.createdAt?.toDate().toLocaleString("vi-VN")}
                      </span>
                    </div>
                    {!notification.isRead && (
                      <span className="h-3 w-3 bg-blue-600 rounded-full flex-shrink-0 mt-1"></span>
                    )}
                  </div>
                  <button
                    onClick={(e) => handleDeleteNotification(e, notification.id)}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Xóa thông báo"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400">
              <Bell size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg">Bạn chưa có thông báo nào.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default NotificationsPage;
