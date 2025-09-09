import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import { toast } from "react-toastify";
import { useAppContext } from "../../context/AppContext";
import Spinner from "../../components/common/Spinner";
import { formatCurrency } from "../../utils/formatCurrency";
import { ArrowLeft } from "lucide-react";
import "../../styles/admin.css";

const AdminCustomerDetails = ({ customer }) => {
  const { setPage } = useAppContext();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!customer) return;

    const q = query(
      collection(db, "orders"),
      where("userId", "==", customer.id),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setOrders(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      },
      (error) => {
        console.error("Lỗi khi tải đơn hàng của khách:", error);
        toast.error(
          "Lỗi khi tải đơn hàng. Kiểm tra console (F12) để xem chi tiết."
        );
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [customer]);

  if (loading) return <Spinner />;

  return (
    <div>
      <button
        onClick={() => setPage("admin-customers")}
        className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white mb-6"
      >
        <ArrowLeft size={20} className="mr-2" /> Quay lại danh sách
      </button>
      <h1 className="admin-page-title !mb-2">Lịch sử mua hàng</h1>
      <p className="customer-detail-header">
        Khách hàng:{" "}
        <span className="font-semibold">{customer.displayName}</span> (
        {customer.email})
      </p>
      <div className="space-y-4">
        {orders.length > 0 ? (
          orders.map((order) => (
            <div key={order.id} className="customer-order-card">
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
                <p className="font-bold text-lg">
                  {formatCurrency(order.totalAmount)}
                </p>
              </div>
              <div className="mt-2 border-t dark:border-gray-700 pt-2">
                <h4 className="font-semibold text-sm mb-1">Các sản phẩm:</h4>
                {order.items.map((item) => (
                  <p
                    key={item.id}
                    className="text-sm text-gray-600 dark:text-gray-400"
                  >
                    - {item.name} x {item.quantity}
                  </p>
                ))}
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 py-8">
            Khách hàng này chưa có đơn hàng nào.
          </p>
        )}
      </div>
    </div>
  );
};

export default AdminCustomerDetails;
