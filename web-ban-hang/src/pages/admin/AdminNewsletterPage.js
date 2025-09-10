import React, { useState } from "react";
import { toast } from "react-toastify";
import Spinner from "../../components/common/Spinner";
import "../../styles/admin.css";

const AdminNewsletterPage = () => {
  const [subject, setSubject] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!subject || !htmlContent) {
      return toast.warn("Vui lòng nhập tiêu đề và nội dung email.");
    }
    if (
      !window.confirm(
        `Bạn có chắc muốn gửi email với tiêu đề "${subject}" đến tất cả người đăng ký?`
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      // Gọi đến Vercel function bạn đã tạo
      const response = await fetch("/api/send-newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, htmlContent }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message);
      }

      toast.success(result.message);
      setSubject("");
      setHtmlContent("");
    } catch (error) {
      toast.error(`Gửi thất bại: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="admin-page-title">Soạn và Gửi Bản tin</h1>
      <div className="admin-form-container mt-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tiêu đề Email
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 mt-1"
              placeholder="Ví dụ: Ưu đãi cuối tuần, chỉ dành cho bạn!"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Nội dung Email (HTML)
            </label>
            <textarea
              value={htmlContent}
              onChange={(e) => setHtmlContent(e.target.value)}
              rows="15"
              className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 mt-1 font-mono text-sm"
              placeholder="<p>Xin chào,</p><p>Đây là nội dung <b>email</b> của bạn.</p>"
            />
            <p className="text-xs text-gray-500 mt-1">
              Mẹo: Bạn có thể thiết kế email trên Brevo, sau đó xuất ra dạng
              HTML và dán vào đây.
            </p>
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleSend}
              disabled={loading}
              className="admin-button-blue disabled:bg-gray-400"
            >
              {loading ? (
                <Spinner size="sm" />
              ) : (
                "Gửi ngay đến tất cả người đăng ký"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminNewsletterPage;
