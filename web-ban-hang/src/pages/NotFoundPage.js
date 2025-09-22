import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";
import ProductCard from "../components/product/ProductCard";
import SEO from "../components/common/SEO";
import "../styles/pages.css";

const NotFoundPage = () => {
  const [suggestedProducts, setSuggestedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSuggestedProducts = async () => {
      try {
        // Lấy 4 sản phẩm bán chạy nhất để gợi ý
        const q = query(
          collection(db, "products"),
          orderBy("purchaseCount", "desc"),
          limit(4)
        );
        const snapshot = await getDocs(q);
        setSuggestedProducts(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
      } catch (error) {
        console.error("Lỗi khi tải sản phẩm gợi ý:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestedProducts();
  }, []);

  return (
    <>
      <SEO
        title="404 - Không tìm thấy trang"
        description="Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển."
      />
      <div className="page-container flex items-center justify-center text-center">
        <div className="w-full max-w-4xl">
          <div className="max-w-md mx-auto">
            <h1 className="text-9xl font-bold text-green-600">404</h1>
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mt-4 mb-2">
              Oops! Không tìm thấy trang
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              Trang bạn đang tìm kiếm có thể đã bị xóa, đổi tên hoặc không bao
              giờ tồn tại.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/"
                className="cart-checkout-button bg-green-600 hover:bg-green-700"
              >
                Về trang chủ
              </Link>
            </div>
          </div>

          {!loading && suggestedProducts.length > 0 && (
            <div className="mt-16 pt-8 border-t dark:border-gray-700">
              <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">
                Có thể bạn sẽ thích
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {suggestedProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default NotFoundPage;
