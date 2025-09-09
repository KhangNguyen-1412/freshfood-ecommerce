import React, { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase/config";
import Spinner from "../../components/common/Spinner";
import "../../styles/admin.css";

const StaffDashboard = () => {
  const [stats, setStats] = useState({ newOrders: 0, lowStockCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const ordersQuery = query(
      collection(db, "orders"),
      where("createdAt", ">=", today)
    );
    const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
      setStats((prev) => ({ ...prev, newOrders: snapshot.size }));
    });

    const lowStockQuery = query(
      collection(db, "products"),
      where("stock", "<", 10)
    );
    const unsubscribeLowStock = onSnapshot(lowStockQuery, (snapshot) => {
      setStats((prev) => ({ ...prev, lowStockCount: snapshot.size }));
      setLoading(false);
    });

    return () => {
      unsubscribeOrders();
      unsubscribeLowStock();
    };
  }, []);

  if (loading) return <Spinner />;

  return (
    <div>
      <h1 className="admin-page-title">Chào mừng, Nhân viên!</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="dashboard-stat-card">
          <h3 className="dashboard-stat-title">Đơn hàng mới hôm nay</h3>
          <p className="dashboard-stat-value text-blue-500">
            {stats.newOrders}
          </p>
        </div>
        <div className="dashboard-stat-card">
          <h3 className="dashboard-stat-title">Sản phẩm sắp hết hàng</h3>
          <p className="dashboard-stat-value text-red-500">
            {stats.lowStockCount}
          </p>
        </div>
      </div>
      <div className="page-section mt-8">
        <h3 className="text-xl font-bold">Truy cập nhanh</h3>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Sử dụng thanh điều hướng bên trái để truy cập các chức năng.
        </p>
      </div>
    </div>
  );
};

export default StaffDashboard;
