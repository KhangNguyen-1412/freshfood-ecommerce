import React from "react";
import { useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import { useAppContext } from "../../context/AppContext";
import { formatCurrency } from "../../utils/formatCurrency";
import "../../styles/product.css";

const ProductCard = ({ product }) => {
  const { addToCart, user, wishlist, toggleWishlist } = useAppContext();
  const navigate = useNavigate(); // Khởi tạo hook

  // Hàm xử lý khi click vào toàn bộ thẻ sản phẩm
  const handleCardClick = () => {
    // Dùng navigate để chuyển trang với URL động
    navigate(`/product/${product.id}`);
  };

  const handleBuyNow = (e) => {
    e.stopPropagation(); // Ngăn không cho sự kiện click lan ra thẻ cha (handleCardClick)

    const itemToBuy = {
      ...product,
      price:
        product.onSale && product.salePrice > 0
          ? product.salePrice
          : product.price,
      quantity: 1,
    };

    // Chuyển đến trang checkout và truyền dữ liệu qua state
    // (Đây là cách an toàn để truyền object, thay vì qua URL)
    navigate("/checkout", { state: { buyNowItem: itemToBuy } });
  };

  const handleAddToCart = (e) => {
    e.stopPropagation(); // Ngăn không cho sự kiện click lan ra thẻ cha
    addToCart(product);
  };

  const handleWishlistClick = (e) => {
    e.stopPropagation(); // Ngăn không cho sự kiện click lan ra thẻ cha
    toggleWishlist(product.id);
  };

  const isWishlisted = wishlist.has(product.id);

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
            onClick={handleWishlistClick}
            className="product-card-wishlist-button"
          >
            <Heart
              size={20}
              fill={isWishlisted ? "currentColor" : "none"}
              className={isWishlisted ? "text-red-500" : ""}
            />
          </button>
        )}
        <div className="product-card-badge">{product.discount || "Mới"}</div>
      </div>
      <div className="product-card-content">
        <h3 className="product-card-name">{product.name}</h3>
        <p className="product-card-category">
          {product.categoryName || "Chưa phân loại"}
        </p>
        <div className="flex justify-between items-center mt-4">
          {product.onSale && product.salePrice > 0 ? (
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
