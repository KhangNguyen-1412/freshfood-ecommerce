import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import { useAppContext } from "../../context/AppContext";
import { toast } from "react-toastify";
import { Tag, Calendar, Copy } from "lucide-react";
import Spinner from "../common/Spinner";

const VouchersTab = () => {
  const { user } = useAppContext();
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "promotions"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const userVouchers = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setVouchers(userVouchers);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching vouchers:", error);
        toast.error("Không thể tải danh sách voucher.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success(`Đã sao chép mã: ${code}`);
  };

  if (loading) {
    return <Spinner />;
  }

  if (vouchers.length === 0) {
    return <p>Bạn chưa có voucher nào.</p>;
  }

  return (
    <div className="page-section">
      <h2 className="text-xl font-bold mb-4">Voucher của tôi</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {vouchers.map((voucher) => {
          const isExpired = new Date() > voucher.expiresAt.toDate();
          return (
            <div
              key={voucher.id}
              className={`relative p-4 border rounded-lg shadow-sm ${
                isExpired
                  ? "bg-gray-100 dark:bg-gray-800 opacity-60"
                  : "bg-white dark:bg-gray-700"
              }`}
            >
              <div className="flex items-center mb-2">
                <Tag className="text-green-500 mr-2" size={20} />
                <p className="font-bold text-lg">{voucher.description}</p>
              </div>
              <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-600 p-2 rounded-md my-2">
                <span className="font-mono text-blue-600 dark:text-blue-400">
                  {voucher.code}
                </span>
                <button
                  onClick={() => handleCopyCode(voucher.code)}
                  className="text-gray-500 hover:text-gray-800"
                >
                  <Copy size={18} />
                </button>
              </div>
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <Calendar className="mr-1" size={14} />
                <span>
                  Hạn sử dụng:{" "}
                  {voucher.expiresAt.toDate().toLocaleDateString("vi-VN")}
                </span>
              </div>
              {isExpired && (
                <div className="absolute top-2 right-2 text-xs font-bold text-red-500 bg-red-100 dark:bg-red-900/50 px-2 py-1 rounded">
                  Hết hạn
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VouchersTab;
