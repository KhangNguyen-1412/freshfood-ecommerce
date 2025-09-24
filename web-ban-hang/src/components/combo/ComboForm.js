import React, { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { collection, query, getDocs, doc } from "firebase/firestore";
import { formatCurrency } from "../../utils/formatCurrency";
import { db } from "../../firebase/config";

const ComboForm = ({ combo, products, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    imageUrl: "",
    totalPrice: 0,
    isActive: true,
    products: [],
  });
  const [variantsCache, setVariantsCache] = useState({}); // Cache để lưu variants đã fetch
  const [suggestedPrice, setSuggestedPrice] = useState(0);

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
      // Fetch variants cho các sản phẩm đã có trong combo khi edit
      combo.products?.forEach(async (p) => {
        if (p.productId && !variantsCache[p.productId]) {
          const variantsQuery = query(
            collection(db, "products", p.productId, "variants")
          );
          const variantsSnapshot = await getDocs(variantsQuery);
          const fetchedVariants = variantsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setVariantsCache((prev) => ({
            ...prev,
            [p.productId]: fetchedVariants,
          }));
        }
      });
    }
  }, [combo]);

  // Effect để tính toán giá gợi ý
  useEffect(() => {
    let total = 0;
    for (const item of formData.products) {
      if (item.productId && item.variantId && item.quantity > 0) {
        const variant = variantsCache[item.productId]?.find(
          (v) => v.id === item.variantId
        );
        const price = variant?.onSale ? variant.salePrice : variant?.price;
        if (price) total += price * item.quantity;
      }
    }
    setSuggestedPrice(total);
  }, [formData.products, variantsCache]);

  const handleMainChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
          ? Number(value)
          : value,
    }));
  };

  const handleProductChange = async (index, field, value) => {
    const newProducts = [...formData.products];
    newProducts[index][field] = value;

    // Nếu thay đổi sản phẩm, reset biến thể và tự động chọn nếu chỉ có 1
    if (field === "productId") {
      newProducts[index].variantId = "";

      // Fetch variants cho sản phẩm được chọn
      if (value) {
        if (!variantsCache[value]) {
          const variantsQuery = query(
            collection(db, "products", value, "variants")
          );
          const variantsSnapshot = await getDocs(variantsQuery);
          const fetchedVariants = variantsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setVariantsCache((prev) => ({ ...prev, [value]: fetchedVariants }));

          // Tự động chọn biến thể nếu sản phẩm chỉ có 1 biến thể
          if (fetchedVariants.length === 1) {
            newProducts[index].variantId = fetchedVariants[0].id;
          }
        } else {
          // Sử dụng cache nếu có
          if (variantsCache[value].length === 1) {
            newProducts[index].variantId = variantsCache[value][0].id;
          }
        }
      }
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
            <span className="text-sm text-gray-500 self-center">
              Giá gợi ý:{" "}
              <strong className="text-green-600">
                {formatCurrency(suggestedPrice)}
              </strong>
            </span>
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
              const productVariants = variantsCache[p.productId] || [];
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
                      required // Bắt buộc phải chọn một biến thể
                    >
                      <option value="">-- Chọn phiên bản --</option>
                      {productVariants.map((variant) => (
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
