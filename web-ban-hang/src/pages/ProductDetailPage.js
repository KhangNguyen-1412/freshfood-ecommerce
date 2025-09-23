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
import ProductQnA from "../components/product/ProductQnA"; // Import component mới
import InnerImageZoom from "react-inner-image-zoom";
import {
  Share2,
  Heart,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  X,
  Link as LinkIcon,
} from "lucide-react";
import { Facebook, Twitter } from "lucide-react";
import "react-inner-image-zoom/lib/InnerImageZoom/styles.min.css";
import "../styles/pages.css";

const ProductDetailPage = () => {
  const { productId } = useParams();
  const { addToCart, user, wishlist, toggleWishlist, addRecentlyViewed } =
    useAppContext();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeInfoTab, setActiveInfoTab] = useState("reviews"); // 'reviews' or 'qna'
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [variants, setVariants] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  useEffect(() => {
    const fetchProductAndVariants = async () => {
      if (!productId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        // Lấy dữ liệu sản phẩm chính và các biến thể song song
        const productRef = doc(db, "products", productId);
        const variantsQuery = query(
          collection(db, "products", productId, "variants")
        );

        const [productSnap, variantsSnap] = await Promise.all([
          getDoc(productRef),
          getDocs(variantsQuery),
        ]);

        if (productSnap.exists()) {
          const productData = { id: productSnap.id, ...productSnap.data() };
          setProduct(productData);
          addRecentlyViewed(productSnap.id);

          const variantsData = variantsSnap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setVariants(variantsData);

          if (variantsData.length > 0) {
            const defaultVariant =
              variantsData.find((v) => v.id === productData.defaultVariantId) ||
              variantsData[0];
            setSelectedVariant(defaultVariant);
          }
        } else {
          setProduct(null);
        }
      } catch (error) {
        console.error("Lỗi khi tải chi tiết sản phẩm:", error);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProductAndVariants();
  }, [productId]); // Loại bỏ addRecentlyViewed khỏi mảng phụ thuộc

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
    if (!selectedVariant) return;
    const itemToBuy = {
      ...product,
      ...selectedVariant,
      // Lấy giá đúng (giá sale hoặc giá gốc)
      price:
        selectedVariant.onSale && selectedVariant.salePrice > 0
          ? selectedVariant.salePrice
          : selectedVariant.price,
      quantity: quantity,
      productId: product.id,
      id: selectedVariant.id, // ID của biến thể
    };
    navigate("/checkout", { state: { buyNowItem: itemToBuy } });
  };

  const handleAddToCart = () => {
    if (!selectedVariant) return;
    const itemToAdd = {
      ...product,
      ...selectedVariant,
      productId: product.id,
      id: selectedVariant.id,
    };
    addToCart(itemToAdd, quantity);
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

  // Xác định ảnh để hiển thị: ưu tiên ảnh của biến thể, sau đó đến ảnh của sản phẩm
  const displayImage =
    selectedVariant?.imageUrl ||
    product.imageUrls?.[currentImageIndex] ||
    "https://placehold.co/600x400";

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
            <div className="relative w-full h-auto max-h-[500px] rounded-lg shadow-md mb-4 overflow-hidden">
              <InnerImageZoom
                src={displayImage}
                zoomSrc={displayImage} // Có thể dùng ảnh chất lượng cao hơn ở đây nếu có
                alt={product.name}
                zoomType="hover"
                className="w-full h-full object-contain"
              />
              {hasMultipleImages && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      goToPreviousImage();
                    }}
                    className="absolute top-1/2 left-2 -translate-y-1/2 bg-black bg-opacity-40 text-white p-2 rounded-full hover:bg-opacity-60"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      goToNextImage();
                    }}
                    className="absolute top-1/2 right-2 -translate-y-1/2 bg-black bg-opacity-40 text-white p-2 rounded-full hover:bg-opacity-60"
                  >
                    <ChevronRight size={24} />
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                    {product.imageUrls.map((_, index) => (
                      <button
                        key={index}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentImageIndex(index);
                        }}
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

              {/* --- PHẦN CHỌN BIẾN THỂ --- */}
              {variants.length > 1 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-lg mb-2">Chọn loại:</h3>
                  <div className="flex flex-wrap gap-3">
                    {variants.map((variant) => (
                      <button
                        key={variant.id}
                        onClick={() => setSelectedVariant(variant)}
                        className={`px-4 py-2 border-2 rounded-lg transition-colors ${
                          selectedVariant?.id === variant.id
                            ? "border-green-600 bg-green-50 dark:bg-green-900/30"
                            : "border-gray-300 dark:border-gray-600 hover:border-green-500"
                        }`}
                      >
                        {variant.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* --- PHẦN HIỂN THỊ GIÁ (ĐÃ CẬP NHẬT) --- */}
              {variants.length > 0 ? (
                selectedVariant && (
                  <>
                    {selectedVariant.onSale && selectedVariant.salePrice > 0 ? (
                      <div className="flex items-baseline gap-3 mb-6">
                        <p className="text-3xl font-bold text-red-500">
                          {formatCurrency(selectedVariant.salePrice)}
                        </p>
                        <p className="text-2xl line-through text-gray-500">
                          {formatCurrency(selectedVariant.price)}
                        </p>
                      </div>
                    ) : (
                      <p className="text-3xl font-bold text-green-600 dark:text-green-400 mb-6">
                        {formatCurrency(selectedVariant.price)}
                      </p>
                    )}
                  </>
                )
              ) : // Trường hợp sản phẩm đơn giản
              product.onSale && product.salePrice > 0 ? (
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

              {/* --- PHẦN CHIA SẺ --- */}
              <div className="flex items-center gap-4 mb-6 border-t dark:border-gray-600 pt-4">
                <h3 className="font-semibold text-lg">Chia sẻ:</h3>
                <div className="flex gap-3">
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                      window.location.href
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700"
                  >
                    <Facebook size={20} />
                  </a>
                  <a
                    href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(
                      window.location.href
                    )}&text=${encodeURIComponent(product.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-full bg-sky-500 text-white hover:bg-sky-600"
                  >
                    <Twitter size={20} />
                  </a>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      alert("Đã sao chép liên kết sản phẩm!");
                    }}
                    className="p-2 rounded-full bg-gray-500 text-white hover:bg-gray-600"
                  >
                    <LinkIcon size={20} />
                  </button>
                </div>
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
                  onClick={handleAddToCart}
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

        {/* --- PHẦN THÔNG TIN BỔ SUNG (ĐÁNH GIÁ & HỎI ĐÁP) --- */}
        <div className="product-detail-info-panel mt-12">
          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveInfoTab("reviews")}
                className={`${
                  activeInfoTab === "reviews"
                    ? "border-green-500 text-green-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg`}
              >
                Đánh giá sản phẩm
              </button>
              <button
                onClick={() => setActiveInfoTab("qna")}
                className={`${
                  activeInfoTab === "qna"
                    ? "border-green-500 text-green-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg`}
              >
                Hỏi & Đáp
              </button>
              {user && (
                <button
                  onClick={() => setActiveInfoTab("my-qna")}
                  className={`${
                    activeInfoTab === "my-qna"
                      ? "border-green-500 text-green-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg`}
                >
                  Câu hỏi của tôi
                </button>
              )}
            </nav>
          </div>

          {/* Tab Content */}
          {activeInfoTab === "reviews" && (
            <div className="animate-fade-in">
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
          )}
          {activeInfoTab === "qna" && (
            <ProductQnA productId={product.id} filterByUser={false} />
          )}
          {activeInfoTab === "my-qna" && (
            <ProductQnA productId={product.id} filterByUser={true} />
          )}
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
      {isLightboxOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[100] animate-fade-in"
          onClick={() => setIsLightboxOpen(false)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300"
            onClick={() => setIsLightboxOpen(false)}
          >
            <X size={32} />
          </button>
          <div className="relative max-w-[90vw] max-h-[90vh]">
            <img
              src={displayImage}
              alt={product.name}
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default ProductDetailPage;
