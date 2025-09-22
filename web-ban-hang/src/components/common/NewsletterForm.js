import React, { useState } from "react";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import { toast } from "react-toastify";

const NewsletterForm = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.warn("Vui lòng nhập email của bạn.");
      return;
    }
    setLoading(true);

    try {
      // Kiểm tra xem email đã tồn tại chưa
      const subscribersRef = collection(db, "newsletter_subscribers");
      const q = query(subscribersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        toast.info("Email này đã được đăng ký trước đó!");
        setEmail("");
        setLoading(false);
        return;
      }

      // Thêm email mới vào Firestore
      await addDoc(subscribersRef, {
        email: email,
        subscribedAt: serverTimestamp(),
      });

      toast.success("Cảm ơn bạn đã đăng ký nhận tin!");
      setEmail("");
    } catch (error) {
      console.error("Lỗi khi đăng ký nhận tin:", error);
      toast.error("Đã có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Nhập email của bạn"
        className="flex-grow p-3 border rounded-md dark:bg-gray-700 dark:border-gray-600"
        disabled={loading}
      />
      <button
        type="submit"
        className="px-6 py-3 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 disabled:bg-gray-400"
        disabled={loading}
      >
        {loading ? "Đang xử lý..." : "Đăng ký"}
      </button>
    </form>
  );
};

export default NewsletterForm;
