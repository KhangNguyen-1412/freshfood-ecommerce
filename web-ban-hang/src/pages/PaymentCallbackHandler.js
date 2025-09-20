import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  doc,
  updateDoc,
  runTransaction,
  getDoc,
  increment,
} from "firebase/firestore";
import { db } from "../firebase/config";
import Spinner from "../components/common/Spinner";
import { toast } from "react-toastify";

const PaymentCallbackHandler = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState("Đang xử lý thanh toán...");

  useEffect(() => {
    const processPayment = async () => {
      const orderId = searchParams.get("orderId");
      const status = searchParams.get("status");
      const reason = searchParams.get("reason");
      const paymentMethod = searchParams.get("paymentMethod");

      if (!orderId) {
        setMessage("Lỗi: Không tìm thấy mã đơn hàng.");
        navigate("/");
        return;
      }

      if (status === "success") {
        setMessage("Thanh toán thành công! Đang cập nhật đơn hàng...");
        try {
          const orderRef = doc(db, "orders", orderId);

          await runTransaction(db, async (transaction) => {
            const orderDoc = await transaction.get(orderRef);
            if (
              !orderDoc.exists() ||
              orderDoc.data().status !== "Chờ thanh toán"
            ) {
              // Nếu đơn hàng không tồn tại hoặc đã được xử lý, không làm gì cả
              throw new Error("Đơn hàng không hợp lệ hoặc đã được xử lý.");
            }

            // Cập nhật trạng thái đơn hàng
            transaction.update(orderRef, { status: "Đang xử lý" });

            // Trừ kho và cập nhật số lượng đã bán
            for (const item of orderDoc.data().items) {
              const productRef = doc(db, "products", item.id);
              const inventoryRef = doc(
                db,
                "products",
                item.id,
                "inventory",
                orderDoc.data().branchId
              );
              transaction.update(inventoryRef, {
                stock: increment(-item.quantity),
              });
              transaction.update(productRef, {
                purchaseCount: increment(item.quantity),
              });
            }
          });

          // Chuyển hướng đến trang thành công
          navigate(
            `/payment-success?orderId=${orderId}&paymentMethod=${paymentMethod}`
          );
        } catch (error) {
          toast.error(`Lỗi cập nhật đơn hàng: ${error.message}`);
          setMessage(
            `Đã xảy ra lỗi khi cập nhật đơn hàng của bạn. Vui lòng liên hệ hỗ trợ.`
          );
          // Có thể chuyển hướng đến trang lỗi hoặc trang profile
          navigate(`/order/${orderId}`);
        }
      } else {
        // Thanh toán thất bại
        navigate(`/payment-cancel?reason=${reason || "Giao dịch thất bại"}`);
      }
    };

    processPayment();
  }, [searchParams, navigate]);

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <Spinner size="lg" />
      <p className="mt-4 text-lg">{message}</p>
    </div>
  );
};

export default PaymentCallbackHandler;
