import React from "react";
import { useState, useEffect } from "react";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "../../firebase/config";
import Spinner from "../../components/common/Spinner";
import { formatCurrency } from "../../utils/formatCurrency";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { AlertTriangle } from "lucide-react";
import "../../styles/admin.css";

const AdminDashboard = () => {
  const [period, setPeriod] = useState("today"); // today, last7days, thisMonth
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    newCustomers: 0,
    avgOrderValue: 0,
  });
  const [salesChartData, setSalesChartData] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const getStartDate = (p) => {
    const now = new Date();
    if (p === "today") {
      return new Date(now.setHours(0, 0, 0, 0));
    }
    if (p === "last7days") {
      const date = new Date();
      date.setDate(date.getDate() - 7);
      date.setHours(0, 0, 0, 0);
      return date;
    }
    if (p === "thisMonth") {
      return new Date(now.getFullYear(), now.getMonth(), 1);
    }
    return new Date();
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const startDate = getStartDate(period);

      const ordersQuery = query(
        collection(db, "orders"),
        where("createdAt", ">=", startDate),
        orderBy("createdAt", "desc")
      );
      const ordersSnapshot = await getDocs(ordersQuery);
      const ordersData = ordersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const customersQuery = query(
        collection(db, "users"),
        where("createdAt", ">=", startDate)
      );
      const customersSnapshot = await getDocs(customersQuery);

      const lowStockQuery = query(
        collection(db, "products"),
        where("stock", "<", 10),
        orderBy("stock", "asc")
      );
      const lowStockSnapshot = await getDocs(lowStockQuery);
      setLowStockProducts(
        lowStockSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );

      const completedOrders = ordersData.filter(
        (o) => o.status === "Hoàn thành"
      );
      const totalRevenue = completedOrders.reduce(
        (sum, order) => sum + order.totalAmount,
        0
      );
      const totalCompletedOrders = completedOrders.length;

      setStats({
        totalRevenue: totalRevenue,
        totalOrders: ordersData.length,
        newCustomers: customersSnapshot.size,
        avgOrderValue:
          totalCompletedOrders > 0 ? totalRevenue / totalCompletedOrders : 0,
      });

      const processChartData = () => {
        if (period === "today") {
          const hourlyData = Array.from({ length: 24 }, (_, i) => ({
            name: `${i}:00`,
            DoanhThu: 0,
          }));
          completedOrders.forEach((order) => {
            const hour = order.createdAt.toDate().getHours();
            hourlyData[hour].DoanhThu += order.totalAmount;
          });
          return hourlyData;
        } else {
          const dailyData = {};
          completedOrders.forEach((order) => {
            const day = order.createdAt.toDate().toLocaleDateString("vi-VN", {
              day: "2-digit",
              month: "2-digit",
            });
            if (!dailyData[day]) dailyData[day] = 0;
            dailyData[day] += order.totalAmount;
          });
          return Object.entries(dailyData)
            .map(([name, DoanhThu]) => ({ name, DoanhThu }))
            .reverse();
        }
      };

      setSalesChartData(processChartData());
      setRecentOrders(ordersData.slice(0, 5));
      setLoading(false);
    };

    fetchData();
  }, [period]);

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title !mb-0">Dashboard</h1>
        <div className="flex space-x-2 bg-gray-200 dark:bg-gray-700 p-1 rounded-lg">
          <button
            onClick={() => setPeriod("today")}
            className={`px-3 py-1 rounded-md text-sm font-semibold ${
              period === "today"
                ? "bg-white text-gray-800 dark:bg-gray-900 dark:text-white"
                : "text-gray-600 dark:text-gray-400"
            }`}
          >
            Hôm nay
          </button>
          <button
            onClick={() => setPeriod("last7days")}
            className={`px-3 py-1 rounded-md text-sm font-semibold ${
              period === "last7days"
                ? "bg-white text-gray-800 dark:bg-gray-900 dark:text-white"
                : "text-gray-600 dark:text-gray-400"
            }`}
          >
            7 ngày qua
          </button>
          <button
            onClick={() => setPeriod("thisMonth")}
            className={`px-3 py-1 rounded-md text-sm font-semibold ${
              period === "thisMonth"
                ? "bg-white text-gray-800 dark:bg-gray-900 dark:text-white"
                : "text-gray-600 dark:text-gray-400"
            }`}
          >
            Tháng này
          </button>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-stat-card">
          <h3 className="dashboard-stat-title">Tổng doanh thu</h3>
          <p className="dashboard-stat-value text-green-600 dark:text-green-400">
            {formatCurrency(stats.totalRevenue)}
          </p>
        </div>
        <div className="dashboard-stat-card">
          <h3 className="dashboard-stat-title">Giá trị ĐH trung bình</h3>
          <p className="dashboard-stat-value">
            {formatCurrency(stats.avgOrderValue)}
          </p>
        </div>
        <div className="dashboard-stat-card">
          <h3 className="dashboard-stat-title">Tổng đơn hàng</h3>
          <p className="dashboard-stat-value">{stats.totalOrders}</p>
        </div>
        <div className="dashboard-stat-card">
          <h3 className="dashboard-stat-title">Khách hàng mới</h3>
          <p className="dashboard-stat-value">{stats.newCustomers}</p>
        </div>
      </div>

      <div className="dashboard-main-grid">
        <div className="dashboard-chart-container">
          <h3 className="text-xl font-bold mb-4">Phân tích doanh thu</h3>
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={salesChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => `${value / 1000}k`} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="DoanhThu"
                  stroke="#10B981"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="dashboard-recent-orders">
          <h3 className="text-xl font-bold mb-4">Đơn hàng gần đây</h3>
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex justify-between items-center text-sm"
              >
                <div>
                  <p className="font-semibold">{order.shippingInfo.name}</p>
                  <p className="text-gray-500 dark:text-gray-400">
                    {order.items.length} mặt hàng
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">
                    {formatCurrency(order.totalAmount)}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400">
                    {order.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="page-section mt-6">
        <h3 className="text-xl font-bold mb-4 flex items-center text-yellow-600">
          <AlertTriangle size={20} className="mr-2" /> Cảnh báo Tồn kho thấp
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="p-2 text-left">Sản phẩm</th>
                <th className="p-2 text-left">Còn lại</th>
              </tr>
            </thead>
            <tbody>
              {lowStockProducts.map((product) => (
                <tr key={product.id}>
                  <td className="p-2">{product.name}</td>
                  <td className="p-2 font-bold text-red-500">
                    {product.stock}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
