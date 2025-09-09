import React, { useState } from "react";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  deleteUser,
} from "firebase/auth";
import { db, auth } from "../../firebase/config";
import { toast } from "react-toastify";
import ReauthenticationModal from "../auth/ReauthenticationModal";
import { CreditCard, AlertTriangle } from "lucide-react";

const SettingsTab = ({ user, userData }) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handlePaymentMethodChange = async (e) => {
    if (!user) return;
    await updateDoc(doc(db, "users", user.uid), {
      defaultPaymentMethod: e.target.value,
    });
    toast.success("Đã cập nhật phương thức thanh toán mặc định!");
  };

  const handleDeleteAccount = async (password) => {
    if (!user) return;
    try {
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      await deleteDoc(doc(db, "users", user.uid));
      await deleteUser(user);
      toast.success("Tài khoản của bạn đã được xóa thành công.");
      setShowDeleteModal(false);
    } catch (error) {
      toast.error("Xác thực thất bại hoặc đã có lỗi xảy ra. Vui lòng thử lại.");
      console.error("Delete account error:", error);
    }
  };

  return (
    <>
      <div className="page-section mb-8">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <CreditCard size={20} className="mr-2" /> Cài đặt thanh toán
        </h2>
        <div className="space-y-2">
          <p className="text-gray-600 dark:text-gray-400">
            Chọn phương thức thanh toán mặc định.
          </p>
          <div>
            <label className="flex items-center p-3 border rounded-md cursor-pointer dark:border-gray-700">
              <input
                type="radio"
                name="defaultPayment"
                value="COD"
                checked={
                  userData?.defaultPaymentMethod === "COD" ||
                  !userData?.defaultPaymentMethod
                }
                onChange={handlePaymentMethodChange}
                className="mr-3"
              />
              Thanh toán khi nhận hàng (COD)
            </label>
          </div>
          <div>
            <label className="flex items-center p-3 border rounded-md cursor-pointer dark:border-gray-700">
              <input
                type="radio"
                name="defaultPayment"
                value="STRIPE_CARD"
                checked={userData?.defaultPaymentMethod === "STRIPE_CARD"}
                onChange={handlePaymentMethodChange}
                className="mr-3"
              />
              Thanh toán qua thẻ (Visa, Mastercard)
            </label>
          </div>
        </div>
      </div>
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-red-700 dark:text-red-400 mb-4 flex items-center">
          <AlertTriangle size={20} className="mr-2" /> Khu vực nguy hiểm
        </h2>
        <p className="text-red-600 dark:text-red-300 mb-4">
          Hành động dưới đây không thể được hoàn tác.
        </p>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="bg-red-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-red-700"
        >
          Xóa tài khoản của tôi
        </button>
      </div>

      {showDeleteModal && (
        <ReauthenticationModal
          onConfirm={handleDeleteAccount}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </>
  );
};

export default SettingsTab;
