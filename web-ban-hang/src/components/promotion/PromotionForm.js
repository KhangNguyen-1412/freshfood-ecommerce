import React, { useState, useEffect } from "react";
import "../../styles/promotion.css";

const PromotionForm = ({ promotion, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discountType: "percentage",
    discountValue: 0,
    expiresAt: "",
    minimumPurchaseAmount: 0,
  });

  useEffect(() => {
    if (promotion) {
      setFormData({
        ...promotion,
        expiresAt: promotion.expiresAt?.toDate
          ? promotion.expiresAt.toDate().toISOString().split("T")[0]
          : "",
        minimumPurchaseAmount: promotion.minimumPurchaseAmount || 0,
      });
    }
  }, [promotion]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const dataToSave = { ...formData, expiresAt: new Date(formData.expiresAt) };
    onSave(dataToSave);
  };

  return (
    <form onSubmit={handleSubmit} className="promo-form-panel">
      <h2 className="promo-form-title">
        {promotion ? "Chỉnh sửa Khuyến mãi" : "Thêm Khuyến mãi mới"}
      </h2>
      <input
        type="text"
        name="code"
        placeholder="Mã khuyến mãi (ví dụ: GIAM10K)"
        value={formData.code}
        onChange={handleChange}
        className="promo-form-control"
        required
      />
      <textarea
        name="description"
        placeholder="Mô tả ngắn"
        value={formData.description}
        onChange={handleChange}
        className="promo-form-control"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="promo-form-label">Loại giảm giá</label>
          <select
            name="discountType"
            value={formData.discountType}
            onChange={handleChange}
            className="promo-form-control mt-1"
          >
            <option value="percentage">Phần trăm (%)</option>
            <option value="fixed">Số tiền cố định (VND)</option>
          </select>
        </div>
        <div>
          <label className="promo-form-label">Giá trị giảm</label>
          <input
            type="number"
            name="discountValue"
            placeholder="Giá trị"
            value={formData.discountValue}
            onChange={handleChange}
            className="promo-form-control mt-1"
            required
            min="0"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="promo-form-label">Ngày hết hạn</label>
          <input
            type="date"
            name="expiresAt"
            value={formData.expiresAt}
            onChange={handleChange}
            className="promo-form-control mt-1"
            required
          />
        </div>
        <div>
          <label className="promo-form-label">Đơn hàng tối thiểu (VND)</label>
          <input
            type="number"
            name="minimumPurchaseAmount"
            placeholder="0"
            value={formData.minimumPurchaseAmount}
            onChange={handleChange}
            className="promo-form-control mt-1"
            min="0"
          />
        </div>
      </div>
      <div className="promo-form-actions">
        <button
          type="button"
          onClick={onCancel}
          className="promo-form-cancel-button"
        >
          Hủy
        </button>
        <button type="submit" className="promo-form-save-button">
          Lưu
        </button>
      </div>
    </form>
  );
};

export default PromotionForm;
