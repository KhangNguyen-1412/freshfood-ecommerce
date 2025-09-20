import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import { toast } from "react-toastify";
import { formatCurrency } from "../../utils/formatCurrency";

const OrdersTab = ({ user }) => {
  const { reorderItems } = useAppContext();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "orders"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  const handleCancelOrder = async (orderId) => {
    if (window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này?")) {
      await updateDoc(doc(db, "orders", orderId), { status: "Đã hủy" });
      toast.success("Đã hủy đơn hàng thành công.");
    }
  };

  const handlePayNow = async (order) => {
    if (!order) return;

    try {
      const apiUrl = process.env.REACT_APP_API_URL;
      if (!apiUrl) {
        toast.error("API URL chưa được cấu hình.");
        return;
      }

      const paymentData = {
        orderId: order.id,
        amount: order.totalAmount,
        orderInfo: `Thanh toan cho don hang #${order.id.substring(0, 8)}`,
      };

      const res = await fetch(`${apiUrl}/create_vnpay_payment_url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentData),
      });

      const { paymentUrl, error } = await res.json();

      if (error) throw new Error(error);

      window.location.href = paymentUrl;
    } catch (error) {
      toast.error(`Tạo thanh toán thất bại: ${error.message}`);
    }
  };

  const handleReorder = (orderItems) => {
    reorderItems(orderItems);
    // Có thể thêm điều hướng đến trang giỏ hàng nếu muốn
    // navigate('/cart');
  };
  const getStatusClass = (status) =>
    ({
      "Đang xử lý": "bg-blue-100 text-blue-800",
      "Đang giao hàng": "bg-blue-100 text-blue-800",
      "Đã giao": "bg-green-100 text-green-800",
      "Hoàn thành": "bg-green-100 text-green-800", // Giữ lại để tương thích
      "Đã hủy": "bg-red-100 text-red-800",
      "Chờ thanh toán": "bg-yellow-100 text-yellow-800",
      "Đã thanh toán": "bg-purple-100 text-purple-800",
    }[status] || "bg-gray-100 text-gray-800");

  return (
    <div className="page-section">
      <h2 className="text-xl font-bold mb-4">Lịch sử đơn hàng</h2>
      <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-4">
        {/* Thêm pr-2 (padding-right) để thanh cuộn không che mất nội dung */}
        <div className="space-y-4">
          {orders.length > 0 ? (
            orders.map((order) => (
              <div
                key={order.id}
                className="border dark:border-gray-700 p-4 rounded-lg shadow-sm"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold">
                      Mã đơn hàng: #{order.id.substring(0, 8)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Ngày đặt:{" "}
                      {order.createdAt
                        ? new Date(order.createdAt.toDate()).toLocaleDateString(
                            "vi-VN"
                          )
                        : "N/A"}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(
                      order.status
                    )}`}
                  >
                    {order.status}
                  </span>
                </div>
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {order.items.length} sản phẩm
                </div>
                <div className="flex justify-between items-end mt-2">
                  <p className="font-bold">
                    Tổng tiền: {formatCurrency(order.totalAmount)}
                  </p>
                  <div className="flex items-center space-x-4">
                    {order.status === "Chờ thanh toán" && (
                      <button
                        onClick={() => handlePayNow(order)}
                        className="text-sm text-green-600 hover:underline font-semibold"
                      >
                        Thanh toán ngay
                      </button>
                    )}
                    {(order.status === "Đang xử lý" ||
                      order.status === "Chờ thanh toán") && (
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        className="text-sm text-red-500 hover:underline"
                      >
                        Hủy đơn
                      </button>
                    )}
                    {(order.status === "Đã giao" ||
                      order.status === "Hoàn thành") &&
                      !order.reviewed && (
                        <Link
                          to={`/profile/review/${order.id}`}
                          state={{ order: order }}
                          className="text-sm text-green-600 hover:underline font-semibold"
                        >
                          Đánh giá
                        </Link>
                      )}
                    {(order.status === "Đã giao" ||
                      order.status === "Hoàn thành") && (
                      <button
                        onClick={() => handleReorder(order.items)}
                        className="text-sm text-purple-600 hover:underline font-semibold"
                      >
                        Mua lại
                      </button>
                    )}
                    <Link
                      to={`/order/${order.id}`}
                      state={{ order: order }}
                      className="text-sm text-blue-500 hover:underline font-semibold"
                    >
                      Xem chi tiết
                    </Link>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p>Bạn chưa có đơn hàng nào.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrdersTab;
