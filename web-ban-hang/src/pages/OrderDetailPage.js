import React, { useState, useEffect } from "react";
import { useParams, useLocation, Link, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAppContext } from "../context/AppContext";
import { formatCurrency } from "../utils/formatCurrency";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import Spinner from "../components/common/Spinner";
import "../styles/pages.css";
import SEO from "../components/common/SEO";

const OrderDetailPage = () => {
  const { orderId } = useParams();
  const { reorderItems } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!order);

  useEffect(() => {
    if (!order && orderId) {
      const fetchOrder = async () => {
        const docRef = doc(db, "orders", orderId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setOrder({ id: docSnap.id, ...docSnap.data() });
        }
        setLoading(false);
      };
      fetchOrder();
    }
  }, [order, orderId]);

  const handleReorder = () => {
    reorderItems(order.items);
    navigate("/cart"); // Chuyển hướng đến giỏ hàng sau khi thêm
  };

  if (loading) return <Spinner />;

  if (!order) {
    return (
      <div className="page-container text-center py-20">
        <h2 className="text-2xl font-bold">Không tìm thấy đơn hàng</h2>
        <Link to="/profile" className="mt-6 text-blue-500 hover:underline">
          Quay lại trang tài khoản
        </Link>
      </div>
    );
  }

  return (
    <>
      <SEO title={`Chi tiết đơn hàng #${order.id.substring(0, 8)}`} />
      <div className="page-container animate-fade-in">
        <Link
          to="/profile" // Đảm bảo link này trỏ về trang profile chính
          className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white mb-6"
        >
          <ArrowLeft size={20} className="mr-2" /> Quay lại Lịch sử đơn hàng
        </Link>
        <div className="page-section">
          <div className="flex justify-between items-start border-b dark:border-gray-700 pb-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold">Chi tiết đơn hàng</h1>
              <p className="font-mono text-sm text-gray-500 dark:text-gray-400">
                #{order.id}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Ngày đặt:{" "}
                {order.createdAt
                  ? new Date(order.createdAt.toDate()).toLocaleString("vi-VN")
                  : "N/A"}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Trạng thái:{" "}
                <span className="font-semibold">{order.status}</span>
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-4">
            <div>
              <h2 className="text-lg font-bold mb-2">Thông tin giao hàng</h2>
              <p>
                <strong>Người nhận:</strong> {order.shippingInfo.name}
              </p>
              <p>
                <strong>Số điện thoại:</strong> {order.shippingInfo.phone}
              </p>
              <p>
                <strong>Địa chỉ:</strong> {order.shippingInfo.address}
              </p>
            </div>
            <div>
              <h2 className="text-lg font-bold mb-2">Thông tin thanh toán</h2>
              <p>
                <strong>Phương thức:</strong> {order.paymentMethod}
              </p>
              <p>
                <strong>Tạm tính:</strong> {formatCurrency(order.subtotal)}
              </p>
              <p className="text-red-500">
                <strong>Giảm giá:</strong> - {formatCurrency(order.discount)}
              </p>
              <p className="font-bold text-xl text-green-600 dark:text-green-400">
                Tổng cộng: {formatCurrency(order.totalAmount)}
              </p>
            </div>
          </div>
          <div>
            <h2 className="text-lg font-bold mb-2 border-t dark:border-gray-700 pt-4">
              Các sản phẩm đã đặt
            </h2>
            <div className="space-y-2">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-2 border-b dark:border-gray-700 last:border-0"
                >
                  <div className="flex items-center">
                    <img
                      src={
                        item.imageUrls?.[0] || "https://placehold.co/100x100"
                      }
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-md mr-4"
                    />
                    <div>
                      <h3 className="font-semibold">{item.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Số lượng: {item.quantity}
                      </p>
                    </div>
                  </div>
                  <p className="font-semibold">
                    {formatCurrency(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
          </div>
          {(order.status === "Đã giao" || order.status === "Hoàn thành") && (
            <div className="mt-8 text-center">
              <button
                onClick={handleReorder}
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                <ShoppingCart className="mr-2 -ml-1 h-5 w-5" />
                Mua lại đơn hàng này
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default OrderDetailPage;
