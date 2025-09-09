import React, { useState } from "react";
import { toast } from "react-toastify";
import { X, Tag } from "lucide-react";
import { formatCurrency } from "../../utils/formatCurrency";
import "../../styles/checkout.css";

const PromoCodeModal = ({
  availablePromos,
  appliedPromoIds,
  onApply,
  onClose,
}) => {
  const [promoCodeInput, setPromoCodeInput] = useState("");

  const handleApplyInput = () => {
    if (!promoCodeInput.trim()) return;
    const promoToApply = availablePromos.find(
      (p) => p.code.toUpperCase() === promoCodeInput.trim().toUpperCase()
    );
    if (promoToApply) {
      onApply(promoToApply);
    } else {
      toast.error(
        "Mã khuyến mãi không hợp lệ hoặc không đủ điều kiện áp dụng."
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 animate-fade-in">
      <div className="promo-modal-panel">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
        >
          <X size={24} />
        </button>
        <h2 className="promo-modal-title">Chọn mã khuyến mãi</h2>

        <div className="mb-4">
          <div className="promo-input-group">
            <input
              type="text"
              placeholder="Hoặc nhập mã khác tại đây"
              value={promoCodeInput}
              onChange={(e) => setPromoCodeInput(e.target.value)}
              className="promo-input"
            />
            <button onClick={handleApplyInput} className="promo-apply-button">
              Áp dụng
            </button>
          </div>
        </div>

        <div className="promo-list">
          {availablePromos.length > 0 ? (
            availablePromos.map((promo) => {
              const isApplied = appliedPromoIds.includes(promo.id);
              const discountDisplay =
                promo.discountType === "percentage"
                  ? `Giảm ${promo.discountValue}%`
                  : `Giảm ${formatCurrency(promo.discountValue)}`;

              return (
                <div key={promo.id} className="promo-item">
                  <div>
                    <p className="promo-item-code">
                      <Tag size={16} className="mr-2" />
                      {promo.code}
                    </p>
                    <p className="text-sm font-semibold">{discountDisplay}</p>
                    <p className="promo-item-description">
                      {promo.description}
                    </p>
                    <p className="promo-item-condition">
                      Đơn tối thiểu:{" "}
                      {formatCurrency(promo.minimumPurchaseAmount)}
                    </p>
                  </div>
                  <button
                    onClick={() => onApply(promo)}
                    disabled={isApplied}
                    className="promo-item-select-button"
                  >
                    {isApplied ? "Đã áp dụng" : "Áp dụng"}
                  </button>
                </div>
              );
            })
          ) : (
            <p className="text-center text-gray-500 pt-10">
              Không có mã khuyến mãi nào hợp lệ cho đơn hàng của bạn.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PromoCodeModal;
