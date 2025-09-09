import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  writeBatch,
  increment,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import { toast } from "react-toastify";
import Spinner from "../../components/common/Spinner";
import { formatCurrency } from "../../utils/formatCurrency";
import "../../styles/admin.css";

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortOption, setSortOption] = useState("date-desc");
  const [displayedOrders, setDisplayedOrders] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let sortedOrders = [...orders];
    switch (sortOption) {
      case "date-asc":
        sortedOrders.sort(
          (a, b) => a.createdAt.toDate() - b.createdAt.toDate()
        );
        break;
      case "customer-asc":
        sortedOrders.sort((a, b) =>
          a.shippingInfo.name.localeCompare(b.shippingInfo.name)
        );
        break;
      case "customer-desc":
        sortedOrders.sort((a, b) =>
          b.shippingInfo.name.localeCompare(a.shippingInfo.name)
        );
        break;
      case "date-desc":
      default:
        break;
    }
    setDisplayedOrders(sortedOrders);
  }, [sortOption, orders]);

  const handleStatusChange = async (orderId, newStatus, orderData) => {
    const orderRef = doc(db, "orders", orderId);
    try {
      await updateDoc(orderRef, { status: newStatus });
      toast.success("Cập nhật trạng thái thành công!");

      if (newStatus === "Hoàn thành" && orderData) {
        const pointsEarned = Math.floor(orderData.totalAmount / 1000);
        if (pointsEarned > 0 && orderData.userId) {
          const userRef = doc(db, "users", orderData.userId);
          const historyRef = doc(collection(userRef, "pointsHistory"));
          const batch = writeBatch(db);
          batch.update(userRef, { loyaltyPoints: increment(pointsEarned) });
          batch.set(historyRef, {
            pointsChanged: pointsEarned,
            reason: `Mua hàng từ đơn #${orderId.substring(0, 8)}`,
            orderId: orderId,
            createdAt: serverTimestamp(),
          });
          await batch.commit();
          toast.info(`Đã cộng ${pointsEarned} điểm cho khách hàng!`);
        }
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái:", error);
      toast.error("Đã có lỗi xảy ra.");
    }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Quản lý Đơn hàng</h1>
        <div className="flex items-center gap-2">
          <label htmlFor="order-sort" className="text-sm font-medium">
            Sắp xếp theo:
          </label>
          <select
            id="order-sort"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="p-2 border rounded-md text-sm dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="date-desc">Mới nhất</option>
            <option value="date-asc">Cũ nhất</option>
            <option value="customer-asc">Tên khách hàng A-Z</option>
            <option value="customer-desc">Tên khách hàng Z-A</option>
          </select>
        </div>
      </div>
      <div className="admin-table-container">
        <table className="w-full">
          <thead>
            <tr className="border-b dark:border-gray-700">
              <th className="p-2 text-left">Mã ĐH</th>
              <th className="p-2 text-left">Khách hàng</th>
              <th className="p-2 text-left">Tổng tiền</th>
              <th className="p-2 text-left">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {displayedOrders.map((o) => (
              <tr
                key={o.id}
                className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td className="p-2 font-mono text-sm">
                  {o.id.substring(0, 8)}
                </td>
                <td className="p-2">{o.shippingInfo?.name || "N/A"}</td>
                <td className="p-2">{formatCurrency(o.totalAmount)}</td>
                <td className="p-2">
                  <select
                    value={o.status}
                    onChange={(e) =>
                      handleStatusChange(o.id, e.target.value, o)
                    }
                    className="p-1 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option>Đang xử lý</option>
                    <option>Đang giao hàng</option>
                    <option>Hoàn thành</option>
                    <option>Đã hủy</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminOrders;
