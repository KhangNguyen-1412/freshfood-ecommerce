import React, { useState, useEffect } from "react";
import { collection, getDocs, query, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase/config";
import { Plus, Trash2 } from "lucide-react";

const ProductForm = ({ product, onSave, onCancel, brands }) => {
  const [mainData, setMainData] = useState(
    product || {
      name: "",
      description: "",
      categoryId: "",
      brandId: "",
      defaultVariantId: "",
      imageUrls: ["", "", ""],
    }
  );
  const [variants, setVariants] = useState(
    product?.variants || [
      {
        id: `new_variant_${Date.now()}`,
        name: "",
        price: 0,
        salePrice: 0,
        onSale: false,
        imageUrl: "",
        sku: "",
      },
    ]
  );
  const [categories, setCategories] = useState([]);
  const [variantsToDelete, setVariantsToDelete] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "categories"), orderBy("name"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCategories(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (product) {
      setMainData({
        name: product.name || "",
        description: product.description || "",
        categoryId: product.categoryId || "",
        brandId: product.brandId || "",
        defaultVariantId: product.defaultVariantId || "",
        imageUrls: product.imageUrls || ["", "", ""],
      });
      // Fetch variants for the existing product
      const variantsQuery = query(
        collection(db, "products", product.id, "variants")
      );
      const unsubscribeVariants = onSnapshot(variantsQuery, (snapshot) => {
        if (!snapshot.empty) {
          const variantsData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setVariants(variantsData);
          // Set default variant if not set or invalid
          const currentDefault = product.defaultVariantId;
          const defaultExists = variantsData.some(
            (v) => v.id === currentDefault
          );
          if (!defaultExists && variantsData.length > 0) {
            setMainData((prev) => ({
              ...prev,
              defaultVariantId: variantsData[0].id,
            }));
          }
        } else {
          // Nếu không có variant nào, tạo một cái mặc định
          setVariants([
            {
              id: `new_variant_${Date.now()}`,
              name: "",
              price: 0,
              salePrice: 0,
              onSale: false,
              imageUrl: "",
              sku: "",
            },
          ]);
        }
      });

      return () => unsubscribeVariants();
    }
  }, [product]);

  const handleMainChange = (e) => {
    const { name, value } = e.target;
    setMainData((prev) => ({ ...prev, [name]: value }));
  };

  const handleVariantChange = (index, e) => {
    const { name, value, type, checked } = e.target;
    const newVariants = [...variants];
    newVariants[index] = {
      ...newVariants[index],
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
          ? Number(value)
          : value,
    };
    setVariants(newVariants);
  };

  const addVariant = () => {
    setVariants([
      ...variants,
      {
        id: `new_variant_${Date.now()}`,
        name: "",
        price: 0,
        salePrice: 0,
        onSale: false,
        imageUrl: "",
        sku: "",
      },
    ]);
  };

  const removeVariant = (index) => {
    if (variants.length <= 1) return;

    const variantToRemove = variants[index];
    // Nếu variant này đã có trong DB (ID không bắt đầu bằng 'new_'), thêm nó vào danh sách chờ xóa
    if (!variantToRemove.id.startsWith("new_")) {
      setVariantsToDelete((prev) => [...prev, variantToRemove.id]);
    }

    const newVariants = variants.filter((_, i) => i !== index);
    // Nếu variant bị xóa là default, chọn cái đầu tiên làm default mới
    if (
      mainData.defaultVariantId === variantToRemove.id &&
      newVariants.length > 0
    ) {
      setMainData((prev) => ({ ...prev, defaultVariantId: newVariants[0].id }));
    }
    setVariants(newVariants);
  };

  const handleImageChange = (index, value) => {
    const newImageUrls = [...mainData.imageUrls];
    newImageUrls[index] = value;
    setMainData((prev) => ({ ...prev, imageUrls: newImageUrls }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ mainData, variants, variantsToDelete });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start z-50 overflow-y-auto py-10">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-4xl space-y-6"
      >
        <h2 className="text-2xl font-bold">
          {product ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
        </h2>

        {/* Main Product Info */}
        <div className="p-4 border rounded-md">
          <h3 className="font-semibold mb-2">Thông tin chung</h3>
          <input
            name="name"
            value={mainData.name}
            onChange={handleMainChange}
            placeholder="Tên sản phẩm"
            className="admin-input"
            required
          />
          <textarea
            name="description"
            value={mainData.description}
            onChange={handleMainChange}
            placeholder="Mô tả"
            className="admin-input"
            rows="3"
          />
          <div className="grid grid-cols-2 gap-4">
            <select
              name="categoryId"
              value={mainData.categoryId}
              onChange={handleMainChange}
              className="admin-input"
              required
            >
              <option value="">-- Chọn Danh mục --</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <select
              name="brandId"
              value={mainData.brandId}
              onChange={handleMainChange}
              className="admin-input"
            >
              <option value="">-- Chọn Nhãn hiệu --</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.brandName}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-4">
            <h4 className="font-semibold text-sm mb-2">URL Hình ảnh</h4>
            {mainData.imageUrls.map((url, index) => (
              <input
                key={index}
                value={url || ""}
                onChange={(e) => handleImageChange(index, e.target.value)}
                placeholder={`URL hình ảnh ${index + 1}`}
                className="admin-input mb-2"
              />
            ))}
          </div>
        </div>

        {/* Variants Section */}
        <div className="p-4 border rounded-md">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">
              Các phiên bản (Chai, Lốc, Thùng...)
            </h3>
            <button
              type="button"
              onClick={addVariant}
              className="admin-button-blue text-sm !py-1"
            >
              <Plus size={16} className="mr-1" /> Thêm phiên bản
            </button>
          </div>

          <div className="space-y-4">
            {variants.map((variant, index) => (
              <div
                key={variant.id}
                className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md border dark:border-gray-600 relative"
              >
                {variants.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeVariant(index)}
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <input
                    name="name"
                    value={variant.name}
                    onChange={(e) => handleVariantChange(index, e)}
                    placeholder="Tên phiên bản (ví dụ: Lốc 6 chai)"
                    className="admin-input"
                    required
                  />
                  <input
                    name="price"
                    type="number"
                    value={variant.price}
                    onChange={(e) => handleVariantChange(index, e)}
                    placeholder="Giá gốc"
                    className="admin-input"
                    required
                  />
                  <input
                    name="sku"
                    value={variant.sku}
                    onChange={(e) => handleVariantChange(index, e)}
                    placeholder="Mã SKU (tùy chọn)"
                    className="admin-input"
                  />
                  <input
                    name="imageUrl"
                    value={variant.imageUrl || ""}
                    onChange={(e) => handleVariantChange(index, e)}
                    placeholder="URL ảnh của phiên bản"
                    className="admin-input md:col-span-4"
                  />
                </div>
                <div className="mt-3 border-t pt-3 dark:border-gray-600">
                  <h4 className="text-sm font-semibold mb-2">
                    Tồn kho theo chi nhánh:
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {brands.map((branch) => (
                      <div key={branch.id}>
                        <label className="text-xs text-gray-500">
                          {branch.branchName}
                        </label>
                        <input
                          name={`inventory_${branch.id}`}
                          type="number"
                          value={variant[`inventory_${branch.id}`] || 0}
                          onChange={(e) => handleVariantChange(index, e)}
                          placeholder="Số lượng"
                          className="admin-input !p-1 !text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="onSale"
                      checked={!!variant.onSale}
                      onChange={(e) => handleVariantChange(index, e)}
                    />
                    <span>Khuyến mãi</span>
                  </label>
                  {variant.onSale && (
                    <input
                      name="salePrice"
                      type="number"
                      value={variant.salePrice}
                      onChange={(e) => handleVariantChange(index, e)}
                      placeholder="Giá khuyến mãi"
                      className="admin-input flex-grow"
                    />
                  )}
                  <label className="flex items-center gap-2 ml-auto">
                    <input
                      type="radio"
                      name="defaultVariantId"
                      checked={mainData.defaultVariantId === variant.id}
                      onChange={() =>
                        setMainData((prev) => ({
                          ...prev,
                          defaultVariantId: variant.id,
                        }))
                      }
                    />
                    <span>Đặt làm mặc định</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="admin-button-gray"
          >
            Hủy
          </button>
          <button type="submit" className="admin-button-green">
            Lưu sản phẩm
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;
