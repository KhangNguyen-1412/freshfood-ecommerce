import React, { useState } from "react";
import { toast } from "react-toastify";

const NewsletterForm = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);

    try {
      // Gọi đến Vercel function mà chúng ta vừa tạo
      const response = await fetch("/api/subscribe-newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Nếu có lỗi, hiển thị thông báo lỗi từ server
        throw new Error(result.message || "Đã có lỗi xảy ra.");
      }

      toast.success("Cảm ơn bạn đã đăng ký nhận bản tin!");
      setEmail(""); // Xóa email trong form sau khi thành công
    } catch (error) {
      // Hiển thị các lỗi khác
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h4 className="footer-section-title">Đăng ký nhận tin</h4>
      <p className="text-sm mb-4">
        Nhận thông tin về sản phẩm mới và các chương trình khuyến mãi đặc biệt!
      </p>
      <form onSubmit={handleSubmit} className="flex">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Nhập email của bạn..."
          className="w-full p-2 border rounded-l-md dark:bg-gray-700 dark:border-gray-600"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 text-white px-4 rounded-r-md hover:bg-green-700 disabled:bg-gray-400"
        >
          {loading ? "..." : "Đăng ký"}
        </button>
      </form>
    </div>
  );
};

export default NewsletterForm;
