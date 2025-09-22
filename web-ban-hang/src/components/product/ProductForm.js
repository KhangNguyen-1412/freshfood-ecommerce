import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  query,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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
  const [hasVariants, setHasVariants] = useState(
    product ? product.defaultVariantId || product.variants?.length > 0 : true
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
        // Thêm các trường cho sản phẩm đơn giản
        price: product.price || 0,
        salePrice: product.salePrice || 0,
        onSale: product.onSale || false,
        stock: product.stock || 0,
      });
      // Fetch variants for the existing product
      const variantsQuery = query(
        collection(db, "products", product.id, "variants")
      );
      const unsubscribeVariants = onSnapshot(variantsQuery, (snapshot) => {
        if (!snapshot.empty) {
          const variantsPromises = snapshot.docs.map(async (variantDoc) => {
            const variantData = { id: variantDoc.id, ...variantDoc.data() };
            const inventoryQuery = query(
              collection(variantDoc.ref, "inventory")
            );
            const inventorySnapshot = await getDocs(inventoryQuery);
            inventorySnapshot.forEach((invDoc) => {
              variantData[`inventory_${invDoc.id}`] = invDoc.data().stock;
            });
            return variantData;
          });

          Promise.all(variantsPromises).then((variantsData) => {
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
          });
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
              // Không cần stock ở đây nữa vì sẽ quản lý qua inventory
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
        // Không cần stock ở đây nữa
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

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setVariants((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
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
              {categories
                .filter((cat) => !cat.parentId)
                .map((parentCat) => (
                  <optgroup key={parentCat.id} label={parentCat.name}>
                    <option value={parentCat.id}>{parentCat.name}</option>
                    {categories
                      .filter((childCat) => childCat.parentId === parentCat.id)
                      .map((childCat) => (
                        <option key={childCat.id} value={childCat.id}>
                          -- {childCat.name}
                        </option>
                      ))}
                  </optgroup>
                ))}
            </select>
            <select
              name="brandId"
              value={mainData.brandId}
              onChange={handleMainChange}
              className="admin-input"
            >
              <option value="">-- Chọn Nhãn hiệu --</option>
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

        {/* Toggle for variants */}
        <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-700/50 rounded-md">
          <input
            type="checkbox"
            id="hasVariants"
            checked={hasVariants}
            onChange={(e) => setHasVariants(e.target.checked)}
            className="h-4 w-4"
          />
          <label htmlFor="hasVariants" className="font-semibold">
            Sản phẩm có nhiều phiên bản (chai, lốc, thùng...)
          </label>
        </div>

        {/* Simple Product Fields */}
        {!hasVariants && (
          <div className="p-4 border rounded-md animate-fade-in">
            <h3 className="font-semibold mb-2">Thông tin giá & Tồn kho</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                name="price"
                type="number"
                value={mainData.price || 0}
                onChange={handleMainChange}
                placeholder="Giá gốc"
                className="admin-input"
                required
              />
              <input
                name="stock"
                type="number"
                value={mainData.stock || 0}
                onChange={handleMainChange}
                placeholder="Tồn kho"
                className="admin-input"
                required
              />
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="onSaleSimple"
                  name="onSale"
                  checked={mainData.onSale}
                  onChange={handleMainChange}
                />
                <label htmlFor="onSaleSimple">Khuyến mãi</label>
              </div>
            </div>
            {mainData.onSale && (
              <div className="mt-4">
                <label>Giá khuyến mãi</label>
                <input
                  name="salePrice"
                  type="number"
                  value={mainData.salePrice || 0}
                  onChange={handleMainChange}
                  placeholder="Giá khuyến mãi"
                  className="admin-input"
                />
              </div>
            )}
          </div>
        )}

        {/* Variants Section */}
        {hasVariants && (
          <div className="p-4 border rounded-md animate-fade-in">
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

            <DndContext
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={variants}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-4">
                  {variants.map((variant, index) => (
                    <SortableVariantItem
                      key={variant.id}
                      id={variant.id}
                      variant={variant}
                      index={index}
                      brands={brands}
                      mainData={mainData} // This was already here, but let's double check the child component definition
                      setMainData={setMainData}
                      handleVariantChange={handleVariantChange}
                      removeVariant={removeVariant}
                      variantsLength={variants.length}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        )}

        <div className="flex justify-end gap-4 pt-6 border-t dark:border-gray-700">
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

// Component con để xử lý từng mục có thể kéo thả
const SortableVariantItem = ({
  id,
  variant,
  index,
  brands,
  mainData,
  setMainData,
  handleVariantChange,
  removeVariant,
  variantsLength,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md border dark:border-gray-600 relative flex items-start gap-2"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="p-1 cursor-grab touch-none"
      >
        <GripVertical size={20} className="text-gray-400" />
      </button>
      <div className="flex-grow">
        {variantsLength > 1 && (
          <button
            type="button"
            onClick={() => removeVariant(index)}
            className="absolute top-2 right-2 text-red-500 hover:text-red-700 z-10"
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
    </div>
  );
};

export default ProductForm;
