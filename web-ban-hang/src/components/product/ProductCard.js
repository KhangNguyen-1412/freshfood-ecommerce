import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { Heart, ShoppingCart, GitCompareArrows } from "lucide-react";
import { useAppContext } from "../../context/AppContext";
import { formatCurrency } from "../../utils/formatCurrency";
import StarRating from "../common/StarRating";
import "../../styles/product.css";

const ProductCard = ({ product }) => {
  const {
    addToCart,
    user,
    wishlist,
    toggleWishlist,
    compareList,
    toggleCompare,
  } = useAppContext();
  const navigate = useNavigate(); // Khởi tạo hook

  // Hàm xử lý khi click vào toàn bộ thẻ sản phẩm
  const handleCardClick = () => {
    // Dùng navigate để chuyển trang với URL động
    navigate(`/product/${product.id}`);
  };

  const handleBuyNow = (e) => {
    e.stopPropagation(); // Ngăn không cho sự kiện click lan ra thẻ cha (handleCardClick)
    // Khi mua ngay từ card, mặc định mua biến thể đầu tiên (hoặc mặc định)
    const itemToBuy = {
      ...product,
      price:
        product.defaultVariantPrice ||
        (product.onSale && product.salePrice > 0
          ? product.salePrice
          : product.price),
      quantity: 1,
    };

    // Chuyển đến trang checkout và truyền dữ liệu qua state
    // (Đây là cách an toàn để truyền object, thay vì qua URL)
    navigate("/checkout", { state: { buyNowItem: itemToBuy } });
  };

  const handleAddToCart = (e) => {
    e.stopPropagation(); // Ngăn không cho sự kiện click lan ra thẻ cha
    // Khi thêm từ card, mặc định thêm biến thể đầu tiên
    const itemToAdd = {
      ...product,
      // Nếu có biến thể, dùng ID biến thể mặc định, nếu không dùng ID sản phẩm
      id: product.defaultVariantId || product.id,
    };
    addToCart(itemToAdd);
  };

  const handleWishlistClick = (e) => {
    e.stopPropagation(); // Ngăn không cho sự kiện click lan ra thẻ cha
    toggleWishlist(product.id);
  };

  const isWishlisted = wishlist.has(product.id);
  const isComparing = compareList.some((p) => p.id === product.id);

  return (
    <div className="product-card group" onClick={handleCardClick}>
      <div className="product-card-image-wrapper">
        <img
          src={
            product.thumbnailUrl ||
            product.imageUrls?.[0] ||
            "https://placehold.co/600x400"
          }
          alt={product.name}
          className="product-card-image"
        />
        {user && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleWishlist(product.id);
            }}
            title="Yêu thích"
            className={`product-card-action-button top-2 right-2 ${
              isWishlisted ? "text-red-500" : ""
            }`}
          >
            <Heart size={20} fill={isWishlisted ? "currentColor" : "none"} />
          </button>
        )}
        <div className="product-card-badge">
          {product.defaultVariantOnSale || product.onSale
            ? `-${Math.round(
                ((product.defaultVariantPrice || product.price) -
                  (product.defaultVariantSalePrice || product.salePrice)) /
                  (product.defaultVariantPrice || product.price)
              )}%`
            : "Mới"}
        </div>
      </div>
      <div className="product-card-content">
        <h3 className="product-card-name">{product.name}</h3>
        <p className="product-card-category">
          {product.categoryName || "Chưa phân loại"}
        </p>
        <div className="flex justify-between items-center mt-4">
          <div className="flex items-center">
            <StarRating
              rating={product.averageRating || 0}
              size={16}
              isEditable={false}
            />
            <span className="text-xs text-gray-400 ml-2">
              ({product.reviewCount || 0})
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleCompare(product);
            }}
            title="So sánh"
            className={`p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 ${
              isComparing ? "text-blue-500" : ""
            }`}
          >
            <GitCompareArrows size={20} />
          </button>
        </div>
        <div className="mt-2">
          {/* Logic hiển thị giá */}
          {product.defaultVariantId ? ( // Nếu có biến thể
            product.defaultVariantOnSale &&
            product.defaultVariantSalePrice > 0 ? (
              <div className="flex items-baseline gap-2">
                <p className="product-card-price-sale">
                  {formatCurrency(product.defaultVariantSalePrice)}
                </p>
                <p className="product-card-price-original">
                  {formatCurrency(product.defaultVariantPrice)}
                </p>
              </div>
            ) : (
              <p className="product-card-price-normal">
                {formatCurrency(product.defaultVariantPrice)}
              </p>
            )
          ) : // Nếu là sản phẩm đơn giản
          product.onSale && product.salePrice > 0 ? (
            <div className="flex items-baseline gap-2">
              <p className="product-card-price-sale">
                {formatCurrency(product.salePrice)}
              </p>
              <p className="product-card-price-original">
                {formatCurrency(product.price)}
              </p>
            </div>
          ) : (
            <p className="product-card-price-normal">
              {formatCurrency(product.price)}
            </p>
          )}
        </div>
        <div className="product-card-actions">
          <button onClick={handleAddToCart} className="product-card-add-button">
            Thêm giỏ
          </button>
          <button onClick={handleBuyNow} className="product-card-buy-button">
            Mua Ngay
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
