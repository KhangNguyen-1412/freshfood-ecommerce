import React from "react";
import { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";

import Spinner from "../../components/common/Spinner";
import { Edit, Trash2 } from "lucide-react";
import "../../styles/admin.css";

const BrandExcelUploadModal = ({ onCancel, onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

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

        const batch = writeBatch(db);
        let count = 0;

        jsonData.forEach((row) => {
          if (row.brandName) {
            const newBrandRef = doc(collection(db, "brands"));
            batch.set(newBrandRef, {
              brandName: row.brandName,
              description: row.description || "",
              logoUrl: row.logoUrl || "",
            });
            count++;
          }
        });

        await batch.commit();
        toast.success(`Thêm thành công ${count} nhãn hiệu!`);
        onUploadSuccess();
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      toast.error("Đã có lỗi xảy ra.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-lg">
        <h2 className="text-2xl font-bold text-center mb-4">
          Thêm Nhãn hiệu từ Excel
        </h2>
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md text-sm mb-6">
          <p className="font-semibold">Cấu trúc file Excel:</p>
          <ul className="list-disc list-inside">
            <li>Cột `brandName` (bắt buộc).</li>
            <li>Cột `description` (tùy chọn).</li>
            <li>Cột `logoUrl` (tùy chọn).</li>
          </ul>
        </div>
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
            {isUploading ? "Đang tải lên..." : "Bắt đầu"}
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminBrandsPage = () => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentBrandId, setCurrentBrandId] = useState(null);
  const [formData, setFormData] = useState({
    brandName: "",
    description: "",
    logoUrl: "",
  });
  const [showExcelModal, setShowExcelModal] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "brands"), orderBy("brandName"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setBrands(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAddNew = () => {
    setIsEditing(false);
    setFormData({ brandName: "", description: "", logoUrl: "" });
    setShowForm(true);
  };

  const handleEdit = (brand) => {
    setIsEditing(true);
    setCurrentBrandId(brand.id);
    setFormData({
      brandName: brand.brandName,
      description: brand.description || "",
      logoUrl: brand.logoUrl || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (brandId) => {
    if (window.confirm("Bạn có chắc muốn xóa nhãn hiệu này?")) {
      await deleteDoc(doc(db, "brands", brandId));
      toast.success("Đã xóa nhãn hiệu.");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.brandName) return toast.error("Vui lòng nhập Tên nhãn hiệu.");
    try {
      if (isEditing) {
        await updateDoc(doc(db, "brands", currentBrandId), formData);
        toast.success("Cập nhật nhãn hiệu thành công!");
      } else {
        await addDoc(collection(db, "brands"), formData);
        toast.success("Thêm nhãn hiệu mới thành công!");
      }
      setShowForm(false);
    } catch (error) {
      toast.error("Đã có lỗi xảy ra.");
    }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Quản lý Nhãn hiệu</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowExcelModal(true)}
            className="admin-button-blue"
          >
            Thêm từ Excel
          </button>
          <button onClick={handleAddNew} className="admin-button-green">
            Thêm Mới
          </button>
        </div>
      </div>

      {showExcelModal && (
        <BrandExcelUploadModal
          onCancel={() => setShowExcelModal(false)}
          onUploadSuccess={() => setShowExcelModal(false)}
        />
      )}

      {showForm && (
        <form
          onSubmit={handleSave}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md space-y-4 mb-6"
        >
          <h2 className="text-2xl font-bold">
            {isEditing ? "Chỉnh sửa Nhãn hiệu" : "Tạo Nhãn hiệu Mới"}
          </h2>
          <input
            type="text"
            placeholder="Tên nhãn hiệu"
            value={formData.brandName}
            onChange={(e) =>
              setFormData({ ...formData, brandName: e.target.value })
            }
            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
            required
          />
          <textarea
            placeholder="Mô tả"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            rows="3"
            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
          />
          <input
            type="text"
            placeholder="URL logo"
            value={formData.logoUrl}
            onChange={(e) =>
              setFormData({ ...formData, logoUrl: e.target.value })
            }
            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
          />
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-md"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md"
            >
              Lưu
            </button>
          </div>
        </form>
      )}

      <div className="admin-table-container">
        <table className="w-full">
          <thead>
            <tr className="border-b dark:border-gray-700">
              <th className="p-2 text-left w-1/3">Nhãn hiệu</th>
              <th className="p-2 text-left w-1/2">Mô tả</th>
              <th className="p-2 text-left">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {brands.map((brand) => (
              <tr
                key={brand.id}
                className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td className="p-2 flex items-center gap-3">
                  <img
                    src={brand.logoUrl || "https://placehold.co/40"}
                    alt={brand.brandName}
                    className="w-10 h-10 object-contain rounded-md bg-gray-100"
                  />
                  <span className="font-semibold">{brand.brandName}</span>
                </td>
                <td className="p-2 text-sm">{brand.description}</td>
                <td className="p-2 flex space-x-2">
                  <button
                    onClick={() => handleEdit(brand)}
                    className="text-blue-500"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(brand.id)}
                    className="text-red-500"
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

export default AdminBrandsPage;
