import React, { useState, useEffect, useRef, useMemo } from "react";
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
import { useReactToPrint } from "react-to-print";
import * as ExcelJS from "exceljs";
import { toast } from "react-toastify";
import Spinner from "../../components/common/Spinner";
import { useAppContext } from "../../context/AppContext";
import { formatCurrency } from "../../utils/formatCurrency";
import { InvoiceTemplate } from "../../components/order/InvoiceTemplate";
import {
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  X,
  Search,
  Printer,
  Download,
} from "lucide-react";
import "../../styles/admin.css";

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortOption, setSortOption] = useState("date-desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [returnQuantities, setReturnQuantities] = useState({});
  const [displayedOrders, setDisplayedOrders] = useState([]);
  const { createNotification } = useAppContext();
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const invoiceRef = useRef();

  const handlePrint = useReactToPrint({
    content: () => invoiceRef.current,
    documentTitle: `HoaDon_${selectedOrder?.id.substring(0, 8) || ""}`,
    onAfterPrint: () => toast.info("Đã hoàn tất quá trình in hóa đơn."),
  });

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setOrders(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      },
      (error) => {
        console.error("Lỗi khi tải đơn hàng:", error);
        toast.error("Không thể tải danh sách đơn hàng.");
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const filteredAndSortedOrders = useMemo(() => {
    let tempOrders = [...orders];

    if (statusFilter !== "all") {
      tempOrders = tempOrders.filter((o) => o.status === statusFilter);
    }

    if (searchTerm.trim() !== "") {
      const lowercasedTerm = searchTerm.toLowerCase();
      tempOrders = tempOrders.filter(
        (o) =>
          o.id?.toLowerCase().includes(lowercasedTerm) ||
          o.shippingInfo?.name?.toLowerCase().includes(lowercasedTerm) ||
          o.shippingInfo?.phone?.includes(lowercasedTerm)
      );
    }

    let sortedOrders = [...tempOrders];
    switch (sortOption) {
      case "date-asc":
        sortedOrders.sort(
          (a, b) => a.createdAt.toDate() - b.createdAt.toDate()
        );
        break;
      case "customer-asc":
        sortedOrders.sort((a, b) => {
          const nameA = a.shippingInfo?.name ?? "";
          const nameB = b.shippingInfo?.name ?? "";
          return nameA.localeCompare(nameB);
        });
        break;
      case "customer-desc":
        sortedOrders.sort((a, b) => {
          const nameA = a.shippingInfo?.name ?? "";
          const nameB = b.shippingInfo?.name ?? "";
          return nameB.localeCompare(nameA);
        });
        break;
      case "date-desc":
      default:
        break;
    }
    return sortedOrders;
  }, [orders, statusFilter, searchTerm, sortOption]);

  useEffect(() => {
    setDisplayedOrders(filteredAndSortedOrders);
    setCurrentPage(1);
  }, [filteredAndSortedOrders]);

  const handleStatusChange = async (orderId, newStatus, orderData) => {
    const orderRef = doc(db, "orders", orderId);
    const batch = writeBatch(db);

    try {
      // 1. Cập nhật trạng thái đơn hàng
      batch.update(orderRef, { status: newStatus });

      const pointsEarned = Math.floor(orderData.totalAmount / 1000);
      const userRef = orderData.userId
        ? doc(db, "users", orderData.userId)
        : null;
      const historyRef = userRef
        ? doc(collection(userRef, "pointsHistory"))
        : null;

      // 2. Nếu trạng thái là "Hoàn thành", thực hiện các tác vụ liên quan
      if (newStatus === "Hoàn thành" && orderData.status !== "Hoàn thành") {
        // 2a. Trừ tồn kho sản phẩm
        if (orderData.items && orderData.branchId) {
          orderData.items.forEach((item) => {
            // item.id là variantId, item.productId là productId
            const inventoryRef = doc(
              db,
              "products",
              item.productId,
              "variants",
              item.id,
              "inventory",
              orderData.branchId
            );
            batch.update(inventoryRef, { stock: increment(-item.quantity) });
          });
        }

        // 2b. Cộng điểm tích lũy cho khách hàng
        if (pointsEarned > 0 && userRef && historyRef) {
          batch.update(userRef, { loyaltyPoints: increment(pointsEarned) }); // Sử dụng increment
          batch.set(historyRef, {
            pointsChanged: pointsEarned,
            reason: `Mua hàng từ đơn #${orderId.substring(0, 8)}`,
            orderId: orderId,
            createdAt: serverTimestamp(),
          });
          toast.info(`Đã cộng ${pointsEarned} điểm cho khách hàng!`);
        }
      } else if (newStatus === "Đã hủy" && orderData.status === "Hoàn thành") {
        // 3. Nếu đơn hàng bị HỦY từ trạng thái HOÀN THÀNH
        if (orderData.items && orderData.branchId) {
          orderData.items.forEach((item) => {
            const inventoryRef = doc(
              db,
              "products",
              item.productId,
              "variants",
              item.id,
              "inventory",
              orderData.branchId
            );
            // Hoàn lại số lượng bằng cách cộng
            batch.update(inventoryRef, { stock: increment(item.quantity) }); // Sử dụng increment
          });
          toast.info("Đã hoàn lại tồn kho cho các sản phẩm trong đơn hàng.");
        }
        // 3b. Trừ điểm tích lũy đã cộng
        if (pointsEarned > 0 && userRef && historyRef) {
          batch.update(userRef, { loyaltyPoints: increment(-pointsEarned) });
          batch.set(historyRef, {
            pointsChanged: -pointsEarned,
            reason: `Hủy đơn hàng #${orderId.substring(0, 8)}`,
            orderId: orderId,
            createdAt: serverTimestamp(),
          });
          toast.info(`Đã trừ ${pointsEarned} điểm của khách hàng.`);
        }
      }

      await batch.commit();
      toast.success("Cập nhật trạng thái thành công!");

      // Tạo thông báo cho người dùng
      await createNotification(orderData.userId, {
        title: `Đơn hàng #${orderId.substring(0, 8)} đã cập nhật`,
        message: `Trạng thái mới: ${newStatus}`,
        link: `/profile`, // Link đến trang lịch sử đơn hàng
      });
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái:", error);
      toast.error("Đã có lỗi xảy ra.");
    }
  };

  const handlePartialRefund = async () => {
    if (!selectedOrder) return;

    const itemsToRefund = Object.entries(returnQuantities)
      .map(([variantId, quantity]) => {
        if (quantity > 0) {
          const originalItem = selectedOrder.items.find(
            (item) => item.id === variantId
          );
          return { ...originalItem, quantity };
        }
        return null;
      })
      .filter(Boolean);

    if (itemsToRefund.length === 0) {
      return toast.warn("Vui lòng chọn số lượng sản phẩm cần hoàn trả.");
    }

    const refundAmount = itemsToRefund.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    if (
      !window.confirm(
        `Bạn có chắc muốn hoàn trả ${
          itemsToRefund.length
        } sản phẩm với tổng số tiền ${formatCurrency(refundAmount)}?`
      )
    ) {
      return;
    }

    const batch = writeBatch(db);
    const orderRef = doc(db, "orders", selectedOrder.id);

    try {
      // 1. Hoàn lại tồn kho
      itemsToRefund.forEach((item) => {
        const inventoryRef = doc(
          db,
          "products",
          item.productId,
          "variants",
          item.id,
          "inventory",
          selectedOrder.branchId
        );
        batch.update(inventoryRef, { stock: increment(item.quantity) });
      });

      // 2. Cập nhật đơn hàng
      const updatedItems = selectedOrder.items.map((item) => {
        const returnQty = returnQuantities[item.id] || 0;
        return { ...item, quantity: item.quantity - returnQty };
      });

      const newTotalAmount = selectedOrder.totalAmount - refundAmount;
      const newSubtotal = selectedOrder.subtotal - refundAmount;

      batch.update(orderRef, {
        items: updatedItems.filter((item) => item.quantity > 0),
        totalAmount: newTotalAmount,
        subtotal: newSubtotal,
        status: "Đã hoàn trả một phần",
        // Thêm một trường để ghi lại lịch sử hoàn trả
        refundHistory: [
          ...(selectedOrder.refundHistory || []),
          {
            refundedAt: serverTimestamp(),
            amount: refundAmount,
            items: itemsToRefund,
          },
        ],
      });

      await batch.commit();
      toast.success("Hoàn trả một phần đơn hàng thành công!");
      setShowRefundModal(false);
      setIsDetailModalOpen(false); // Đóng modal chi tiết để dữ liệu được làm mới
    } catch (error) {
      console.error("Lỗi khi hoàn trả:", error);
      toast.error("Đã có lỗi xảy ra khi hoàn trả.");
    }
  };

  const handleExportExcel = async () => {
    if (displayedOrders.length === 0) {
      return toast.warn("Không có đơn hàng nào để xuất.");
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Danh sách đơn hàng");

    worksheet.columns = [
      { header: "Mã ĐH", key: "id", width: 15 },
      { header: "Tên Khách Hàng", key: "customerName", width: 25 },
      { header: "SĐT", key: "phone", width: 15 },
      { header: "Địa chỉ", key: "address", width: 40 },
      { header: "Ngày Đặt", key: "createdAt", width: 20 },
      { header: "Trạng Thái", key: "status", width: 15 },
      { header: "Phương thức TT", key: "paymentMethod", width: 15 },
      { header: "Sản phẩm", key: "items", width: 50 },
      { header: "Tạm tính", key: "subtotal", width: 15 },
      { header: "Giảm giá", key: "discountAmount", width: 15 },
      { header: "Tổng tiền", key: "totalAmount", width: 15 },
    ];

    displayedOrders.forEach((order) => {
      worksheet.addRow({
        id: order.id,
        customerName: order.shippingInfo?.name || "N/A",
        phone: order.shippingInfo?.phone || "N/A",
        address: order.shippingInfo?.address || "N/A",
        createdAt: order.createdAt.toDate().toLocaleString("vi-VN"),
        status: order.status,
        paymentMethod: order.paymentMethod,
        items: order.items
          .map((item) => `${item.name} (x${item.quantity})`)
          .join(", "),
        subtotal: order.subtotal,
        discountAmount: order.discountAmount,
        totalAmount: order.totalAmount,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Danh_sach_don_hang.xlsx";
    link.click();
  };

  if (loading) return <Spinner />;

  // Logic phân trang
  const ORDERS_PER_PAGE = 10;
  const totalPages = Math.ceil(displayedOrders.length / ORDERS_PER_PAGE);
  const paginatedOrders = displayedOrders.slice(
    (currentPage - 1) * ORDERS_PER_PAGE,
    currentPage * ORDERS_PER_PAGE
  );
  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Quản lý Đơn hàng</h1>
      </div>
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md mb-6 flex items-center gap-4 flex-wrap">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Tìm theo tên, SĐT khách hàng hoặc mã đơn hàng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 pl-10 border rounded-md text-sm dark:bg-gray-700 dark:border-gray-600"
          />
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="status-filter" className="text-sm font-medium">
              Trạng thái:
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-2 border rounded-md text-sm dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="all">Tất cả</option>
              <option value="Đang xử lý">Đang xử lý</option>
              <option value="Đang giao hàng">Đang giao hàng</option>
              <option value="Hoàn thành">Hoàn thành</option>
              <option value="Đã hủy">Đã hủy</option>
            </select>
          </div>
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
          <div className="ml-auto">
            <button onClick={handleExportExcel} className="admin-button-teal">
              <Download size={18} className="mr-2" />
              Xuất Excel
            </button>
          </div>
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
            {paginatedOrders.map((o) => (
              <tr
                key={o.id}
                className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                onClick={() => {
                  setSelectedOrder(o);
                  setIsDetailModalOpen(true);
                }}
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
                    onClick={(e) => e.stopPropagation()}
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
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-6 space-x-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <ChevronLeft size={16} className="mr-1" /> Trang trước
          </button>
          <span className="font-semibold text-gray-700 dark:text-gray-300">
            Trang {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-green-600 text-white rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
          >
            Trang sau <ChevronRight size={16} className="ml-1" />
          </button>
        </div>
      )}
      {isDetailModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4 border-b dark:border-gray-700 pb-3">
              <h2 className="text-2xl font-bold">
                Chi tiết Đơn hàng #{selectedOrder.id.substring(0, 8)}
              </h2>
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setSelectedOrder(null);
                }}
              >
                <X size={24} />
              </button>
            </div>
            <div className="overflow-y-auto pr-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">
                    Thông tin giao hàng
                  </h3>
                  <p>
                    <strong>Tên:</strong> {selectedOrder.shippingInfo.name}
                  </p>
                  <p>
                    <strong>SĐT:</strong> {selectedOrder.shippingInfo.phone}
                  </p>
                  <p>
                    <strong>Địa chỉ:</strong>{" "}
                    {selectedOrder.shippingInfo.address}
                  </p>
                  <p>
                    <strong>Ghi chú:</strong>{" "}
                    {selectedOrder.shippingInfo.note || "Không có"}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">
                    Thông tin đơn hàng
                  </h3>
                  <p>
                    <strong>Ngày đặt:</strong>{" "}
                    {selectedOrder.createdAt.toDate().toLocaleString("vi-VN")}
                  </p>
                  <p>
                    <strong>Trạng thái:</strong> {selectedOrder.status}
                  </p>
                  <p>
                    <strong>Thanh toán:</strong> {selectedOrder.paymentMethod}
                  </p>
                </div>
              </div>

              <h3 className="font-semibold text-lg mb-2">Các sản phẩm</h3>
              <div className="border rounded-md dark:border-gray-700">
                {selectedOrder.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center p-2 border-b dark:border-gray-600 last:border-b-0"
                  >
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm text-gray-500">
                        {formatCurrency(item.price)} x {item.quantity}
                      </p>
                    </div>
                    <p className="font-semibold">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 text-right space-y-1">
                <p>Tạm tính: {formatCurrency(selectedOrder.subtotal)}</p>
                <p className="text-red-500">
                  Giảm giá: -{formatCurrency(selectedOrder.discountAmount)}
                </p>
                <p className="text-xl font-bold">
                  Tổng cộng: {formatCurrency(selectedOrder.totalAmount)}
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-4 border-t dark:border-gray-700 pt-4">
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setSelectedOrder(null);
                }}
                className="px-6 py-2 bg-gray-200 dark:bg-gray-600 rounded-md"
              >
                Đóng
              </button>
              {selectedOrder.status === "Hoàn thành" && (
                <button
                  onClick={() => setShowRefundModal(true)}
                  className="px-6 py-2 bg-yellow-500 text-white rounded-md flex items-center gap-2"
                >
                  <RotateCcw size={18} /> Hoàn trả
                </button>
              )}
              <button
                onClick={handlePrint}
                className="px-6 py-2 bg-blue-600 text-white rounded-md flex items-center gap-2"
              >
                <Printer size={18} /> In Hóa đơn
              </button>
            </div>
          </div>
          <div style={{ display: "none" }}>
            <InvoiceTemplate ref={invoiceRef} order={selectedOrder} />
          </div>
        </div>
      )}
      {showRefundModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Hoàn trả một phần đơn hàng</h2>
              <button onClick={() => setShowRefundModal(false)}>
                <X size={24} />
              </button>
            </div>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
              {selectedOrder.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-md"
                >
                  <div className="flex-grow">
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-gray-500">
                      Đã mua: {item.quantity}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm">Số lượng trả:</label>
                    <input
                      type="number"
                      min="0"
                      max={item.quantity}
                      value={returnQuantities[item.id] || 0}
                      onChange={(e) =>
                        setReturnQuantities((prev) => ({
                          ...prev,
                          [item.id]: Math.max(
                            0,
                            Math.min(item.quantity, Number(e.target.value))
                          ),
                        }))
                      }
                      className="w-20 p-1 border rounded-md dark:bg-gray-800"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-right font-bold text-lg">
              Tổng tiền hoàn trả:{" "}
              <span className="text-red-500">
                {formatCurrency(
                  Object.entries(returnQuantities).reduce(
                    (sum, [variantId, quantity]) => {
                      const item = selectedOrder.items.find(
                        (i) => i.id === variantId
                      );
                      return sum + (item?.price || 0) * quantity;
                    },
                    0
                  )
                )}
              </span>
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => setShowRefundModal(false)}
                className="px-6 py-2 bg-gray-200 dark:bg-gray-600 rounded-md"
              >
                Hủy
              </button>
              <button
                onClick={handlePartialRefund}
                className="px-6 py-2 bg-green-600 text-white rounded-md"
              >
                Xác nhận hoàn trả
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
