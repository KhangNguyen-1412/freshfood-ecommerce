import React, { useState } from "react";
import { X } from "lucide-react";
import "../../styles/common.css";
import "../../styles/profile.css";
import "../../styles/auth.css";

const AddressForm = ({ address, onSave, onCancel }) => {
  const [formData, setFormData] = useState(
    address || { name: "", phone: "", address: "" }
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="modal-overlay">
      <div className="address-form-panel">
        <button
          onClick={onCancel}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
        >
          <X size={24} />
        </button>
        <h2 className="address-form-title">
          {address ? "Chỉnh sửa địa chỉ" : "Thêm địa chỉ mới"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="name"
            placeholder="Họ và tên người nhận"
            value={formData.name}
            onChange={handleChange}
            className="auth-input"
            required
          />
          <input
            type="tel"
            name="phone"
            placeholder="Số điện thoại"
            value={formData.phone}
            onChange={handleChange}
            className="auth-input"
            required
          />
          <input
            type="text"
            name="address"
            placeholder="Địa chỉ chi tiết"
            value={formData.address}
            onChange={handleChange}
            className="auth-input"
            required
          />
          <div className="address-form-actions">
            <button
              type="button"
              onClick={onCancel}
              className="address-form-cancel-button"
            >
              Hủy
            </button>
            <button type="submit" className="address-form-save-button">
              Lưu địa chỉ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddressForm;
