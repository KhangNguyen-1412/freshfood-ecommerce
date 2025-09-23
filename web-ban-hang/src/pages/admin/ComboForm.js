import React, { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";

const ComboForm = ({ combo, products, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    imageUrl: "",
    totalPrice: 0,
    isActive: true,
    products: [],
  });

  useEffect(() => {
    if (combo) {
      setFormData({
        id: combo.id,
        name: combo.name || "",
        description: combo.description || "",
        imageUrl: combo.imageUrl || "",
        totalPrice: combo.totalPrice || 0,
        isActive: combo.isActive !== undefined ? combo.isActive : true,
        products: combo.products || [],
      });
    }
  }, [combo]);

  const handleMainChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleProductChange = (index, field, value) => {
    const newProducts = [...formData.products];
    newProducts[index][field] = value;

    // Nếu thay đổi sản phẩm, reset biến thể
    if (field === "productId") {
      newProducts[index].variantId = "";
    }
    setFormData((prev) => ({ ...prev, products: newProducts }));
  };

  const addProduct = () => {
    setFormData((prev) => ({
      ...prev,
      products: [
        ...prev.products,
        { productId: "", variantId: "", quantity: 1 },
      ],
    }));
  };

  const removeProduct = (index) => {
    setFormData((prev) => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start z-50 overflow-y-auto py-10">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-3xl space-y-6"
      >
        <h2 className="text-2xl font-bold">
          {combo ? "Chỉnh sửa Combo" : "Tạo Combo Mới"}
        </h2>

        <div className="p-4 border rounded-md">
          <h3 className="font-semibold mb-2">Thông tin chung</h3>
          <input
            name="name"
            value={formData.name}
            onChange={handleMainChange}
            placeholder="Tên combo"
            className="admin-input"
            required
          />
          <textarea
            name="description"
            value={formData.description}
            onChange={handleMainChange}
            placeholder="Mô tả combo"
            className="admin-input"
            rows="3"
          />
          <div className="grid grid-cols-2 gap-4">
            <input
              name="totalPrice"
              type="number"
              value={formData.totalPrice}
              onChange={handleMainChange}
              placeholder="Giá combo"
              className="admin-input"
              required
            />
            <input
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleMainChange}
              placeholder="URL ảnh đại diện combo"
              className="admin-input"
            />
          </div>
          <label className="flex items-center gap-2 mt-4">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleMainChange}
              className="h-4 w-4"
            />
            <span>Kích hoạt combo</span>
          </label>
        </div>

        <div className="p-4 border rounded-md">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">Các sản phẩm trong combo</h3>
            <button
              type="button"
              onClick={addProduct}
              className="admin-button-blue text-sm !py-1"
            >
              <Plus size={16} className="mr-1" /> Thêm sản phẩm
            </button>
          </div>
          <div className="space-y-4">
            {formData.products.map((p, index) => {
              const selectedProduct = products.find(
                (prod) => prod.id === p.productId
              );
              return (
                <div
                  key={index}
                  className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md"
                >
                  <div className="md:col-span-5">
                    <select
                      value={p.productId}
                      onChange={(e) =>
                        handleProductChange(index, "productId", e.target.value)
                      }
                      className="admin-input"
                      required
                    >
                      <option value="">-- Chọn sản phẩm --</option>
                      {products.map((prod) => (
                        <option key={prod.id} value={prod.id}>
                          {prod.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-4">
                    <select
                      value={p.variantId}
                      onChange={(e) =>
                        handleProductChange(index, "variantId", e.target.value)
                      }
                      className="admin-input"
                      disabled={!selectedProduct}
                      required
                    >
                      <option value="">-- Chọn phiên bản --</option>
                      {selectedProduct?.variants.map((variant) => (
                        <option key={variant.id} value={variant.id}>
                          {variant.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <input
                      type="number"
                      value={p.quantity}
                      onChange={(e) =>
                        handleProductChange(
                          index,
                          "quantity",
                          Number(e.target.value)
                        )
                      }
                      min="1"
                      className="admin-input"
                      required
                    />
                  </div>
                  <div className="md:col-span-1 text-right">
                    <button
                      type="button"
                      onClick={() => removeProduct(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-6 border-t dark:border-gray-700">
          <button
            type="button"
            onClick={onCancel}
            className="admin-button-gray"
          >
            Hủy
          </button>
          <button type="submit" className="admin-button-green">
            Lưu Combo
          </button>
        </div>
      </form>
    </div>
  );
};

export default ComboForm;
