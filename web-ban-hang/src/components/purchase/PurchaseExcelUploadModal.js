import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  getDocs,
  where,
  limit,
  doc,
  writeBatch,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";
import { X, Upload } from "lucide-react";
import "../../styles/purchase.css";
import "../../styles/category.css";

const PurchaseExcelUploadModal = ({ onCancel, onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [branches, setBranches] = useState([]);

  useEffect(() => {
    const fetchBranches = async () => {
      const snapshot = await getDocs(collection(db, "branches"));
      setBranches(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };
    fetchBranches();
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file || branches.length === 0) {
      toast.error("Vui lòng chọn file Excel và đảm bảo đã có chi nhánh.");
      return;
    }
    setIsUploading(true);
    setUploadStatus("Bắt đầu xử lý...");

    try {
      const categoriesSnapshot = await getDocs(collection(db, "categories"));
      const categoryMap = categoriesSnapshot.docs.reduce((map, doc) => {
        map[doc.data().name.toLowerCase()] = doc.id;
        return map;
      }, {});

      const reader = new FileReader();
      reader.onload = async (e) => {
        const workbook = XLSX.read(new Uint8Array(e.target.result), {
          type: "array",
        });
        const jsonData = XLSX.utils.sheet_to_json(
          workbook.Sheets[workbook.SheetNames[0]]
        );

        const batch = writeBatch(db);
        let totalCost = 0;
        const purchaseItems = [];

        setUploadStatus(`Đang xử lý ${jsonData.length} dòng...`);

        for (const row of jsonData) {
          const productName = row.name;
          const categoryName = row.categoryName;
          const purchasePrice = row.purchasePrice;

          if (!productName || !categoryName || isNaN(purchasePrice)) continue;

          let productId;
          const productQuery = query(
            collection(db, "products"),
            where("name", "==", productName),
            limit(1)
          );
          const productSnapshot = await getDocs(productQuery);

          if (productSnapshot.empty) {
            const categoryId = categoryMap[categoryName.toLowerCase()];
            if (!categoryId) {
              console.warn(
                `Bỏ qua sản phẩm "${productName}" vì không tìm thấy danh mục "${categoryName}"`
              );
              continue;
            }

            const imageUrls = [row.imageUrl1, row.imageUrl2].filter(Boolean);

            const newProductRef = doc(collection(db, "products"));
            productId = newProductRef.id;

            batch.set(newProductRef, {
              name: productName,
              categoryId: categoryId,
              price: Number(purchasePrice) * 1.2,
              imageUrls: imageUrls,
              thumbnailUrl: imageUrls[0] || "",
              description: row.description || "",
              createdAt: serverTimestamp(),
              onSale: false,
            });
          } else {
            productId = productSnapshot.docs[0].id;
          }

          let totalQuantityAdded = 0;
          branches.forEach((branch) => {
            const stockColumnName = `stock_${branch.id}`;
            const stockValue = row[stockColumnName];
            if (stockValue !== undefined && !isNaN(stockValue)) {
              const quantity = Number(stockValue);
              totalQuantityAdded += quantity;
              const inventoryRef = doc(
                db,
                "products",
                productId,
                "inventory",
                branch.id
              );
              batch.set(
                inventoryRef,
                { stock: increment(quantity) },
                { merge: true }
              );
            }
          });

          if (totalQuantityAdded > 0) {
            purchaseItems.push({
              productId: productId,
              productName: productName,
              quantity: totalQuantityAdded,
              purchasePrice: Number(purchasePrice),
            });
            totalCost += totalQuantityAdded * Number(purchasePrice);
          }
        }

        if (purchaseItems.length > 0) {
          const purchaseRef = doc(collection(db, "purchases"));
          batch.set(purchaseRef, {
            items: purchaseItems,
            totalCost: totalCost,
            createdAt: serverTimestamp(),
            supplier: "Nhập từ file Excel",
          });
        }

        await batch.commit();
        toast.success(`Thành công! Đã xử lý ${purchaseItems.length} mặt hàng.`);
        onUploadSuccess();
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      toast.error(`Đã có lỗi xảy ra: ${error.message}`);
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
      <div className="purchase-excel-panel">
        <button
          onClick={onCancel}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
        >
          <X size={24} />
        </button>
        <h2 className="purchase-excel-title">Nhập kho từ file Excel</h2>
        <div className="excel-instructions">
          <p className="font-semibold">Cấu trúc file Excel:</p>
          <ul className="list-disc list-inside">
            <li>Cột bắt buộc: `name`, `categoryName`, `purchasePrice`.</li>
            <li>Cột tùy chọn: `description`, `imageUrl1`, `imageUrl2`.</li>
            <li>
              Thêm các cột tồn kho cho mỗi chi nhánh với định dạng: `stock_[ID
              của chi nhánh]`.
            </li>
            <li>Ví dụ: `stock_MbVot70pSkGBNqwCCHTu`.</li>
          </ul>
        </div>
        <div className="flex flex-col items-center">
          <input
            type="file"
            id="purchase-excel-upload"
            accept=".xlsx, .xls"
            onChange={handleFileChange}
            className="hidden"
          />
          <label htmlFor="purchase-excel-upload" className="excel-upload-label">
            <Upload size={20} className="mr-2" /> Chọn file Excel
          </label>
          {file && <p className="mt-2 text-sm text-gray-500">{file.name}</p>}
        </div>
        {uploadStatus && (
          <p className="mt-4 text-center text-sm whitespace-pre-wrap">
            {uploadStatus}
          </p>
        )}
        <div className="flex justify-end mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 rounded mr-2"
          >
            Hủy
          </button>
          <button
            onClick={handleUpload}
            disabled={isUploading || !file}
            className="px-6 py-2 bg-green-600 text-white rounded-md disabled:bg-gray-400"
          >
            {isUploading ? "Đang xử lý..." : "Bắt đầu nhập kho"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PurchaseExcelUploadModal;
