import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { formatCurrency } from "../utils/formatCurrency";
import { toast } from "react-toastify";
import { ShoppingCart, Trash2 } from "lucide-react";
import SEO from "../components/common/SEO";
import "../styles/pages.css";

const CartPage = () => {
  const { cart, updateCartQuantity } = useAppContext();
  const navigate = useNavigate();
  const [selectedItems, setSelectedItems] = useState(new Set());

  useEffect(() => {
    setSelectedItems(new Set(cart.map((item) => item.id)));
  }, [cart]);

  const handleSelectItem = (productId) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedItems(new Set(cart.map((item) => item.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleProceedToCheckout = () => {
    const itemsForCheckout = cart.filter((item) => selectedItems.has(item.id));
    if (itemsForCheckout.length === 0) {
      toast.warn("Vui lòng chọn ít nhất một sản phẩm để thanh toán.");
      return;
    }
    navigate("/checkout", { state: { itemsForCheckout } });
  };

  const selectedCartTotal = cart
    .filter((item) => selectedItems.has(item.id))
    .reduce((total, item) => total + item.price * item.quantity, 0);

  if (cart.length === 0)
    return (
      <>
        <SEO title="Giỏ hàng trống" />
        <div className="cart-empty-container">
          <ShoppingCart
            size={80}
            className="mx-auto text-gray-300 dark:text-gray-600"
          />
          <h2 className="text-3xl font-bold mt-4">
            Giỏ hàng của bạn đang trống
          </h2>
          <Link
            to="/"
            className="mt-6 bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
          >
            Tiếp tục mua sắm
          </Link>
        </div>
      </>
    );

  return (
    <>
      <SEO
        title="Giỏ hàng của bạn"
        description="Kiểm tra và quản lý các sản phẩm trong giỏ hàng của bạn tại FreshFood."
      />
      <div className="page-container">
        <h1 className="page-title">Giỏ hàng của bạn</h1>
        <div className="cart-grid">
          <div className="cart-item-list">
            <div className="flex items-center border-b pb-4 mb-4">
              <input
                type="checkbox"
                className="h-5 w-5 rounded text-green-600 focus:ring-green-500"
                checked={selectedItems.size === cart.length && cart.length > 0}
                onChange={handleSelectAll}
              />
              <label className="ml-3 font-semibold">
                Chọn tất cả ({cart.length} sản phẩm)
              </label>
            </div>
            {cart.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between border-b dark:border-gray-700 py-4 last:border-b-0"
              >
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded text-green-600 focus:ring-green-500"
                    checked={selectedItems.has(item.id)}
                    onChange={() => handleSelectItem(item.id)}
                  />
                  <img
                    src={item.imageUrls?.[0]}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded-md ml-4 mr-4"
                  />
                  <div>
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatCurrency(item.price)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) =>
                      updateCartQuantity(item.id, parseInt(e.target.value))
                    }
                    className="w-16 p-1 border rounded text-center dark:bg-gray-700 dark:border-gray-600"
                    min="0"
                  />
                  <p className="font-semibold w-24 text-right">
                    {formatCurrency(item.price * item.quantity)}
                  </p>
                  <button
                    onClick={() => updateCartQuantity(item.id, 0)}
                    className="text-gray-500 hover:text-red-500"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="cart-summary">
            <h2 className="cart-summary-title">Tóm tắt đơn hàng</h2>
            <div className="flex justify-between font-bold text-lg mt-4 pt-4">
              <span>Tổng cộng</span>
              <span>{formatCurrency(selectedCartTotal)}</span>
            </div>
            <button
              onClick={handleProceedToCheckout}
              className="cart-checkout-button"
            >
              Mua hàng ({selectedItems.size} sản phẩm)
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CartPage;
