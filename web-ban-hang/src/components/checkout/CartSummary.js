import React from "react";
import { Tag } from "lucide-react";
import { formatCurrency } from "../../utils/formatCurrency";
import Spinner from "../common/Spinner";

const CartSummary = ({
  subtotal,
  totalDiscount,
  finalTotal,
  appliedPromos,
  onShowPromoModal,
  onRemovePromo,
  onPlaceOrder,
  isProcessing,
  selectedPaymentMethod,
}) => {
  return (
    <div className="cart-summary">
      <h2 className="cart-summary-title">Tóm tắt đơn hàng</h2>
      <div className="mt-4">
        <button
          onClick={onShowPromoModal}
          className="w-full text-blue-600 font-semibold border-2 border-dashed dark:border-gray-600 p-2 rounded-md hover:bg-blue-50 dark:hover:bg-gray-700"
        >
          Chọn hoặc nhập mã khuyến mãi
        </button>
        {appliedPromos.length > 0 && (
          <div className="mt-3 space-y-1">
            <p className="font-semibold text-sm mb-2">Mã đã áp dụng:</p>
            {appliedPromos.map((promo) => (
              <div
                key={promo.id}
                className="flex justify-between items-center text-sm text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 p-2 rounded-md"
              >
                <span>
                  <Tag size={14} className="inline mr-1" />
                  {promo.code}
                </span>
                <button
                  onClick={() => onRemovePromo(promo.id)}
                  className="font-bold hover:text-red-600"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="flex justify-between mt-4">
        <span>Tạm tính</span>
        <span>{formatCurrency(subtotal)}</span>
      </div>
      <div className="flex justify-between mt-2 text-red-500">
        <span>Giảm giá</span>
        <span>- {formatCurrency(totalDiscount)}</span>
      </div>
      <div className="flex justify-between font-bold text-lg mt-4 border-t dark:border-gray-700 pt-4">
        <span>Tổng cộng</span>
        <span>{formatCurrency(finalTotal)}</span>
      </div>
      {selectedPaymentMethod !== "PAYPAL" && (
        <button
          onClick={onPlaceOrder}
          disabled={isProcessing}
          className="cart-checkout-button flex justify-center items-center"
        >
          {isProcessing ? <Spinner size="sm" /> : "Hoàn tất đơn hàng"}
        </button>
      )}
    </div>
  );
};

export default CartSummary;
