import React, { useState, useEffect } from "react";

import {
  getDoc,
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
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import { db } from "../../firebase/config";
import { toast } from "react-toastify";
import * as ExcelJS from "exceljs";

import Spinner from "../../components/common/Spinner";
import ProductForm from "../../components/product/ProductForm";
import ProductExcelUploadModal from "../../components/product/ProductExcelUploadModal";
import ToggleSwitch from "../../components/common/ToggleSwitch";
import { formatCurrency } from "../../utils/formatCurrency";
import {
  Edit,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Upload,
  Download,
} from "lucide-react";
import "../../styles/admin.css";

const AdminProducts = () => {
  const { userData, userPermissions } = useAppContext();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [categories, setCategories] = useState({});
  const [brands, setBrands] = useState([]);
  const [brandsMap, setBrandsMap] = useState({});
  const [branches, setBranches] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [selectedParentFilter, setSelectedParentFilter] = useState("all");
  const [selectedChildFilter, setSelectedChildFilter] = useState("all");
  const [selectedBrandFilter, setSelectedBrandFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({
    key: "createdAt",
    direction: "desc",
  });

  const PRODUCTS_PER_PAGE = 10;
  // Dùng trực tiếp userPermissions?.isAdmin để kiểm tra quyền
  const canWrite = userPermissions?.isAdmin;

  // Hàm kiểm tra quyền ghi chung
  const checkWritePermission = () => {
    if (!userPermissions?.isAdmin) {
      toast.error("Bạn không có quyền thực hiện thao tác này.");
      return false;
    }
    return true;
  };

  useEffect(() => {
    if (
      userPermissions &&
      !userPermissions.isAdmin &&
      !userPermissions.products
    ) {
      toast.error("Bạn không có quyền truy cập chức năng này.");
      navigate("/admin");
    }
  }, [userPermissions, navigate]);

  useEffect(() => {
    setLoading(true);

    const unsubProducts = onSnapshot(
      query(collection(db, "products"), orderBy("createdAt", "desc")),
      async (snapshot) => {
        // SỬA LỖI: Lấy tồn kho cho từng sản phẩm thay vì dùng collectionGroup
        const productsData = await Promise.all(
          snapshot.docs.map(async (productDoc) => {
            const productData = {
              id: productDoc.id,
              ...productDoc.data(),
              inventory: {},
            };

            // Lấy các biến thể của sản phẩm
            const variantsQuery = query(
              collection(db, "products", productDoc.id, "variants")
            );
            const variantsSnapshot = await getDocs(variantsQuery);

            // Nếu có biến thể, tính tổng tồn kho từ các biến thể
            if (!variantsSnapshot.empty) {
              for (const variantDoc of variantsSnapshot.docs) {
                const inventorySnapshot = await getDocs(
                  collection(variantDoc.ref, "inventory")
                );
                inventorySnapshot.forEach((invDoc) => {
                  const stock = invDoc.data().stock || 0;
                  productData.inventory[invDoc.id] =
                    (productData.inventory[invDoc.id] || 0) + stock;
                });
              }
            } else {
              // Nếu không có biến thể, lấy tồn kho từ chính sản phẩm đó (nếu có)
              // Đây là trường hợp dự phòng, cấu trúc mới nên có tồn kho trong biến thể
              productData.inventory["default"] = productData.stock || 0;
            }

            return productData;
          })
        );
        setProducts(productsData);
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
    if (!checkWritePermission()) return;
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
    if (!checkWritePermission()) return;
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
    if (!checkWritePermission()) return;
    const { mainData, variants, variantsToDelete } = productData;
    const batch = writeBatch(db);

    if (variants && variants.length > 0 && mainData.defaultVariantId) {
      const defaultVariant = variants.find(
        (v) => v.id === mainData.defaultVariantId
      );
      if (defaultVariant) {
        mainData.defaultVariantPrice = defaultVariant.price || 0;
        mainData.defaultVariantSalePrice = defaultVariant.salePrice || 0;
        mainData.defaultVariantOnSale = defaultVariant.onSale || false;
        mainData.price = defaultVariant.price || 0;
        mainData.salePrice = defaultVariant.salePrice || 0;
        mainData.onSale = defaultVariant.onSale || false;
      }
    }

    try {
      if (editingProduct) {
        const productRef = doc(db, "products", editingProduct.id);
        batch.update(productRef, mainData);

        if (variantsToDelete && variantsToDelete.length > 0) {
          variantsToDelete.forEach((variantId) => {
            batch.delete(doc(productRef, "variants", variantId));
          });
        }

        for (const variant of variants) {
          const { id, ...variantData } = variant;
          const inventoryData = {};
          Object.keys(variantData).forEach((key) => {
            if (key.startsWith("inventory_")) {
              inventoryData[key.replace("inventory_", "")] = variantData[key];
              delete variantData[key];
            }
          });

          const variantRef = variant.id.startsWith("new_")
            ? doc(collection(productRef, "variants"))
            : doc(productRef, "variants", variant.id);
          batch.set(variantRef, variantData, { merge: true });
          Object.entries(inventoryData).forEach(([branchId, stock]) => {
            const invRef = doc(variantRef, "inventory", branchId);
            batch.set(invRef, { stock: Number(stock) || 0 });
          });
        }
      } else {
        const newProductRef = doc(collection(db, "products"));
        batch.set(newProductRef, {
          ...mainData,
          purchaseCount: 0,
          createdAt: serverTimestamp(),
          defaultVariantId:
            variants && variants.length > 0 ? mainData.defaultVariantId : null,
        });
        for (const variant of variants) {
          const { id, ...variantData } = variant;
          const inventoryData = {};
          Object.keys(variantData).forEach((key) => {
            if (key.startsWith("inventory_")) {
              inventoryData[key.replace("inventory_", "")] = variantData[key];
              delete variantData[key];
            }
          });
          const variantRef = doc(collection(newProductRef, "variants"));
          batch.set(variantRef, variantData);
          Object.entries(inventoryData).forEach(([branchId, stock]) => {
            const invRef = doc(variantRef, "inventory", branchId);
            batch.set(invRef, { stock: Number(stock) || 0 });
          });
        }
      }
      await batch.commit();
      toast.success("Lưu sản phẩm thành công!");
      setShowForm(false);
      setEditingProduct(null);
    } catch (error) {
      console.error("Lỗi khi lưu sản phẩm:", error.message);
      toast.error(
        `Lỗi lưu sản phẩm: ${error.message}. Vui lòng kiểm tra lại dữ liệu.`
      );
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleDelete = async (productId) => {
    if (!checkWritePermission()) return;
    if (window.confirm("Bạn có chắc muốn xóa sản phẩm này?")) {
      await deleteDoc(doc(db, "products", productId));
      toast.success("Xóa sản phẩm thành công!");
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
    if (!checkWritePermission()) return;
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

    const searchMatch =
      searchTerm === "" ||
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.sku &&
        product.sku.toLowerCase().includes(searchTerm.toLowerCase()));

    return brandMatch && categoryMatch && searchMatch;
  });

  const sortedProducts = React.useMemo(() => {
    let sortableItems = [...filteredProducts];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key === "price") {
          aValue = a.defaultVariantPrice ?? a.price;
          bValue = b.defaultVariantPrice ?? b.price;
        }

        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredProducts, sortConfig]);

  const handleExportExcel = async () => {
    if (sortedProducts.length === 0) {
      toast.warn("Không có sản phẩm nào để xuất.");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Danh sách sản phẩm");

    const headers = [
      { header: "ID Sản phẩm", key: "id", width: 25 },
      { header: "Tên sản phẩm", key: "name", width: 40 },
      { header: "Danh mục", key: "categoryName", width: 25 },
      { header: "Nhãn hiệu", key: "brandName", width: 25 },
      { header: "Giá", key: "price", width: 15 },
      { header: "Giá KM", key: "salePrice", width: 15 },
      { header: "Đang KM", key: "onSale", width: 10 },
    ];

    branches.forEach((branch) => {
      headers.push({
        header: `Tồn kho ${branch.branchName}`,
        key: `stock_${branch.id}`,
        width: 20,
      });
    });

    worksheet.columns = headers;

    sortedProducts.forEach((product) => {
      const row = {
        id: product.id,
        name: product.name,
        categoryName: categories[product.categoryId] || "N/A",
        brandName: brandsMap[product.brandId] || "N/A",
        price: product.defaultVariantPrice ?? product.price,
        salePrice: product.defaultVariantSalePrice ?? product.salePrice,
        onSale: product.defaultVariantOnSale ?? product.onSale ? "Có" : "Không",
      };
      branches.forEach((branch) => {
        row[`stock_${branch.id}`] = product.inventory?.[branch.id] || 0;
      });
      worksheet.addRow(row);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Danh_sach_san_pham.xlsx";
    link.click();
  };

  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const paginatedProducts = sortedProducts.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Quản lý Sản phẩm</h1>
        <div className="flex gap-2">
          {canWrite && (
            <>
              <button
                onClick={() => setShowExcelModal(true)}
                className="admin-button-blue"
              >
                <Upload size={18} className="mr-2" /> Nhập từ Excel
              </button>
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setShowForm(true);
                }}
                className="admin-button-green"
              >
                Thêm sản phẩm mới
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md mb-6 flex items-center gap-4 flex-wrap">
        <select
          value={selectedParentFilter}
          onChange={(e) => {
            setSelectedParentFilter(e.target.value);
            setCurrentPage(1);
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
          onChange={(e) => {
            setSelectedChildFilter(e.target.value);
            setCurrentPage(1);
          }}
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
          onChange={(e) => {
            setSelectedBrandFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="p-2 border rounded-md text-sm dark:bg-gray-700"
        >
          <option value="all">-- Lọc theo nhãn hiệu --</option>
          {brands.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.brandName}
            </option>
          ))}
        </select>
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Tìm theo tên hoặc SKU..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full p-2 pl-10 border rounded-md text-sm dark:bg-gray-700"
          />
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
        </div>
        <div className="ml-auto">
          <button onClick={handleExportExcel} className="admin-button-teal">
            <Download size={18} className="mr-2" />
            Xuất Excel
          </button>
        </div>
      </div>

      {selectedProducts.size > 0 && canWrite && (
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
          brands={branches}
        />
      )}

      {showExcelModal && (
        <ProductExcelUploadModal
          onCancel={() => setShowExcelModal(false)}
          onUploadSuccess={() => setShowExcelModal(false)}
        />
      )}

      <div className="admin-table-container mt-6">
        <div className="max-h-[60vh] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-100 dark:bg-gray-800">
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
                {canWrite && <th className="p-2 text-left">Hành động</th>}
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.map((p) => (
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
                          disabled={!canWrite}
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
                          {p.inventory?.[branch.id] ||
                            p.inventory?.default ||
                            0}
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
                      disabled={!canWrite}
                    />
                  </td>
                  {canWrite && (
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
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-6 space-x-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <ChevronLeft size={16} className="mr-1" /> Trang trước
          </button>
          <span className="font-semibold text-gray-700 dark:text-gray-300">
            Trang {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-green-600 text-white rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
          >
            Trang sau <ChevronRight size={16} className="ml-1" />
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
