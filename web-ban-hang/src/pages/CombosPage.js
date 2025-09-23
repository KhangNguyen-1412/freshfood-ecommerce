import React, { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { Link } from "react-router-dom";
import { db } from "../firebase/config";
import SEO from "../components/common/SEO";
import Spinner from "../components/common/Spinner";
import { formatCurrency } from "../utils/formatCurrency";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-toastify";
import {
  writeBatch,
  doc,
  increment,
  serverTimestamp,
} from "firebase/firestore"; // Link is not from firestore

export const ComboCard = ({ combo }) => {
  // Export component này
  const { user, addToCart } = useAppContext();

  const handleAddComboToCart = async () => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để thêm combo vào giỏ hàng.");
      return;
    }

    // Logic thêm nhiều sản phẩm vào giỏ hàng cùng lúc
    const batch = writeBatch(db);
    combo.products.forEach((item) => {
      // Sửa lỗi: Cần tham chiếu đến document của sản phẩm trong giỏ hàng,
      // không phải collection 'cart'.
      // Đường dẫn đúng là 'users/{uid}/cart/{variantId}'
      const cartItemRef = doc(db, "users", user.uid, "cart", item.variantId);
      batch.set(
        cartItemRef,
        {
          quantity: increment(item.quantity),
          addedAt: serverTimestamp(),
          productId: item.productId, // Lưu thêm productId để dễ truy vấn
        },
        { merge: true }
      );
    });

    await batch.commit();
    toast.success(`Đã thêm combo "${combo.name}" vào giỏ hàng!`);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-transform hover:scale-105">
      <img
        src={combo.imageUrl || "https://placehold.co/600x400"}
        alt={combo.name}
        className="w-full h-48 object-cover"
      />
      <div className="p-4">
        <h3 className="text-xl font-bold">{combo.name}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 h-10 overflow-hidden">
          {combo.description}
        </p>
        <div className="mt-4 flex justify-between items-center">
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(combo.totalPrice)}
          </p>
          <button
            onClick={handleAddComboToCart}
            className="px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700"
          >
            Thêm vào giỏ
          </button>
        </div>
      </div>
    </div>
  );
};

const CombosPage = () => {
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "combos"), where("isActive", "==", true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCombos(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <Spinner />;

  return (
    <>
      <SEO
        title="Combo & Gói sản phẩm"
        description="Khám phá các combo sản phẩm tiện lợi với giá ưu đãi từ FreshFood."
      />
      <div className="page-container">
        <h1 className="page-title">Combo & Gói sản phẩm</h1>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
          Tiết kiệm hơn với các gói sản phẩm được thiết kế sẵn, phù hợp cho mọi
          nhu cầu từ bữa ăn gia đình đến các buổi tiệc nhỏ.
        </p>
        {combos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {combos.map((combo) => (
              <ComboCard key={combo.id} combo={combo} />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-10">
            Hiện chưa có combo nào. Vui lòng quay lại sau.
          </p>
        )}
      </div>
    </>
  );
};

export default CombosPage;
