import React, { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase/config";

import Spinner from "../../components/common/Spinner";
import PurchaseForm from "../../components/purchase/PurchaseForm";
import PurchaseExcelUploadModal from "../../components/purchase/PurchaseExcelUploadModal";
import PurchaseDetailModal from "../../components/purchase/PurchaseDetailModal";
import { formatCurrency } from "../../utils/formatCurrency";
import { Upload, Eye } from "lucide-react";
import "../../styles/admin.css";

const AdminPurchasesPage = () => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);

  useEffect(() => {
    const q = query(collection(db, "purchases"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPurchases(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Quản lý Nhập kho</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowExcelModal(true)}
            className="admin-button-blue"
          >
            <Upload size={18} className="mr-2" /> Nhập từ Excel
          </button>
          <button
            onClick={() => setShowPurchaseForm(true)}
            className="admin-button-green !flex-none"
          >
            Tạo đơn nhập kho
          </button>
        </div>
      </div>

      {showExcelModal && (
        <PurchaseExcelUploadModal
          onCancel={() => setShowExcelModal(false)}
          onUploadSuccess={() => setShowExcelModal(false)}
        />
      )}
      {showPurchaseForm && (
        <PurchaseForm onCancel={() => setShowPurchaseForm(false)} />
      )}
      {selectedPurchase && (
        <PurchaseDetailModal
          purchase={selectedPurchase}
          onClose={() => setSelectedPurchase(null)}
        />
      )}

      <div className="admin-table-container">
        <h2 className="text-xl font-bold mb-4">Lịch sử nhập kho</h2>
        <table className="admin-table">
          <thead>
            <tr className="border-b dark:border-gray-700">
              <th className="p-2 text-left">Ngày nhập</th>
              <th className="p-2 text-left">Nhà cung cấp</th>
              <th className="p-2 text-left">Số mặt hàng</th>
              <th className="p-2 text-left">Tổng chi phí</th>
              <th className="p-2 text-left">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {purchases.map((p) => (
              <tr
                key={p.id}
                className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td className="p-2">
                  {p.createdAt?.toDate().toLocaleDateString("vi-VN")}
                </td>
                <td className="p-2">{p.supplier || "N/A"}</td>
                <td className="p-2">{p.items.length}</td>
                <td className="p-2 font-semibold">
                  {formatCurrency(p.totalCost)}
                </td>
                <td className="p-2">
                  <button
                    onClick={() => setSelectedPurchase(p)}
                    className="text-blue-500 hover:underline flex items-center text-sm"
                  >
                    <Eye size={16} className="mr-1" /> Xem bill
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminPurchasesPage;
