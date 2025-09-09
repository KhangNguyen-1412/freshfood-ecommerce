import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  writeBatch,
  increment,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import { toast } from "react-toastify";
import { formatCurrency } from "../../utils/formatCurrency";

const PointsTab = ({ user, userData }) => {
  const [pointsHistory, setPointsHistory] = useState([]);

  useEffect(() => {
    if (!user) return;
    const pointsHistoryRef = collection(db, "users", user.uid, "pointsHistory");
    const q = query(pointsHistoryRef, orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPointsHistory(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
    });
    return () => unsubscribe();
  }, [user]);

  const handleRedeemPoints = async (pointsToRedeem, voucherValue) => {
    if (!user || userData.loyaltyPoints < pointsToRedeem) {
      toast.error("Bạn không đủ điểm để đổi vật phẩm này.");
      return;
    }
    const voucherCode = `VOUCHER_${user.uid.substring(0, 5)}_${Date.now()}`;
    const userRef = doc(db, "users", user.uid);
    const historyRef = doc(collection(userRef, "pointsHistory"));
    const promoRef = doc(db, "promotions", voucherCode);
    try {
      const batch = writeBatch(db);
      batch.update(userRef, { loyaltyPoints: increment(-pointsToRedeem) });
      batch.set(historyRef, {
        pointsChanged: -pointsToRedeem,
        reason: `Đổi điểm lấy voucher ${formatCurrency(voucherValue)}`,
        createdAt: serverTimestamp(),
      });
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
      batch.set(promoRef, {
        code: voucherCode,
        description: `Voucher đổi từ ${pointsToRedeem} điểm`,
        discountType: "fixed",
        discountValue: voucherValue,
        expiresAt: expiryDate,
        minimumPurchaseAmount: 0,
        createdAt: serverTimestamp(),
      });
      await batch.commit();
      toast.success(
        `Đổi điểm thành công! Mã voucher của bạn là: ${voucherCode}`
      );
    } catch (error) {
      toast.error("Đã có lỗi xảy ra, vui lòng thử lại.");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-section text-center">
        <p className="text-lg text-gray-500 dark:text-gray-400">
          Điểm thưởng của bạn
        </p>
        <p className="text-5xl font-bold text-green-600 my-2">
          {userData?.loyaltyPoints || 0}
        </p>
        <p className="text-sm text-gray-400">
          Tích lũy khi mua hàng, đổi lấy voucher giảm giá!
        </p>
      </div>
      <div className="page-section">
        <h3 className="text-xl font-bold mb-4">Đổi thưởng</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 border dark:border-gray-700 rounded-md">
            <div>
              <p className="font-semibold">Voucher giảm 20.000đ</p>
              <p className="text-sm text-yellow-500">Cần 500 điểm</p>
            </div>
            <button
              onClick={() => handleRedeemPoints(500, 20000)}
              disabled={userData?.loyaltyPoints < 500}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Đổi
            </button>
          </div>
          <div className="flex justify-between items-center p-3 border dark:border-gray-700 rounded-md">
            <div>
              <p className="font-semibold">Voucher giảm 50.000đ</p>
              <p className="text-sm text-yellow-500">Cần 1000 điểm</p>
            </div>
            <button
              onClick={() => handleRedeemPoints(1000, 50000)}
              disabled={userData?.loyaltyPoints < 1000}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Đổi
            </button>
          </div>
        </div>
      </div>
      <div className="page-section">
        <h3 className="text-xl font-bold mb-4">Lịch sử điểm</h3>
        <div className="space-y-2">
          {pointsHistory.length > 0 ? (
            pointsHistory.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center border-b dark:border-gray-700 py-2 last:border-0"
              >
                <div>
                  <p className="font-semibold">{item.reason}</p>
                  <p className="text-xs text-gray-500">
                    {item.createdAt?.toDate().toLocaleString("vi-VN")}
                  </p>
                </div>
                <p
                  className={`font-bold text-lg ${
                    item.pointsChanged > 0 ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {item.pointsChanged > 0
                    ? `+${item.pointsChanged}`
                    : item.pointsChanged}
                </p>
              </div>
            ))
          ) : (
            <p className="text-gray-500">Chưa có lịch sử giao dịch điểm.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PointsTab;
