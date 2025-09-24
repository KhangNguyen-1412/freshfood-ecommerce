import React from "react";
import "../../styles/CustomChatButton.css"; // File CSS để tạo kiểu cho nút

const CustomChatButton = () => {
  const handleOpenChat = () => {
    // Kiểm tra xem Tawk_API đã sẵn sàng chưa
    if (window.Tawk_API && typeof window.Tawk_API.maximize === "function") {
      // Gọi hàm để mở (phóng to) cửa sổ chat
      window.Tawk_API.maximize();
    } else {
      console.error("Tawk_API is not available.");
      // Bạn có thể hiển thị thông báo cho người dùng ở đây
    }
  };

  return (
    <button className="custom-chat-button" onClick={handleOpenChat}>
      💬 Cần hỗ trợ? Chat ngay!
    </button>
  );
};

export default CustomChatButton;
