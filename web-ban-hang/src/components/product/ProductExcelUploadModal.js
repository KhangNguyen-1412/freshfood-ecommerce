import React, { useState, useEffect } from "react";
import {
  collection,
  writeBatch,
  doc,
  serverTimestamp,
  query,
  getDocs,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import Spinner from "../common/Spinner";

const ProductExcelUploadModal = ({ onCancel, onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [categoriesMap, setCategoriesMap] = useState({});
  const [brandsMap, setBrandsMap] = useState({});
  const [branches, setBranches] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const categoriesSnapshot = await getDocs(collection(db, "categories"));
      const catMap = categoriesSnapshot.docs.reduce((acc, doc) => {
        acc[doc.data().name.toLowerCase()] = doc.id;
        return acc;
      }, {});
      setCategoriesMap(catMap);

      const brandsSnapshot = await getDocs(collection(db, "brands"));
      const brandMap = brandsSnapshot.docs.reduce((acc, doc) => {
        acc[doc.data().brandName.toLowerCase()] = doc.id;
        return acc;
      }, {});
      setBrandsMap(brandMap);

      const branchesSnapshot = await getDocs(collection(db, "branches"));
      setBranches(
        branchesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
    };
    fetchData();
  }, []);

  const handleUpload = async () => {
    if (!file) return toast.error("Vui lòng chọn một file Excel.");
    setIsUploading(true);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const workbook = XLSX.read(new Uint8Array(e.target.result), {
          type: "array",
        });
        const jsonData = XLSX.utils.sheet_to_json(
          workbook.Sheets[workbook.SheetNames[0]]
        );

        const productsGrouped = jsonData.reduce((acc, row) => {
          const groupId = row.product_group_id;
          if (!acc[groupId]) {
            acc[groupId] = [];
          }
          acc[groupId].push(row);
          return acc;
        }, {});

        const batch = writeBatch(db);
        let productCount = 0;

        for (const groupId in productsGrouped) {
          const variants = productsGrouped[groupId];
          const firstVariant = variants[0];

          const productRef = doc(collection(db, "products"));
          const categoryId =
            categoriesMap[firstVariant.category_name?.toLowerCase()] || null;
          const brandId =
            brandsMap[firstVariant.brand_name?.toLowerCase()] || null;

          const productData = {
            name: firstVariant.product_name,
            description: firstVariant.description || "",
            categoryId: categoryId,
            brandId: brandId,
            imageUrls: [
              firstVariant.product_image_url_1 || "",
              firstVariant.product_image_url_2 || "",
              firstVariant.product_image_url_3 || "",
            ].filter(Boolean),
            createdAt: serverTimestamp(),
            purchaseCount: 0,
          };

          let defaultVariantDocId = null;

          for (const variantRow of variants) {
            const variantRef = doc(collection(productRef, "variants"));
            const variantData = {
              name: variantRow.variant_name,
              price: Number(variantRow.price) || 0,
              salePrice: Number(variantRow.sale_price) || 0,
              onSale:
                String(variantRow.on_sale).toLowerCase() === "yes" ||
                String(variantRow.on_sale).toLowerCase() === "có",
              sku: variantRow.sku || "",
              imageUrl: variantRow.variant_image_url || "",
            };
            batch.set(variantRef, variantData);

            if (
              String(variantRow.is_default_variant).toLowerCase() === "yes" ||
              String(variantRow.is_default_variant).toLowerCase() === "có"
            ) {
              defaultVariantDocId = variantRef.id;
            }

            branches.forEach((branch) => {
              const stockKey = `stock_${branch.branchName.replace(
                /\s+/g,
                "_"
              )}`;
              if (variantRow[stockKey] !== undefined) {
                const inventoryRef = doc(variantRef, "inventory", branch.id);
                batch.set(inventoryRef, {
                  stock: Number(variantRow[stockKey]) || 0,
                });
              }
            });
          }

          productData.defaultVariantId =
            defaultVariantDocId ||
            (await (
              await getDocs(collection(productRef, "variants"))
            ).docs[0]?.id);
          batch.set(productRef, productData);
          productCount++;
        }

        await batch.commit();
        toast.success(`Thêm thành công ${productCount} sản phẩm!`);
        onUploadSuccess();
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error("Lỗi khi nhập sản phẩm:", error);
      toast.error("Đã có lỗi xảy ra khi nhập sản phẩm.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-[60]">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-lg">
        <h2 className="text-2xl font-bold text-center mb-4">
          Nhập sản phẩm từ Excel
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Sử dụng file mẫu được tải từ trang "Quản lý Danh mục" để đảm bảo đúng
          định dạng.
        </p>
        <input
          type="file"
          accept=".xlsx, .xls"
          onChange={(e) => setFile(e.target.files[0])}
          className="w-full border p-2 rounded-md dark:bg-gray-700 dark:border-gray-600"
        />
        <div className="flex justify-end mt-6 gap-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-md"
          >
            Hủy
          </button>
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="px-6 py-2 bg-green-600 text-white rounded-md disabled:bg-gray-400 flex items-center"
          >
            {isUploading && <Spinner size="sm" />}
            {isUploading ? "Đang xử lý..." : "Bắt đầu nhập"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductExcelUploadModal;
