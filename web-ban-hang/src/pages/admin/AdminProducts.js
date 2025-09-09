import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import { toast } from "react-toastify";

import Spinner from "../../components/common/Spinner";
import ProductForm from "../../components/product/ProductForm";
import ToggleSwitch from "../../components/common/ToggleSwitch";
import { formatCurrency } from "../../utils/formatCurrency";
import { Edit, Trash2 } from "lucide-react";
import "../../styles/admin.css";

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [categories, setCategories] = useState({});
  const [brands, setBrands] = useState([]);
  const [brandsMap, setBrandsMap] = useState({});
  const [branches, setBranches] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [selectedParentFilter, setSelectedParentFilter] = useState("all");
  const [selectedChildFilter, setSelectedChildFilter] = useState("all");
  const [selectedBrandFilter, setSelectedBrandFilter] = useState("all");
  const [selectedProducts, setSelectedProducts] = useState(new Set());

  useEffect(() => {
    setLoading(true);
    const unsubProducts = onSnapshot(
      query(collection(db, "products"), orderBy("createdAt", "desc")),
      async (snapshot) => {
        const productsWithInventory = await Promise.all(
          snapshot.docs.map(async (doc) => {
            const productData = { id: doc.id, ...doc.data() };
            const inventorySnapshot = await getDocs(
              query(collection(db, "products", doc.id, "inventory"))
            );
            const inventoryData = {};
            inventorySnapshot.forEach((invDoc) => {
              inventoryData[invDoc.id] = invDoc.data().stock;
            });
            return { ...productData, inventory: inventoryData };
          })
        );
        setProducts(productsWithInventory);
        setLoading(false);
      }
    );

    const unsubCategories = onSnapshot(
      query(collection(db, "categories")),
      (snapshot) => {
        const catsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAllCategories(catsData);
        const catsMap = catsData.reduce((acc, cat) => {
          acc[cat.id] = cat.name;
          return acc;
        }, {});
        setCategories(catsMap);
      }
    );

    const unsubBranches = onSnapshot(
      query(collection(db, "branches")),
      (snapshot) => {
        setBranches(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
      }
    );

    const unsubBrands = onSnapshot(
      query(collection(db, "brands")),
      (snapshot) => {
        const brandsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setBrands(brandsData);
        const bMap = brandsData.reduce((acc, brand) => {
          acc[brand.id] = brand.brandName;
          return acc;
        }, {});
        setBrandsMap(bMap);
      }
    );

    return () => {
      unsubProducts();
      unsubCategories();
      unsubBranches();
      unsubBrands();
    };
  }, []);

  const handleToggleSale = async (productId, currentStatus, product) => {
    const productRef = doc(db, "products", productId);
    try {
      const updateData = { onSale: !currentStatus };
      if (!currentStatus === true && !product.salePrice) {
        updateData.salePrice = product.price;
      }
      await updateDoc(productRef, updateData);
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái khuyến mãi:", error);
      toast.error("Cập nhật thất bại!");
    }
  };

  const handleSalePriceChange = async (productId, newPrice) => {
    const priceValue = Number(newPrice);
    if (isNaN(priceValue) || priceValue < 0) {
      toast.error("Vui lòng nhập một mức giá hợp lệ.");
      return;
    }
    const productRef = doc(db, "products", productId);
    try {
      await updateDoc(productRef, { salePrice: priceValue });
    } catch (error) {
      console.error("Lỗi khi cập nhật giá khuyến mãi:", error);
      toast.error("Cập nhật giá thất bại!");
    }
  };

  const handleSaveProduct = async (productData) => {
    const { inventory, ...mainProductData } = productData;
    const batch = writeBatch(db);
    try {
      if (editingProduct) {
        const productRef = doc(db, "products", editingProduct.id);
        batch.update(productRef, mainProductData);
        for (const branchId in inventory) {
          const stock = inventory[branchId];
          const inventoryRef = doc(
            db,
            "products",
            editingProduct.id,
            "inventory",
            branchId
          );
          batch.set(inventoryRef, { stock: Number(stock) || 0 });
        }
      } else {
        const newProductRef = doc(collection(db, "products"));
        batch.set(newProductRef, {
          ...mainProductData,
          purchaseCount: 0,
          createdAt: serverTimestamp(),
        });
        for (const branchId in inventory) {
          const stock = inventory[branchId];
          const inventoryRef = doc(
            db,
            "products",
            newProductRef.id,
            "inventory",
            branchId
          );
          batch.set(inventoryRef, { stock: Number(stock) || 0 });
        }
      }
      await batch.commit();
      toast.success("Lưu sản phẩm thành công!");
      setShowForm(false);
      setEditingProduct(null);
    } catch (error) {
      console.error("Lỗi khi lưu sản phẩm:", error);
      toast.error(`Lỗi lưu sản phẩm: ${error.message}`);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleDelete = async (productId) => {
    if (window.confirm("Bạn có chắc muốn xóa sản phẩm này?")) {
      await deleteDoc(doc(db, "products", productId));
    }
  };

  const handleProductSelect = (productId) => {
    setSelectedProducts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (isChecking) => {
    if (isChecking) {
      setSelectedProducts(new Set(filteredProducts.map((p) => p.id)));
    } else {
      setSelectedProducts(new Set());
    }
  };

  const handleBulkAssignBrand = async (brandId) => {
    if (selectedProducts.size === 0 || !brandId) {
      toast.warn("Vui lòng chọn ít nhất một sản phẩm và một nhãn hiệu.");
      return;
    }
    if (
      window.confirm(
        `Bạn có chắc muốn gán nhãn hiệu này cho ${selectedProducts.size} sản phẩm đã chọn?`
      )
    ) {
      const batch = writeBatch(db);
      selectedProducts.forEach((productId) => {
        const productRef = doc(db, "products", productId);
        batch.update(productRef, { brandId: brandId });
      });
      await batch.commit();
      toast.success("Gán nhãn hiệu hàng loạt thành công!");
      setSelectedProducts(new Set());
    }
  };

  const parentCategories = allCategories.filter((cat) => !cat.parentId);
  const childrenOfSelectedParent =
    selectedParentFilter === "all"
      ? []
      : allCategories.filter((cat) => cat.parentId === selectedParentFilter);

  const filteredProducts = products.filter((product) => {
    const brandMatch =
      selectedBrandFilter === "all" || product.brandId === selectedBrandFilter;
    let categoryMatch = true;
    if (selectedChildFilter !== "all") {
      categoryMatch = product.categoryId === selectedChildFilter;
    } else if (selectedParentFilter !== "all") {
      const validCategoryIds = [
        selectedParentFilter,
        ...childrenOfSelectedParent.map((c) => c.id),
      ];
      categoryMatch = validCategoryIds.includes(product.categoryId);
    }
    return brandMatch && categoryMatch;
  });

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Quản lý Sản phẩm</h1>
        <button
          onClick={() => {
            setEditingProduct(null);
            setShowForm(true);
          }}
          className="px-4 py-2 bg-green-600 text-white rounded-md"
        >
          Thêm sản phẩm mới
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md mb-6 flex items-center gap-4 flex-wrap">
        <select
          value={selectedParentFilter}
          onChange={(e) => {
            setSelectedParentFilter(e.target.value);
            setSelectedChildFilter("all");
          }}
          className="p-2 border rounded-md text-sm dark:bg-gray-700"
        >
          <option value="all">-- Lọc danh mục cha --</option>
          {parentCategories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        <select
          value={selectedChildFilter}
          onChange={(e) => setSelectedChildFilter(e.target.value)}
          className="p-2 border rounded-md text-sm dark:bg-gray-700"
          disabled={selectedParentFilter === "all"}
        >
          <option value="all">-- Lọc danh mục con --</option>
          {childrenOfSelectedParent.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        <select
          value={selectedBrandFilter}
          onChange={(e) => setSelectedBrandFilter(e.target.value)}
          className="p-2 border rounded-md text-sm dark:bg-gray-700"
        >
          <option value="all">-- Lọc theo nhãn hiệu --</option>
          {brands.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.brandName}
            </option>
          ))}
        </select>
      </div>

      {selectedProducts.size > 0 && (
        <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg my-4 flex items-center gap-4 animate-fade-in">
          <span className="font-semibold">
            {selectedProducts.size} sản phẩm đã chọn
          </span>
          <select
            onChange={(e) => {
              if (e.target.value) handleBulkAssignBrand(e.target.value);
              e.target.value = "";
            }}
            className="p-2 border rounded-md text-sm dark:bg-gray-700"
          >
            <option value="">-- Gán nhãn hiệu --</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.brandName}
              </option>
            ))}
          </select>
        </div>
      )}

      {showForm && (
        <ProductForm
          product={editingProduct}
          onSave={handleSaveProduct}
          onCancel={() => setShowForm(false)}
          branches={branches}
          brands={brands}
        />
      )}

      <div className="admin-table-container">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b dark:border-gray-700">
              <th className="p-2 text-left w-10">
                <input
                  type="checkbox"
                  checked={
                    filteredProducts.length > 0 &&
                    selectedProducts.size === filteredProducts.length
                  }
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="h-4 w-4"
                />
              </th>
              <th className="p-2 text-left">Sản phẩm</th>
              <th className="p-2 text-left">Danh mục</th>
              <th className="p-2 text-left">Nhãn hiệu</th>
              <th className="p-2 text-left">Giá</th>
              <th className="p-2 text-left">Tồn kho</th>
              <th className="p-2 text-center">Khuyến mãi</th>
              <th className="p-2 text-left">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((p) => (
              <tr
                key={p.id}
                className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td className="p-2">
                  <input
                    type="checkbox"
                    checked={selectedProducts.has(p.id)}
                    onChange={() => handleProductSelect(p.id)}
                    className="h-4 w-4"
                  />
                </td>
                <td className="p-2 font-semibold">{p.name}</td>
                <td className="p-2 text-gray-600 dark:text-gray-400">
                  {categories[p.categoryId] || "N/A"}
                </td>
                <td className="p-2 text-gray-600 dark:text-gray-400">
                  {brandsMap[p.brandId] || "N/A"}
                </td>
                <td className="p-2">
                  {p.onSale ? (
                    <div className="flex flex-col">
                      <input
                        type="number"
                        defaultValue={p.salePrice || p.price}
                        onBlur={(e) =>
                          handleSalePriceChange(p.id, e.target.value)
                        }
                        className="p-1 border rounded-md dark:bg-gray-700 dark:border-gray-600 w-28 font-bold text-red-500"
                      />
                      <span className="text-xs line-through text-gray-500">
                        {formatCurrency(p.price)}
                      </span>
                    </div>
                  ) : (
                    <span>{formatCurrency(p.price)}</span>
                  )}
                </td>
                <td className="p-2">
                  {branches.map((branch) => (
                    <div
                      key={branch.id}
                      className="flex justify-between text-xs"
                    >
                      <span>{branch.branchName}:</span>
                      <span className="font-semibold">
                        {p.inventory?.[branch.id] || 0}
                      </span>
                    </div>
                  ))}
                </td>
                <td className="p-2 text-center">
                  <ToggleSwitch
                    checked={p.onSale || false}
                    onChange={() =>
                      handleToggleSale(p.id, p.onSale || false, p)
                    }
                  />
                </td>
                <td className="p-2 flex space-x-2">
                  <button
                    onClick={() => handleEdit(p)}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminProducts;
