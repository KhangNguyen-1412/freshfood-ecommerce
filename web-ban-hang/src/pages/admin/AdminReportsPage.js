import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { db } from "../../firebase/config";
import { toast } from "react-toastify";
import Spinner from "../../components/common/Spinner";
import { formatCurrency } from "../../utils/formatCurrency";
import {
  LineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Download } from "lucide-react";
import "../../styles/admin.css";

const AdminReportsPage = () => {
  const [reportType, setReportType] = useState("monthly");
  const [chartType, setChartType] = useState("bar");
  const [orders, setOrders] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("all");
  const chartRef = useRef(null);

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const ordersQuery = query(
          collection(db, "orders"),
          where("status", "==", "Hoàn thành")
        );
        const ordersSnapshot = await getDocs(ordersQuery);
        setOrders(
          ordersSnapshot.docs.map((doc) => ({
            ...doc.data(),
            createdAt: doc.data().createdAt.toDate(),
          }))
        );

        const purchasesQuery = query(
          collection(db, "purchases"),
          orderBy("createdAt", "desc")
        );
        const purchasesSnapshot = await getDocs(purchasesQuery);
        setPurchases(
          purchasesSnapshot.docs.map((doc) => ({
            ...doc.data(),
            createdAt: doc.data().createdAt.toDate(),
          }))
        );
      } catch (error) {
        toast.error(
          "Không thể tải dữ liệu báo cáo, vui lòng kiểm tra console."
        );
      }

      const unsubBranches = onSnapshot(
        collection(db, "branches"),
        (snapshot) => {
          setBranches(
            snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
          );
        }
      );

      setLoading(false);

      return () => unsubBranches();
    };
    fetchData();
  }, []);

  const generateReport = useCallback(() => {
    if (reportType === "topProducts") {
      const productSales = {};
      orders.forEach((order) => {
        // Lọc đơn hàng theo chi nhánh nếu cần
        if (selectedBranch !== "all" && order.branchId !== selectedBranch) {
          return;
        }
        order.items.forEach((item) => {
          productSales[item.id] = {
            name: item.name,
            quantity: (productSales[item.id]?.quantity || 0) + item.quantity,
          };
        });
      });
      return {
        topProducts: Object.values(productSales)
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 10),
      };
    }

    let filteredOrders = [];
    let filteredPurchases = [];
    let chartData = [];

    if (reportType === "monthly") {
      filteredOrders = orders.filter(
        (o) =>
          (selectedBranch === "all" || o.branchId === selectedBranch) &&
          o.createdAt.getFullYear() === selectedYear &&
          o.createdAt.getMonth() === selectedMonth
      );
      filteredPurchases = purchases.filter(
        (p) =>
          (selectedBranch === "all" || p.branchId === selectedBranch) &&
          p.createdAt.getFullYear() === selectedYear &&
          p.createdAt.getMonth() === selectedMonth
      );

      const daysInMonth = new Date(
        selectedYear,
        selectedMonth + 1,
        0
      ).getDate();
      chartData = Array.from({ length: daysInMonth }, (_, i) => ({
        name: `Ngày ${i + 1}`,
        DoanhThu: 0,
        ChiPhi: 0,
        LoiNhuan: 0,
      }));

      filteredOrders.forEach((o) => {
        chartData[o.createdAt.getDate() - 1].DoanhThu += o.totalAmount;
      });
      filteredPurchases.forEach((p) => {
        chartData[p.createdAt.getDate() - 1].ChiPhi += p.totalCost;
      });
      chartData.forEach((d) => (d.LoiNhuan = d.DoanhThu - d.ChiPhi));
    } else if (reportType === "yearly") {
      filteredOrders = orders.filter(
        (o) =>
          (selectedBranch === "all" || o.branchId === selectedBranch) &&
          o.createdAt.getFullYear() === selectedYear
      );
      filteredPurchases = purchases.filter(
        (p) =>
          (selectedBranch === "all" || p.branchId === selectedBranch) &&
          p.createdAt.getFullYear() === selectedYear
      );

      chartData = Array.from({ length: 12 }, (_, i) => ({
        name: `Tháng ${i + 1}`,
        DoanhThu: 0,
        ChiPhi: 0,
        LoiNhuan: 0,
      }));

      filteredOrders.forEach((o) => {
        chartData[o.createdAt.getMonth()].DoanhThu += o.totalAmount;
      });
      filteredPurchases.forEach((p) => {
        chartData[p.createdAt.getMonth()].ChiPhi += p.totalCost;
      });
      chartData.forEach((d) => (d.LoiNhuan = d.DoanhThu - d.ChiPhi));
    }

    const totalRevenue = filteredOrders.reduce(
      (sum, o) => sum + o.totalAmount,
      0
    );
    const totalCost = filteredPurchases.reduce(
      (sum, p) => sum + p.totalCost,
      0
    );

    return {
      totalRevenue,
      totalOrders: filteredOrders.length,
      totalCost,
      grossProfit: totalRevenue - totalCost,
      chartData,
    };
  }, [
    orders,
    purchases,
    reportType,
    selectedYear,
    selectedMonth,
    selectedBranch,
  ]);

  const reportData = generateReport();

  const handleExportPDF = async () => {
    const doc = new jsPDF();
    const reportTitle = `Bao Cao ${
      reportType === "monthly"
        ? `Thang ${selectedMonth + 1}/${selectedYear}`
        : reportType === "yearly"
        ? `Nam ${selectedYear}`
        : "Top San Pham"
    }`;

    // Add title
    doc.setFontSize(18);
    doc.text(reportTitle, 14, 22);

    if (reportType !== "topProducts") {
      // Add summary
      doc.setFontSize(11);
      doc.text(
        `Tong doanh thu: ${formatCurrency(reportData.totalRevenue)}`,
        14,
        32
      );
      doc.text(
        `Chi phi nhap kho: ${formatCurrency(reportData.totalCost)}`,
        14,
        38
      );
      doc.text(
        `Loi nhuan gop: ${formatCurrency(reportData.grossProfit)}`,
        14,
        44
      );
      doc.text(`Tong don hoan thanh: ${reportData.totalOrders}`, 14, 50);

      // Add chart image
      if (chartRef.current) {
        const html2canvas = (await import("html2canvas")).default;
        const canvas = await html2canvas(chartRef.current);
        const imgData = canvas.toDataURL("image/png");
        doc.addImage(imgData, "PNG", 14, 60, 180, 100);
      }

      // Add table data
      doc.autoTable({
        startY: 170,
        head: [["Thoi gian", "Doanh Thu", "Chi Phi", "Loi Nhuan"]],
        body: reportData.chartData.map((d) => [
          d.name,
          formatCurrency(d.DoanhThu),
          formatCurrency(d.ChiPhi),
          formatCurrency(d.LoiNhuan),
        ]),
        headStyles: { fillColor: [22, 163, 74] },
      });
    } else {
      // Add top products table
      doc.autoTable({
        startY: 32,
        head: [["#", "San Pham", "So Luong Da Ban"]],
        body: reportData.topProducts.map((p, index) => [
          index + 1,
          p.name,
          p.quantity,
        ]),
        headStyles: { fillColor: [22, 163, 74] },
      });
    }

    doc.save(`${reportTitle}.pdf`);
  };

  if (loading) return <Spinner />;

  const RevenueChart = ({ data, type }) => (
    <ResponsiveContainer width="100%" height={400}>
      {type === "bar" ? (
        <RechartsBarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis
            tickFormatter={(value) =>
              new Intl.NumberFormat("vi-VN").format(value)
            }
          />
          <Tooltip formatter={(value) => formatCurrency(value)} />
          <Legend />
          <Bar dataKey="DoanhThu" fill="#10B981" />
          <Bar dataKey="ChiPhi" fill="#EF4444" />
          <Bar dataKey="LoiNhuan" fill="#3B82F6" />
        </RechartsBarChart>
      ) : (
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis
            tickFormatter={(value) =>
              new Intl.NumberFormat("vi-VN").format(value)
            }
          />
          <Tooltip formatter={(value) => formatCurrency(value)} />
          <Legend />
          <Line
            type="monotone"
            dataKey="DoanhThu"
            stroke="#10B981"
            strokeWidth={2}
          />
          <Line
            type="monotone"
            dataKey="ChiPhi"
            stroke="#EF4444"
            strokeWidth={2}
          />
          <Line
            type="monotone"
            dataKey="LoiNhuan"
            stroke="#3B82F6"
            strokeWidth={2}
          />
        </LineChart>
      )}
    </ResponsiveContainer>
  );

  return (
    <div>
      <h1 className="admin-page-title">Báo cáo & Thống kê</h1>
      <div className="reports-filter-bar">
        <div className="flex items-center gap-2">
          <label>Loại báo cáo:</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="monthly">Theo tháng</option>
            <option value="yearly">Theo năm</option>
            <option value="topProducts">Sản phẩm bán chạy</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label>Chi nhánh:</label>
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="all">Tất cả chi nhánh</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.branchName}
              </option>
            ))}
          </select>
        </div>
        {reportType !== "topProducts" && (
          <>
            <div className="flex items-center gap-2">
              <label>Năm:</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
              >
                {[...Array(5)].map((_, i) => (
                  <option key={currentYear - i} value={currentYear - i}>
                    {currentYear - i}
                  </option>
                ))}
              </select>
            </div>
            {reportType === "monthly" && (
              <div className="flex items-center gap-2">
                <label>Tháng:</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                >
                  {[...Array(12)].map((_, i) => (
                    <option key={i} value={i}>
                      Tháng {i + 1}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </>
        )}
      </div>

      {reportType !== "topProducts" ? (
        <>
          <div className="dashboard-grid">
            {/* Summary Cards */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-500">
                Tổng doanh thu
              </h3>
              <p className="text-3xl font-bold mt-2 text-green-600">
                {formatCurrency(reportData.totalRevenue)}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-500">
                Chi phí nhập kho
              </h3>
              <p className="text-3xl font-bold mt-2 text-red-500">
                {formatCurrency(reportData.totalCost)}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-500">
                Lợi nhuận gộp
              </h3>
              <p className="text-3xl font-bold mt-2 text-blue-500">
                {formatCurrency(reportData.grossProfit)}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-500">
                Tổng đơn hoàn thành
              </h3>
              <p className="text-3xl font-bold mt-2">
                {reportData.totalOrders}
              </p>
            </div>
          </div>
          <div className="dashboard-chart-container mt-6" ref={chartRef}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Biểu đồ tổng quan</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setChartType("bar")}
                  className={`px-3 py-1 rounded ${
                    chartType === "bar"
                      ? "bg-green-600 text-white"
                      : "bg-gray-200 dark:bg-gray-700"
                  }`}
                >
                  Cột
                </button>
                <button
                  onClick={() => setChartType("line")}
                  className={`px-3 py-1 rounded ${
                    chartType === "line"
                      ? "bg-green-600 text-white"
                      : "bg-gray-200 dark:bg-gray-700"
                  }`}
                >
                  Đường
                </button>
              </div>
            </div>
            <RevenueChart data={reportData.chartData} type={chartType} />
          </div>
        </>
      ) : (
        <div className="admin-table-container">
          <h2 className="text-xl font-bold mb-4">
            Top 10 sản phẩm bán chạy nhất (tất cả thời gian)
          </h2>
          <table className="w-full">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="p-2 text-left">#</th>
                <th className="p-2 text-left">Sản phẩm</th>
                <th className="p-2 text-left">Số lượng đã bán</th>
              </tr>
            </thead>
            <tbody>
              {reportData.topProducts.map((product, index) => (
                <tr
                  key={product.name}
                  className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="p-2 font-bold">{index + 1}</td>
                  <td className="p-2">{product.name}</td>
                  <td className="p-2">{product.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminReportsPage;
