import React from "react";
import { Link } from "react-router-dom";
import SEO from "../components/common/SEO";
import NewsletterForm from "../components/common/NewsletterForm";

const NewsletterSignupPage = () => {
  return (
    <>
      <SEO
        title="Đăng ký nhận bản tin"
        description="Đăng ký để nhận những thông tin mới nhất về sản phẩm và các chương trình khuyến mãi độc quyền từ FreshFood."
      />
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full mx-auto p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg text-center">
          <Link
            to="/"
            className="text-3xl font-bold text-green-700 flex items-center justify-center mb-4"
          >
            {/* Bạn có thể dùng icon Leaf ở đây nếu muốn */}
            FreshFood
          </Link>

          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            Đừng bỏ lỡ!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Hãy là người đầu tiên biết về các sản phẩm mới, công thức nấu ăn hấp
            dẫn và những ưu đãi chỉ dành riêng cho bạn.
          </p>

          <NewsletterForm />

          <div className="mt-6">
            <Link to="/" className="text-sm text-blue-600 hover:underline">
              Quay về trang chủ
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default NewsletterSignupPage;
