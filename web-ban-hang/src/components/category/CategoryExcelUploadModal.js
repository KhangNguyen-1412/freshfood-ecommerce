// src/components/category/CategoryExcelUploadModal.js

import React, { useState } from "react";
import {
  collection,
  query,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";
import { X, Upload } from "lucide-react";
import "../../styles/category.css";

const CategoryExcelUploadModal = ({ onCancel, onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (
      selectedFile &&
      (selectedFile.type ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        selectedFile.type === "application/vnd.ms-excel")
    ) {
      setFile(selectedFile);
      setUploadStatus("");
    } else {
      toast.warn("Vui lòng chỉ chọn file Excel (.xlsx, .xls).");
    }
  };

  const handleUpload = async () => {
    if (!file) return toast.error("Vui lòng chọn một file Excel.");

    setIsUploading(true);
    setUploadStatus("Đang xử lý...");

    try {
      setUploadStatus("Đang lấy dữ liệu danh mục hiện tại...");
      const categoriesSnapshot = await getDocs(
        query(collection(db, "categories"))
      );
      const nameToIdMap = {};
      const existingNamesSet = new Set();
      categoriesSnapshot.docs.forEach((doc) => {
        const categoryName = doc.data().name.toLowerCase();
        nameToIdMap[categoryName] = doc.id;
        existingNamesSet.add(categoryName);
      });

      setUploadStatus("Đang đọc file Excel...");
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const categoriesToUpload = [];
        const errors = [];

        jsonData.forEach((row, index) => {
          const { name, parentName } = row;
          if (!name || typeof name !== "string" || name.trim() === "") {
            errors.push(`Dòng ${index + 2}: Cột 'name' không được để trống.`);
            return;
          }
          if (existingNamesSet.has(name.trim().toLowerCase())) {
            errors.push(`Dòng ${index + 2}: Danh mục '${name}' đã tồn tại.`);
            return;
          }

          let parentId = null;
          if (
            parentName &&
            typeof parentName === "string" &&
            parentName.trim() !== ""
          ) {
            const parentIdFound = nameToIdMap[parentName.trim().toLowerCase()];
            if (!parentIdFound) {
              errors.push(
                `Dòng ${
                  index + 2
                }: Không tìm thấy danh mục cha '${parentName}'.`
              );
              return;
            }
            parentId = parentIdFound;
          }
          categoriesToUpload.push({
            name: name.trim(),
            parentId: parentId,
            createdAt: serverTimestamp(),
          });
          existingNamesSet.add(name.trim().toLowerCase());
        });

        if (errors.length > 0) {
          toast.error(`Phát hiện lỗi:\n${errors.join("\n")}`);
          setIsUploading(false);
          return;
        }
        if (categoriesToUpload.length === 0) {
          toast.info("Không có danh mục mới nào để thêm.");
          setIsUploading(false);
          return;
        }

        setUploadStatus(
          `Chuẩn bị tải lên ${categoriesToUpload.length} danh mục...`
        );
        const uploadPromises = categoriesToUpload.map((cat) =>
          addDoc(collection(db, "categories"), cat)
        );
        await Promise.all(uploadPromises);

        toast.success(
          `Thành công! Đã thêm ${categoriesToUpload.length} danh mục mới.`
        );
        onUploadSuccess();
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      toast.error("Đã có lỗi nghiêm trọng xảy ra.");
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 animate-fade-in">
      <div className="excel-modal-panel">
        <button
          onClick={onCancel}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
        >
          <X size={24} />
        </button>
        <h2 className="excel-modal-title">Thêm danh mục từ file Excel</h2>
        <div className="excel-instructions">
          <p className="font-semibold">Hướng dẫn:</p>
          <ul className="list-disc list-inside">
            <li>File Excel phải có cột tiêu đề `name` (bắt buộc).</li>
            <li>Sử dụng cột `parentName` để chỉ định danh mục cha.</li>
            <li>Nếu `parentName` để trống, nó sẽ được tạo làm danh mục gốc.</li>
          </ul>
        </div>
        <div className="flex flex-col items-center">
          <input
            type="file"
            id="category-excel-upload"
            accept=".xlsx, .xls"
            onChange={handleFileChange}
            className="hidden"
          />
          <label htmlFor="category-excel-upload" className="excel-upload-label">
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
            {isUploading ? "Đang xử lý..." : "Bắt đầu tải lên"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryExcelUploadModal;
