import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import SEO from "../components/common/SEO";
import "../styles/pages.css";

const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  const paymentMethod = searchParams.get("paymentMethod"); // Ví dụ: 'vnpay', 'momo'

  let title = "Đặt hàng thành công!";
  let message =
    "Cảm ơn bạn đã mua hàng. Đơn hàng của bạn đã được ghi nhận và đang được xử lý.";

  if (paymentMethod) {
    title = "Thanh toán thành công!";
    message =
      "Cảm ơn bạn đã mua hàng. Chúng tôi đã nhận được thanh toán và đơn hàng của bạn đang được xử lý.";
  }

  return (
    <>
      <SEO
        title={title}
        description="Xác nhận đặt hàng và thanh toán thành công tại FreshFood."
      />
      <div className="page-container flex items-center justify-center text-center">
        <div className="bg-white dark:bg-gray-800 p-10 rounded-lg shadow-lg max-w-lg w-full animate-fade-in">
          <CheckCircle
            className="text-green-500 mx-auto mb-4"
            size={80}
            strokeWidth={1.5}
          />
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            {title}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>

          {orderId && (
            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md mb-8">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Mã đơn hàng của bạn
              </p>
              <p className="text-lg font-mono font-semibold text-gray-800 dark:text-gray-200">
                #{orderId.substring(0, 8)}
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/"
              className="cart-checkout-button bg-gray-600 hover:bg-gray-700"
            >
              Tiếp tục mua sắm
            </Link>
            <Link to="/profile" className="cart-checkout-button">
              Xem lịch sử đơn hàng
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default PaymentSuccessPage;
