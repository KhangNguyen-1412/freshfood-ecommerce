import React from "react";
import { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import { toast } from "react-toastify";
import Spinner from "../../components/common/Spinner";
import { Edit, Trash2 } from "lucide-react";
import "../../styles/admin.css";

const AdminContentPage = () => {
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingContent, setEditingContent] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    type: "policy",
    content: "",
  });

  useEffect(() => {
    const q = query(collection(db, "content"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setContents(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleEdit = (content) => {
    setEditingContent(content);
    setFormData(content);
    setShowForm(true);
  };

  const handleAddNew = () => {
    setEditingContent(null);
    setFormData({ title: "", slug: "", type: "policy", content: "" });
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.slug || !formData.content) {
      return toast.error("Vui lòng điền đầy đủ các trường bắt buộc.");
    }

    try {
      // Dùng slug làm ID của document để đảm bảo tính duy nhất và dễ truy vấn
      const docRef = doc(db, "content", formData.slug);
      const dataToSave = {
        ...formData,
        updatedAt: serverTimestamp(),
      };
      if (!editingContent) {
        dataToSave.createdAt = serverTimestamp();
      }

      await setDoc(docRef, dataToSave, { merge: true });
      toast.success("Lưu nội dung thành công!");
      setShowForm(false);
    } catch (error) {
      toast.error("Đã có lỗi xảy ra.");
      console.error("Lỗi lưu nội dung:", error);
    }
  };

  const handleDelete = async (contentSlug) => {
    if (window.confirm("Bạn có chắc muốn xóa nội dung này?")) {
      await deleteDoc(doc(db, "content", contentSlug));
      toast.success("Xóa nội dung thành công!");
    }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Quản lý Nội dung</h1>
        <button onClick={handleAddNew} className="admin-button-green">
          Thêm Nội dung Mới
        </button>
      </div>
      {showForm ? (
        <form onSubmit={handleSave} className="admin-form-container">
          <h2 className="text-2xl font-bold">
            {editingContent ? "Chỉnh sửa Nội dung" : "Tạo Nội dung Mới"}
          </h2>
          <input
            type="text"
            placeholder="Tiêu đề"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
            required
          />
          <input
            type="text"
            placeholder="URL (slug, ví dụ: chinh-sach-doi-tra)"
            value={formData.slug}
            onChange={(e) =>
              setFormData({
                ...formData,
                slug: e.target.value.toLowerCase().replace(/\s+/g, "-"),
              })
            }
            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
            required
            disabled={!!editingContent}
          />
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="policy">Chính sách (Policy)</option>
            <option value="faq">Câu hỏi (FAQ)</option>
            <option value="blog">Bài viết (Blog)</option>
          </select>
          <textarea
            placeholder="Nội dung chi tiết..."
            value={formData.content}
            onChange={(e) =>
              setFormData({ ...formData, content: e.target.value })
            }
            rows="10"
            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
            required
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
      ) : (
        <div className="admin-table-container">
          <table className="w-full">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="p-2 text-left">Tiêu đề</th>
                <th className="p-2 text-left">Loại</th>
                <th className="p-2 text-left">URL (Slug)</th>
                <th className="p-2 text-left">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {contents.map((content) => (
                <tr
                  key={content.id}
                  className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="p-2 font-semibold">{content.title}</td>
                  <td className="p-2">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        content.type === "faq"
                          ? "bg-blue-100 text-blue-800"
                          : content.type === "policy"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {content.type.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-2 font-mono text-sm text-gray-500">
                    {content.slug}
                  </td>
                  <td className="p-2 flex space-x-2">
                    <button
                      onClick={() => handleEdit(content)}
                      className="text-blue-500"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(content.slug)}
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

export default AdminContentPage;
