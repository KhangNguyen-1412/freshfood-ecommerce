import React, { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle, XCircle } from "lucide-react";
import SEO from "../components/common/SEO";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import "../styles/pages.css";

const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId") || searchParams.get("vnp_TxnRef"); // VNPay trả về mã đơn hàng qua vnp_TxnRef
  const paymentMethod = searchParams.get("paymentMethod"); // Ví dụ: 'vnpay', 'momo'
  const vnp_ResponseCode = searchParams.get("vnp_ResponseCode");

  let title = "Đặt hàng thành công!";
  let message =
    "Cảm ơn bạn đã mua hàng. Đơn hàng của bạn đã được ghi nhận và đang được xử lý.";
  let Icon = CheckCircle;
  let iconColor = "text-green-500";

  if (paymentMethod === "BANK_TRANSFER") {
     title = "Đặt hàng thành công!";
     message = "Vui lòng thực hiện chuyển khoản để hoàn tất đơn hàng.";
  } else if (vnp_ResponseCode === "00") {
    title = "Thanh toán VNPay thành công!";
    message = "Giao dịch của bạn đã được ghi nhận. Chúng tôi sẽ sớm xử lý đơn hàng.";
  } else if (vnp_ResponseCode && vnp_ResponseCode !== "00") {
    title = "Thanh toán thất bại";
    message = "Giao dịch VNPay không thành công hoặc bị hủy. Vui lòng thử lại.";
    Icon = XCircle;
    iconColor = "text-red-500";
  } else if (paymentMethod) {
    title = "Thanh toán thành công!";
    message = "Cảm ơn bạn đã mua hàng.";
  }

  // Cập nhật trạng thái đơn hàng nếu là VNPay thành công
  useEffect(() => {
      const updateOrderStatus = async () => {
        if (vnp_ResponseCode === "00" && orderId) {
          try {
            const orderRef = doc(db, "orders", orderId);
            await updateDoc(orderRef, {
              status: "Đang xử lý", // Đã thanh toán xong
              paymentMethod: "VNPAY",
              isPaid: true,
              paidAt: new Date(),
            });
            console.log("Updated order status for VNPay success");
          } catch (error) {
            console.error("Error updating order status:", error);
          }
        }
      };
  
      updateOrderStatus();
  }, [vnp_ResponseCode, orderId]);

  return (
    <>
      <SEO
        title={title}
        description="Kết quả thanh toán tại FreshFood."
      />
      <div className="page-container flex items-center justify-center text-center">
        <div className="bg-white dark:bg-gray-800 p-10 rounded-lg shadow-lg max-w-lg w-full animate-fade-in">
          <Icon
            className={`${iconColor} mx-auto mb-4`}
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
