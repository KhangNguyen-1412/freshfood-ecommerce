import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import { toast } from "react-toastify";
import Spinner from "../../components/common/Spinner";
import { Edit, Trash2 } from "lucide-react";
import "../../styles/admin.css";

const AdminBranchesPage = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    branchName: "",
    address: "",
    city: "",
    region: "",
    deliveryDistricts: "",
  });
  const [currentBranchId, setCurrentBranchId] = useState(null);

  useEffect(() => {
    const q = query(collection(db, "branches"), orderBy("branchName"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setBranches(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAddNew = () => {
    setIsEditing(false);
    setFormData({
      branchName: "",
      address: "",
      city: "",
      region: "",
      deliveryDistricts: "",
    });
    setShowForm(true);
  };

  const handleEdit = (branch) => {
    setIsEditing(true);
    setCurrentBranchId(branch.id);
    setFormData({
      branchName: branch.branchName,
      address: branch.address,
      city: branch.city,
      region: branch.region,
      deliveryDistricts: branch.deliveryDistricts
        ? branch.deliveryDistricts.join(", ")
        : "",
    });
    setShowForm(true);
  };

  const handleDelete = async (branchId) => {
    if (window.confirm("Bạn có chắc muốn xóa chi nhánh này?")) {
      await deleteDoc(doc(db, "branches", branchId));
      toast.success("Xóa chi nhánh thành công!");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.branchName || !formData.city) {
      return toast.error("Vui lòng điền Tên chi nhánh và Thành phố.");
    }

    try {
      const districtsArray = formData.deliveryDistricts
        .split(",")
        .map((d) => d.trim())
        .filter(Boolean);
      const dataToSave = {
        branchName: formData.branchName,
        address: formData.address,
        city: formData.city,
        region: formData.region,
        deliveryDistricts: districtsArray,
      };

      if (isEditing) {
        await updateDoc(doc(db, "branches", currentBranchId), dataToSave);
        toast.success("Cập nhật chi nhánh thành công!");
      } else {
        await addDoc(collection(db, "branches"), dataToSave);
        toast.success("Thêm chi nhánh mới thành công!");
      }
      setShowForm(false);
    } catch (error) {
      toast.error("Đã có lỗi xảy ra.");
      console.error("Lỗi khi lưu chi nhánh:", error);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Quản lý Chi nhánh</h1>
        {!showForm && (
          <button onClick={handleAddNew} className="admin-button-green">
            Thêm Chi nhánh Mới
          </button>
        )}
      </div>

      {showForm ? (
        <form onSubmit={handleSave} className="admin-form-container">
          <h2 className="text-2xl font-bold">
            {isEditing ? "Chỉnh sửa Chi nhánh" : "Tạo Chi nhánh Mới"}
          </h2>
          <input
            type="text"
            placeholder="Tên chi nhánh (ví dụ: FreshFood Cầu Giấy)"
            value={formData.branchName}
            onChange={(e) =>
              setFormData({ ...formData, branchName: e.target.value })
            }
            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
            required
          />
          <input
            type="text"
            placeholder="Địa chỉ"
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
          />
          <input
            type="text"
            placeholder="Thành phố"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
            required
          />
          <select
            value={formData.region}
            onChange={(e) =>
              setFormData({ ...formData, region: e.target.value })
            }
            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="">-- Chọn vùng miền --</option>
            <option value="Bắc">Bắc</option>
            <option value="Trung">Trung</option>
            <option value="Nam">Nam</option>
          </select>
          <textarea
            placeholder="Các quận/huyện phục vụ, cách nhau bởi dấu phẩy (ví dụ: Quận 1, Quận 3, Thủ Đức)"
            value={formData.deliveryDistricts}
            onChange={(e) =>
              setFormData({ ...formData, deliveryDistricts: e.target.value })
            }
            rows="3"
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
              Lưu Chi nhánh
            </button>
          </div>
        </form>
      ) : (
        <div className="admin-table-container">
          <table className="w-full">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="p-2 text-left">Tên Chi nhánh</th>
                <th className="p-2 text-left">Thành phố</th>
                <th className="p-2 text-left">Địa chỉ</th>
                <th className="p-2 text-left">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {branches.map((branch) => (
                <tr
                  key={branch.id}
                  className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="p-2 font-semibold">{branch.branchName}</td>
                  <td className="p-2">{branch.city}</td>
                  <td className="p-2">{branch.address}</td>
                  <td className="p-2 flex space-x-2">
                    <button
                      onClick={() => handleEdit(branch)}
                      className="text-blue-500"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(branch.id)}
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
      )}
    </div>
  );
};

export default AdminBranchesPage;
