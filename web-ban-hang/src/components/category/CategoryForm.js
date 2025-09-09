import React, { useState, useEffect } from "react";
import "../../styles/category.css";

const CategoryForm = ({ category, onSave, onCancel, parentCategories }) => {
  const [formData, setFormData] = useState({ name: "", parentId: null });

  useEffect(() => {
    if (category) {
      setFormData({ name: category.name, parentId: category.parentId || null });
    } else {
      setFormData({ name: "", parentId: null });
    }
  }, [category]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="category-panel">
      <h2 className="category-title">
        {category ? "Chỉnh sửa Danh mục" : "Thêm Danh mục mới"}
      </h2>

      <input
        type="text"
        placeholder="Tên danh mục"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        className="category-input"
        required
      />

      <div>
        <label className="category-label">
          Danh mục cha (để trống nếu là danh mục gốc)
        </label>
        <select
          value={formData.parentId || ""}
          onChange={(e) =>
            setFormData({ ...formData, parentId: e.target.value || null })
          }
          className="category-select"
        >
          <option value="">-- Là danh mục cha --</option>
          {parentCategories.map((parent) => (
            <option key={parent.id} value={parent.id}>
              {parent.name}
            </option>
          ))}
        </select>
      </div>

      <div className="category-actions">
        <button
          type="button"
          onClick={onCancel}
          className="category-cancel-button"
        >
          Hủy
        </button>
        <button type="submit" className="category-submit-button">
          Lưu
        </button>
      </div>
    </form>
  );
};

export default CategoryForm;
