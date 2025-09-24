// ví dụ trong file: web-ban-hang/src/pages/LienHePage.js

import React from "react";
import TawkToChat from "../components/TawkToChat/TawkToChat";
import CustomChatButton from "../components/CustomChatButton/CustomChatButton";

const LienHePage = () => {
  return (
    <div>
      <h1>Trang Liên Hệ</h1>
      <p>Nếu bạn có bất kỳ câu hỏi nào, hãy chat với chúng tôi!</p>

      {/* Nút tùy chỉnh để mở chat */}
      <CustomChatButton />

      {/* Component này sẽ tải script Tawk.to và ẩn widget mặc định */}
      {/* Nó không render ra gì cả nên có thể đặt ở bất cứ đâu */}
      <TawkToChat />
    </div>
  );
};

export default LienHePage;
