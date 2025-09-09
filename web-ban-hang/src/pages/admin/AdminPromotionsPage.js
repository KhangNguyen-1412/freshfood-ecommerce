import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import { toast } from "react-toastify";

import Spinner from "../../components/common/Spinner";
import PromotionForm from "../../components/promotion/PromotionForm";
import { formatCurrency } from "../../utils/formatCurrency";
import { Edit, Trash2 } from "lucide-react";

const AdminPromotionsPage = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "promotions"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setPromotions(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
        setLoading(false);
      },
      (error) => {
        console.error("Lỗi truy vấn khuyến mãi:", error);
        toast.error(
          "Không thể tải danh sách khuyến mãi. Vui lòng tạo chỉ mục nếu cần."
        );
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleSavePromotion = async (promotionData) => {
    try {
      if (editingPromotion) {
        await updateDoc(
          doc(db, "promotions", editingPromotion.id),
          promotionData
        );
        toast.success("Cập nhật khuyến mãi thành công!");
      } else {
        await addDoc(collection(db, "promotions"), {
          ...promotionData,
          createdAt: serverTimestamp(),
        });
        toast.success("Thêm khuyến mãi thành công!");
      }
      setShowForm(false);
      setEditingPromotion(null);
    } catch (error) {
      toast.error("Đã có lỗi xảy ra.");
    }
  };

  const handleEdit = (promo) => {
    setEditingPromotion(promo);
    setShowForm(true);
  };

  const handleDelete = async (promoId) => {
    if (window.confirm("Bạn có chắc muốn xóa mã khuyến mãi này?")) {
      await deleteDoc(doc(db, "promotions", promoId));
      toast.success("Đã xóa khuyến mãi.");
    }
  };

  const handleGenerateVouchers = async () => {
    if (
      !window.confirm(
        "Bạn có chắc muốn phát voucher ngẫu nhiên cho 10 khách hàng?"
      )
    )
      return;
    setIsGenerating(true);
    try {
      const usersQuery = query(
        collection(db, "users"),
        where("role", "==", "customer")
      );
      const usersSnapshot = await getDocs(usersQuery);
      if (usersSnapshot.empty)
        return toast.info("Không có khách hàng nào để tặng voucher.");

      const users = usersSnapshot.docs.map((doc) => ({ id: doc.id }));
      const selectedUsers = users.sort(() => 0.5 - Math.random()).slice(0, 10);
      const voucherTemplates = [
        { value: 10000, weight: 60 },
        { value: 20000, weight: 30 },
        { value: 50000, weight: 10 },
      ];

      const batch = writeBatch(db);
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 7);

      selectedUsers.forEach((user) => {
        const random = Math.random() * 100;
        let cumulativeWeight = 0;
        const selectedVoucher = voucherTemplates.find(
          (t) => (cumulativeWeight += t.weight) > random
        );
        const voucherCode = `EVENT_${user.id.substring(0, 4)}_${Date.now()}`;
        const promoRef = doc(db, "promotions", voucherCode);
        batch.set(promoRef, {
          code: voucherCode,
          description: `Voucher sự kiện ngẫu nhiên`,
          discountType: "fixed",
          discountValue: selectedVoucher.value,
          expiresAt: expiryDate,
          createdAt: serverTimestamp(),
          userId: user.id,
        });
      });
      await batch.commit();
      toast.success(`Đã tạo thành công ${selectedUsers.length} voucher!`);
    } catch (error) {
      toast.error("Đã có lỗi xảy ra khi tạo voucher.");
    } finally {
      setIsGenerating(false);
    }
  };

  const formatDiscount = (promo) => {
    return promo.discountType === "percentage"
      ? `${promo.discountValue}%`
      : formatCurrency(promo.discountValue);
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Quản lý Khuyến mãi</h1>
        <div className="flex space-x-2">
          <button
            onClick={handleGenerateVouchers}
            disabled={isGenerating}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isGenerating ? "Đang phát..." : "Phát Voucher Ngẫu nhiên"}
          </button>
          <button
            onClick={() => {
              setEditingPromotion(null);
              setShowForm(true);
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Thêm thủ công
          </button>
        </div>
      </div>

      {showForm && (
        <PromotionForm
          promotion={editingPromotion}
          onSave={handleSavePromotion}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md mt-6 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b dark:border-gray-700">
              <th className="p-2 text-left">Mã Code</th>
              <th className="p-2 text-left">Mô tả</th>
              <th className="p-2 text-left">Giảm giá</th>
              <th className="p-2 text-left">Điều kiện</th>
              <th className="p-2 text-left">Ngày hết hạn</th>
              <th className="p-2 text-left">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {promotions.map((p) => (
              <tr
                key={p.id}
                className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td className="p-2 font-mono text-blue-600">{p.code}</td>
                <td className="p-2">{p.description}</td>
                <td className="p-2 font-semibold">{formatDiscount(p)}</td>
                <td className="p-2 text-sm">
                  {p.minimumPurchaseAmount > 0
                    ? `Đơn > ${formatCurrency(p.minimumPurchaseAmount)}`
                    : "Không"}
                </td>
                <td className="p-2">
                  {p.expiresAt?.toDate
                    ? p.expiresAt.toDate().toLocaleDateString("vi-VN")
                    : "N/A"}
                </td>
                <td className="p-2 flex space-x-2">
                  <button
                    onClick={() => handleEdit(p)}
                    className="text-blue-500"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="text-red-500"
                  >
                    <Trash2 size={18} />
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

export default AdminPromotionsPage;
