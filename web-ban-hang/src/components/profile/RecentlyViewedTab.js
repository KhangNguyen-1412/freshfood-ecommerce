import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebase/config";
import { useAppContext } from "../../context/AppContext";
import ProductCard from "../product/ProductCard";
import Spinner from "../common/Spinner";
import "../../styles/profile.css";

const RecentlyViewedTab = () => {
  const { recentlyViewed } = useAppContext();
  const [viewedProducts, setViewedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!recentlyViewed || recentlyViewed.length === 0) {
      setViewedProducts([]);
      setLoading(false);
      return;
    }

    const fetchViewedProducts = async () => {
      setLoading(true);
      const productIds = recentlyViewed;
      // Firestore 'in' query giới hạn 30 item mỗi lần
      const productChunks = [];
      for (let i = 0; i < productIds.length; i += 30) {
        productChunks.push(productIds.slice(i, i + 30));
      }

      const products = [];
      for (const chunk of productChunks) {
        if (chunk.length > 0) {
          const q = query(
            collection(db, "products"),
            where("__name__", "in", chunk)
          );
          const snapshot = await getDocs(q);
          products.push(
            ...snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
          );
        }
      }

      // Sắp xếp lại sản phẩm theo đúng thứ tự đã xem
      const sortedProducts = productIds
        .map((id) => products.find((p) => p.id === id))
        .filter(Boolean); // Lọc ra các sản phẩm không tìm thấy (có thể đã bị xóa)

      setViewedProducts(sortedProducts);
      setLoading(false);
    };

    fetchViewedProducts();
  }, [recentlyViewed]);

  if (loading) return <Spinner />;

  if (viewedProducts.length === 0) {
    return (
      <p className="text-center text-gray-500 py-8">
        Bạn chưa xem sản phẩm nào gần đây.
      </p>
    );
  }

  return (
    <div className="wishlist-grid">
      {viewedProducts.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
};

export default RecentlyViewedTab;
