import React from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { XCircle } from "lucide-react";
import SEO from "../components/common/SEO";
import "../styles/pages.css";

const PaymentCancelPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const reason = searchParams.get("reason");

  const handleRetry = () => {
    // Chuyển hướng người dùng trở lại trang thanh toán
    navigate("/checkout");
  };

  return (
    <>
      <SEO
        title="Thanh toán thất bại"
        description="Thông báo về việc thanh toán không thành công hoặc đã bị hủy."
      />
      <div className="page-container flex items-center justify-center text-center">
        <div className="bg-white dark:bg-gray-800 p-10 rounded-lg shadow-lg max-w-lg w-full animate-fade-in">
          <XCircle
            className="text-red-500 mx-auto mb-4"
            size={80}
            strokeWidth={1.5}
          />
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            Giao dịch bị hủy
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {reason
              ? `Giao dịch không thành công vì: ${reason}.`
              : "Giao dịch của bạn đã bị hủy hoặc đã xảy ra lỗi. Vui lòng thử lại."}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleRetry}
              className="cart-checkout-button bg-blue-600 hover:bg-blue-700"
            >
              Thử lại thanh toán
            </button>
            <Link
              to="/cart"
              className="cart-checkout-button bg-gray-600 hover:bg-gray-700"
            >
              Quay về giỏ hàng
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default PaymentCancelPage;
