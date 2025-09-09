import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebase/config";
import { useAppContext } from "../../context/AppContext";
import ProductCard from "../product/ProductCard";
import Spinner from "../common/Spinner";
import "../../styles/profile.css";

const WishlistTab = () => {
  const { wishlist } = useAppContext();
  const [wishlistProducts, setWishlistProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!wishlist || wishlist.size === 0) {
      setWishlistProducts([]);
      setLoading(false);
      return;
    }
    const fetchWishlistProducts = async () => {
      setLoading(true);
      const productIds = Array.from(wishlist);
      // Chia nhỏ mảng productIds thành các chunk 30 phần tử
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
      setWishlistProducts(products);
      setLoading(false);
    };
    fetchWishlistProducts();
  }, [wishlist]);

  if (loading) return <Spinner />;

  if (wishlistProducts.length === 0) {
    return (
      <div className="wishlist-empty-container">
        <p className="wishlist-empty-text">Bạn chưa yêu thích sản phẩm nào.</p>
      </div>
    );
  }

  return (
    <div className="wishlist-grid">
      {wishlistProducts.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
};

export default WishlistTab;
