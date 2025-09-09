import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import SEO from "../components/common/SEO";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  limit,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useAppContext } from "../context/AppContext";
import { formatCurrency } from "../utils/formatCurrency";
import Spinner from "../components/common/Spinner";
import StarRating from "../components/common/StarRating";
import ProductCard from "../components/product/ProductCard";
import { Heart, ShoppingCart, ChevronLeft, ChevronRight } from "lucide-react";
import "../styles/pages.css";

const ProductDetailPage = () => {
  const { productId } = useParams();
  const { addToCart, user, wishlist, toggleWishlist } = useAppContext();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [relatedProducts, setRelatedProducts] = useState([]);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) return;
      setLoading(true);
      const productRef = doc(db, "products", productId);
      const productSnap = await getDoc(productRef);
      if (productSnap.exists()) {
        setProduct({ id: productSnap.id, ...productSnap.data() });
      } else {
        setProduct(null);
      }
      setLoading(false);
    };
    fetchProduct();
  }, [productId]);

  const isWishlisted = product ? wishlist.has(product.id) : false;

  useEffect(() => {
    if (product?.imageUrls?.length > 1) {
      const timer = setInterval(() => {
        setCurrentImageIndex(
          (prevIndex) => (prevIndex + 1) % product.imageUrls.length
        );
      }, 3000);
      return () => clearInterval(timer);
    }
  }, [product]);

  const goToPreviousImage = () => {
    if (!product) return;
    setCurrentImageIndex(
      (prevIndex) =>
        (prevIndex - 1 + product.imageUrls.length) % product.imageUrls.length
    );
  };

  const goToNextImage = () => {
    if (!product) return;
    setCurrentImageIndex(
      (prevIndex) => (prevIndex + 1) % product.imageUrls.length
    );
  };

  useEffect(() => {
    if (!product) return;
    const q = query(
      collection(db, "products", product.id, "reviews"),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setReviews(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [product]);

  useEffect(() => {
    if (!product?.categoryId) return;
    const fetchRelatedProducts = async () => {
      const q = query(
        collection(db, "products"),
        where("categoryId", "==", product.categoryId),
        where("__name__", "!=", product.id),
        limit(4)
      );
      const snapshot = await getDocs(q);
      setRelatedProducts(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
    };
    fetchRelatedProducts();
  }, [product]);

  const handleBuyNow = () => {
    if (!product) return;
    const itemToBuy = {
      ...product,
      price:
        product.onSale && product.salePrice > 0
          ? product.salePrice
          : product.price,
      quantity: quantity,
    };
    navigate("/checkout", { state: { buyNowItem: itemToBuy } });
  };

  if (loading) {
    return (
      <div className="flex h-96 justify-center items-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="page-container text-center py-20">
        <h2 className="text-2xl font-bold">404 - Sản phẩm không tồn tại</h2>
      </div>
    );
  }

  const hasMultipleImages = product.imageUrls && product.imageUrls.length > 1;

  return (
    <>
      <SEO
        title={product.name}
        description={product.description.substring(0, 155)} // Cắt ngắn mô tả cho phù hợp
        image={product.thumbnailUrl || product.imageUrls?.[0]}
        url={`/product/${product.id}`}
      />
      <div className="page-container animate-fade-in">
        <div className="product-detail-main-panel">
          <div className="product-detail-grid">
            <div className="relative">
              <img
                src={
                  product.imageUrls?.[currentImageIndex] ||
                  "https://placehold.co/600x400"
                }
                alt={product.name}
                className="w-full h-auto max-h-[500px] object-cover rounded-lg shadow-md mb-4 transition-opacity duration-500"
              />
              {hasMultipleImages && (
                <>
                  <button
                    onClick={goToPreviousImage}
                    className="absolute top-1/2 left-2 -translate-y-1/2 bg-black bg-opacity-40 text-white p-2 rounded-full hover:bg-opacity-60"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    onClick={goToNextImage}
                    className="absolute top-1/2 right-2 -translate-y-1/2 bg-black bg-opacity-40 text-white p-2 rounded-full hover:bg-opacity-60"
                  >
                    <ChevronRight size={24} />
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                    {product.imageUrls.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-3 h-3 rounded-full ${
                          currentImageIndex === index
                            ? "bg-white"
                            : "bg-white bg-opacity-50"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
            <div>
              <h1 className="product-detail-title">{product.name}</h1>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {product.categoryName || "Chưa phân loại"}
              </p>
              {product.onSale && product.salePrice > 0 ? (
                <div className="flex items-baseline gap-3 mb-6">
                  <p className="text-3xl font-bold text-red-500">
                    {formatCurrency(product.salePrice)}
                  </p>
                  <p className="text-2xl line-through text-gray-500">
                    {formatCurrency(product.price)}
                  </p>
                </div>
              ) : (
                <p className="text-3xl font-bold text-green-600 dark:text-green-400 mb-6">
                  {formatCurrency(product.price)}
                </p>
              )}
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-2">Mô tả sản phẩm</h3>
                <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                  {product.description || "Chưa có mô tả."}
                </p>
              </div>
              <div className="flex items-center space-x-4 mb-6">
                <label htmlFor="quantity" className="font-semibold">
                  Số lượng:
                </label>
                <input
                  type="number"
                  id="quantity"
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(Math.max(1, parseInt(e.target.value)))
                  }
                  className="w-20 p-2 border rounded-md text-center dark:bg-gray-700 dark:border-gray-600"
                  min="1"
                />
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => addToCart(product, quantity)}
                  className="flex-grow bg-green-600 text-white py-3 rounded-lg font-semibold text-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                >
                  <ShoppingCart size={22} className="mr-2" /> Thêm vào giỏ hàng
                </button>
                <button
                  onClick={handleBuyNow}
                  className="flex-grow bg-blue-600 text-white py-3 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors"
                >
                  Mua Ngay
                </button>
                {user && (
                  <button
                    onClick={() => toggleWishlist(product.id)}
                    className={`p-3 border-2 rounded-lg ${
                      isWishlisted
                        ? "border-red-500 text-red-500"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                  >
                    <Heart
                      size={22}
                      fill={isWishlisted ? "currentColor" : "none"}
                    />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* --- PHẦN ĐƯỢC CẬP NHẬT ĐẦY ĐỦ --- */}
        <div className="product-detail-reviews-panel">
          <h2 className="text-2xl font-bold mb-4">Đánh giá sản phẩm</h2>
          <div className="flex items-center gap-4 mb-6 pb-4 border-b dark:border-gray-700">
            <div className="text-center">
              <p className="text-4xl font-bold text-yellow-500">
                {product.averageRating
                  ? product.averageRating.toFixed(1)
                  : "Mới"}
              </p>
              <StarRating
                rating={product.averageRating || 0}
                isEditable={false}
              />
              <p className="text-sm text-gray-500">
                ({product.reviewCount || 0} đánh giá)
              </p>
            </div>
          </div>
          <div className="space-y-6">
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <div
                  key={review.id}
                  className="flex gap-4 border-b dark:border-gray-700 pb-4 last:border-0"
                >
                  <img
                    src={
                      review.userAvatar ||
                      `https://i.pravatar.cc/150?u=${review.userId}`
                    }
                    alt="avatar"
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-semibold">{review.userName}</p>
                    <StarRating
                      rating={review.rating}
                      isEditable={false}
                      size={18}
                    />
                    <p className="text-gray-600 dark:text-gray-300 mt-2">
                      {review.comment}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(review.createdAt?.toDate()).toLocaleString(
                        "vi-VN"
                      )}
                    </p>
                    {review.adminReply && (
                      <div className="mt-3 ml-10 pl-4 border-l-2 border-green-500 bg-green-50 dark:bg-gray-900/50 p-3 rounded-r-lg">
                        <p className="font-semibold text-green-700 dark:text-green-400">
                          Phản hồi từ FreshFood:
                        </p>
                        <p className="text-gray-700 dark:text-gray-200 italic">
                          {review.adminReply}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">
                Chưa có đánh giá nào cho sản phẩm này.
              </p>
            )}
          </div>
        </div>
        {relatedProducts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">
              Sản phẩm tương tự
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ProductDetailPage;
