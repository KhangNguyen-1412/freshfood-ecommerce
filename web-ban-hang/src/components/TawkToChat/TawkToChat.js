import React, { useEffect } from "react";

const TawkToChat = () => {
  useEffect(() => {
    // --- Bắt đầu logic thêm script Tawk.to ---

    // Khởi tạo API và định nghĩa hook `onLoad`
    // Hook này sẽ được gọi ngay khi widget tải xong
    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_API.onLoad = function () {
      // Ẩn widget mặc định đi
      window.Tawk_API.hideWidget();
    };

    window.Tawk_LoadStart = new Date();

    // Tạo và thêm script vào trang
    const script = document.createElement("script");
    script.async = true;
    // Thay thế bằng SRC từ mã widget của bạn
    script.src = "https://embed.tawk.to/68be94b6eb582f19258cf360/1j4k79qld";
    script.charset = "UTF-8";
    script.setAttribute("crossorigin", "*");

    document.body.appendChild(script);

    // --- Kết thúc logic thêm script Tawk.to ---

    // Hàm dọn dẹp
    return () => {
      // Khi component bị gỡ, chúng ta cũng có thể ẩn widget để đảm bảo
      if (window.Tawk_API && typeof window.Tawk_API.hideWidget === "function") {
        window.Tawk_API.hideWidget();
      }
    };
  }, []);

  return null;
};

export default TawkToChat;
