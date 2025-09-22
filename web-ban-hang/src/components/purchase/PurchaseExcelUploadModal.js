import React, { useState, useEffect } from "react";
import {
  collection,
  writeBatch,
  doc,
  serverTimestamp,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import { toast } from "react-toastify";
import * as ExcelJS from "exceljs";
import { X } from "lucide-react";

const PurchaseExcelUploadModal = ({ onCancel, onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [categoriesMap, setCategoriesMap] = useState({});
  const [brandsMap, setBrandsMap] = useState({});

  useEffect(() => {
    const fetchMaps = async () => {
      const catSnapshot = await getDocs(collection(db, "categories"));
      const bSnapshot = await getDocs(collection(db, "brands"));
      setCategoriesMap(
        catSnapshot.docs.reduce((map, doc) => {
          map[doc.data().name.toLowerCase()] = doc.id;
          return map;
        }, {})
      );
      setBrandsMap(
        bSnapshot.docs.reduce((map, doc) => {
          map[doc.data().brandName.toLowerCase()] = doc.id;
          return map;
        }, {})
      );
    };
    fetchMaps();
  }, []);

  const handleUpload = async () => {
    if (!file) return toast.error("Vui lòng chọn một file Excel.");
    setIsUploading(true);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(e.target.result);
        const worksheet = workbook.worksheets[0];

        const rows = [];
        worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
          if (rowNumber > 1) {
            // Bỏ qua dòng header
            const rowData = {};
            row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
              const headerCell = worksheet.getCell(1, colNumber);
              rowData[headerCell.value] = cell.value;
            });
            rows.push(rowData);
          }
        });

        const productsToCreate = new Map();
        rows.forEach((row) => {
          const groupId = row.product_group_id;
          if (!groupId) return;

          if (!productsToCreate.has(groupId)) {
            productsToCreate.set(groupId, {
              mainData: {
                name: row.product_name,
                description: row.description || "",
                categoryId:
                  categoriesMap[row.category_name?.toLowerCase()] || null,
                brandId: brandsMap[row.brand_name?.toLowerCase()] || null,
                imageUrls: [
                  row.product_image_url_1,
                  row.product_image_url_2,
                  row.product_image_url_3,
                ].filter(Boolean),
                purchaseCount: 0,
                createdAt: serverTimestamp(),
              },
              variants: [],
            });
          }

          const variant = {
            name: row.variant_name,
            price: Number(row.price) || 0,
            salePrice: Number(row.sale_price) || 0,
            onSale:
              row.on_sale === true ||
              String(row.on_sale).toLowerCase() === "true",
            sku: row.sku || "",
            imageUrl: row.variant_image_url || "",
            isDefault:
              row.is_default_variant === true ||
              String(row.is_default_variant).toLowerCase() === "true",
            inventory: {},
          };

          Object.keys(row).forEach((key) => {
            if (key.startsWith("stock_")) {
              const branchId = key.replace("stock_", "");
              variant.inventory[branchId] = Number(row[key]) || 0;
            }
          });

          productsToCreate.get(groupId).variants.push(variant);
        });

        const batch = writeBatch(db);
        for (const [_, product] of productsToCreate.entries()) {
          const productRef = doc(collection(db, "products"));
          let defaultVariantId = null;

          // Tạo các biến thể trước để lấy ID
          const variantRefs = product.variants.map((variant) => {
            const variantRef = doc(collection(productRef, "variants"));
            if (variant.isDefault) {
              defaultVariantId = variantRef.id;
            }
            const { isDefault, inventory, ...variantData } = variant;
            batch.set(variantRef, variantData);
            // Lưu tồn kho
            Object.entries(inventory).forEach(([branchId, stock]) => {
              const invRef = doc(variantRef, "inventory", branchId);
              batch.set(invRef, { stock });
            });
            return variantRef;
          });

          if (!defaultVariantId && variantRefs.length > 0) {
            defaultVariantId = variantRefs[0].id;
          }

          batch.set(productRef, { ...product.mainData, defaultVariantId });
        }

        await batch.commit();
        toast.success(`Đã nhập thành công ${productsToCreate.size} sản phẩm!`);
        onUploadSuccess();
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error("Lỗi khi xử lý file Excel:", error);
      toast.error("Đã có lỗi xảy ra khi xử lý file.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-lg">
        <h2 className="text-2xl font-bold text-center mb-4">
          Thêm Sản phẩm từ Excel
        </h2>
        <p className="text-sm text-center text-gray-500 mb-6">
          Tải lên file theo mẫu đã được cung cấp.
        </p>
        <input
          type="file"
          accept=".xlsx, .xls"
          onChange={(e) => setFile(e.target.files[0])}
          className="w-full border p-2 rounded-md dark:bg-gray-700 dark:border-gray-600"
        />
        <div className="flex justify-end mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded mr-2"
          >
            Hủy
          </button>
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="px-6 py-2 bg-green-600 text-white rounded-md disabled:bg-gray-400"
          >
            {isUploading ? "Đang xử lý..." : "Bắt đầu nhập"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PurchaseExcelUploadModal;
