import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import { toast } from "react-toastify";
import Spinner from "../../components/common/Spinner";
import { Edit, Trash2, Plus } from "lucide-react";

const availablePermissions = {
  products: "Quản lý Sản phẩm",
  orders: "Quản lý Đơn hàng",
  reviews: "Quản lý Bình luận",
  qna: "Quản lý Hỏi & Đáp",
  promotions: "Quản lý Khuyến mãi",
  content: "Quản lý Nội dung",
  purchases: "Quản lý Nhập kho",
  // Các quyền chỉ dành cho admin
  customers: "Quản lý Khách hàng",
  categories: "Quản lý Danh mục",
  branches: "Quản lý Chi nhánh",
  brands: "Quản lý Nhãn hiệu",
  reports: "Báo cáo",
  roles: "Phân quyền",
};

const AdminRolesPage = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({ name: "", permissions: {} });

  useEffect(() => {
    const q = query(collection(db, "roles"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRoles(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAddNew = () => {
    setEditingRole(null);
    setFormData({ name: "", permissions: {} });
    setShowForm(true);
  };

  const handleEdit = (role) => {
    setEditingRole(role);
    setFormData({ name: role.name, permissions: role.permissions || {} });
    setShowForm(true);
  };

  const handleDelete = async (roleId) => {
    if (window.confirm("Bạn có chắc muốn xóa vai trò này?")) {
      await deleteDoc(doc(db, "roles", roleId));
      toast.success("Đã xóa vai trò.");
    }
  };

  const handlePermissionChange = (permKey, checked) => {
    setFormData((prev) => {
      const newPermissions = { ...prev.permissions };
      if (checked) {
        newPermissions[permKey] = true;
      } else {
        delete newPermissions[permKey];
      }
      return { ...prev, permissions: newPermissions };
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name) return toast.error("Vui lòng nhập tên vai trò.");

    const roleId = editingRole
      ? editingRole.id
      : formData.name.toLowerCase().replace(/\s+/g, "_");
    const docRef = doc(db, "roles", roleId);

    try {
      await setDoc(docRef, formData, { merge: true });
      toast.success("Lưu vai trò thành công!");
      setShowForm(false);
    } catch (error) {
      toast.error("Đã có lỗi xảy ra.");
    }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Phân quyền Nhân viên</h1>
        <button onClick={handleAddNew} className="admin-button-green">
          <Plus size={18} className="mr-2" /> Thêm vai trò mới
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="admin-form-container">
          <h2 className="text-2xl font-bold">
            {editingRole ? "Chỉnh sửa Vai trò" : "Tạo Vai trò Mới"}
          </h2>
          <input
            type="text"
            placeholder="Tên vai trò (ví dụ: Quản lý kho)"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full p-2 border rounded-md dark:bg-gray-700"
            required
          />
          <h3 className="font-semibold mt-4">Chọn quyền cho vai trò này:</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(availablePermissions).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!formData.permissions[key]}
                  onChange={(e) =>
                    handlePermissionChange(key, e.target.checked)
                  }
                  className="h-4 w-4"
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-4 mt-4">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="admin-button-gray"
            >
              Hủy
            </button>
            <button type="submit" className="admin-button-green">
              Lưu Vai trò
            </button>
          </div>
        </form>
      )}

      <div className="admin-table-container">
        <table className="w-full">
          <thead>
            <tr className="border-b dark:border-gray-700">
              <th className="p-2 text-left">Tên Vai trò</th>
              <th className="p-2 text-left">Các quyền</th>
              <th className="p-2 text-left">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              <tr
                key={role.id}
                className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td className="p-2 font-semibold">{role.name}</td>
                <td className="p-2 text-sm">
                  {Object.keys(role.permissions || {})
                    .map((key) => availablePermissions[key])
                    .join(", ")}
                </td>
                <td className="p-2 flex space-x-2">
                  <button
                    onClick={() => handleEdit(role)}
                    className="text-blue-500"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(role.id)}
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

export default AdminRolesPage;
