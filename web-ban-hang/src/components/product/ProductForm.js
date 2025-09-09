import React, { useState, useEffect, useCallback } from "react";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { toast } from "react-toastify";
import { db } from "../../firebase/config";
import "../../styles/product.css";

const ProductForm = ({ product, onSave, onCancel, branches, brands }) => {
  const getInitialData = useCallback(() => {
    const defaults = {
      name: "",
      price: 0,
      description: "",
      categoryId: "",
      brandId: "",
      imageUrls: [],
      thumbnailUrl: "",
      inventory: {},
    };
    const initialProduct = { ...defaults, ...(product || {}) };
    if (product && product.inventory) {
      initialProduct.inventory = product.inventory;
    }
    return initialProduct;
  }, [product]);

  const [formData, setFormData] = useState(getInitialData());
  const [imageFiles, setImageFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      const q = query(collection(db, "categories"), orderBy("name"));
      const snapshot = await getDocs(q);
      setCategories(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    setFormData(getInitialData());
  }, [getInitialData]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const handleImageChange = (e) => {
    if (e.target.files.length > 5) {
      toast.error("Chỉ có thể tải lên tối đa 5 ảnh.");
      return;
    }
    setImageFiles(Array.from(e.target.files));
  };

  const handleInventoryChange = (branchId, value) => {
    setFormData((prev) => ({
      ...prev,
      inventory: {
        ...prev.inventory,
        [branchId]: value === "" ? 0 : parseInt(value, 10),
      },
    }));
  };

  const handleSetThumbnail = (url) => {
    setFormData((prev) => ({ ...prev, thumbnailUrl: url }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const CLOUDINARY_CLOUD_NAME = "web_ban-hang";
    const CLOUDINARY_UPLOAD_PRESET = "user_avatars";

    setIsUploading(true);
    let finalImageUrls = formData.imageUrls || [];

    if (imageFiles.length > 0) {
      const uploadPromises = imageFiles.map(async (file) => {
        const data = new FormData();
        data.append("file", file);
        data.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
        try {
          const res = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
            { method: "POST", body: data }
          );
          const fileData = await res.json();
          return fileData.secure_url;
        } catch (error) {
          console.error("Lỗi tải ảnh lên Cloudinary:", error);
          return null;
        }
      });
      const uploadedUrls = (await Promise.all(uploadPromises)).filter(
        (url) => url !== null
      );
      finalImageUrls = [...finalImageUrls, ...uploadedUrls];
    }

    let finalFormData = { ...formData, imageUrls: finalImageUrls };
    if (!finalFormData.thumbnailUrl && finalImageUrls.length > 0) {
      finalFormData.thumbnailUrl = finalImageUrls[0];
    }

    onSave(finalFormData);

    setIsUploading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="product-form">
      <h2 className="text-2xl font-bold">
        {product ? "Chỉnh sửa Sản phẩm" : "Thêm Sản phẩm mới"}
      </h2>

      <input
        type="text"
        name="name"
        placeholder="Tên sản phẩm"
        value={formData.name}
        onChange={handleChange}
        className="product-form-input"
        required
      />
      <textarea
        name="description"
        placeholder="Mô tả"
        value={formData.description}
        onChange={handleChange}
        className="product-form-input"
      />

      <div className="grid grid-cols-2 gap-4">
        <input
          type="number"
          name="price"
          placeholder="Giá"
          value={formData.price}
          onChange={handleChange}
          className="product-form-input"
          required
          min="0"
        />
      </div>

      <div className="border-t pt-4">
        <h3 className="text-lg font-semibold mb-2">Tồn kho theo Chi nhánh</h3>
        <div className="space-y-2">
          {branches.map((branch) => (
            <div
              key={branch.id}
              className="grid grid-cols-2 items-center gap-4"
            >
              <label className="text-gray-700 dark:text-gray-300">
                {branch.branchName}
              </label>
              <input
                type="number"
                value={formData.inventory?.[branch.id] || 0}
                onChange={(e) =>
                  handleInventoryChange(branch.id, e.target.value)
                }
                className="product-form-input"
                min="0"
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Nhãn hiệu (Brand)
        </label>
        <select
          name="brandId"
          value={formData.brandId}
          onChange={handleChange}
          className="w-full p-2 border rounded-md mt-1 dark:bg-gray-700 dark:border-gray-600"
          required
        >
          <option value="">-- Chọn Nhãn hiệu --</option>
          {brands.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.brandName}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Danh mục
        </label>
        <select
          name="categoryId"
          value={formData.categoryId}
          onChange={handleChange}
          className="w-full p-2 border rounded-md mt-1 dark:bg-gray-700 dark:border-gray-600"
          required
        >
          <option value="">-- Chọn danh mục --</option>
          {categories
            .filter((c) => !c.parentId)
            .map((parent) => (
              <optgroup key={parent.id} label={parent.name}>
                <option value={parent.id}>{parent.name}</option>
                {categories
                  .filter((c) => c.parentId === parent.id)
                  .map((child) => (
                    <option key={child.id} value={child.id}>
                      {child.name}
                    </option>
                  ))}
              </optgroup>
            ))}
        </select>
      </div>

      <div>
        <label className="block mb-2 font-semibold">Hình ảnh</label>
        <input
          type="file"
          onChange={handleImageChange}
          multiple
          accept="image/*"
          className="w-full text-sm"
        />
        <div className="mt-4 flex flex-wrap gap-3">
          {formData.imageUrls &&
            formData.imageUrls.map((url, index) => (
              <div key={index} className="relative group">
                <img
                  src={url}
                  alt={`product-${index}`}
                  className={`w-24 h-24 object-cover rounded-md border-2 ${
                    formData.thumbnailUrl === url
                      ? "border-green-500"
                      : "border-transparent"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => handleSetThumbnail(url)}
                  className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Đặt làm thumbnail
                </button>
              </div>
            ))}
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-md"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={isUploading}
          className="px-4 py-2 bg-green-600 text-white rounded-md disabled:bg-gray-400"
        >
          {isUploading ? "Đang lưu..." : "Lưu sản phẩm"}
        </button>
      </div>
    </form>
  );
};

export default ProductForm;
