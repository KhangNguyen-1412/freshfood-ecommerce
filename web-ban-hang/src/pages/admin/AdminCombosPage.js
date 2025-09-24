import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  onSnapshot,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useAppContext } from "../../context/AppContext";
import { db } from "../../firebase/config";
import { toast } from "react-toastify";
import Spinner from "../../components/common/Spinner";
import ComboForm from "../../components/combo/ComboForm";
import { formatCurrency } from "../../utils/formatCurrency";
import { Edit, Trash2, PackagePlus, Search } from "lucide-react";

const AdminCombosPage = () => {
  const { userPermissions } = useAppContext();
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCombo, setEditingCombo] = useState(null);
  const [products, setProducts] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all"); // State mới cho bộ lọc
  const [searchTerm, setSearchTerm] = useState(""); // State mới cho tìm kiếm

  useEffect(() => {
    // KIỂM TRA QUYỀN TRƯỚC KHI TRUY VẤN
    if (!userPermissions.isAdmin && !userPermissions.combos) {
      toast.error("Bạn không có quyền truy cập chức năng này.");
      setLoading(false);
      return;
    }
    setLoading(true);

    const qCombos = query(collection(db, "combos"));
    const unsubCombos = onSnapshot(qCombos, (snapshot) => {
      setCombos(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    const qProducts = query(collection(db, "products"));
    const unsubProducts = onSnapshot(qProducts, async (snapshot) => {
      const productsData = await Promise.all(
        snapshot.docs.map(async (productDoc) => {
          const variantsSnapshot = await getDocs(
            collection(productDoc.ref, "variants")
          );
          const variants = variantsSnapshot.docs.map((variantDoc) => ({
            id: variantDoc.id,
            ...variantDoc.data(),
          }));
          return { id: productDoc.id, ...productDoc.data(), variants };
        })
      );
      setProducts(productsData);
    });

    return () => {
      unsubCombos();
      unsubProducts();
    };
  }, [userPermissions]);

  const handleSaveCombo = async (comboData) => {
    try {
      const { id, ...data } = comboData;
      const docRef = id ? doc(db, "combos", id) : doc(collection(db, "combos"));
      const productIds = data.products.map((p) => p.productId);

      await setDoc(
        docRef,
        {
          ...data,
          productIds: productIds, // Thêm mảng ID sản phẩm để dễ truy vấn
          updatedAt: serverTimestamp(),
          ...(id ? {} : { createdAt: serverTimestamp() }),
        },
        { merge: true }
      );

      toast.success("Lưu combo thành công!");
      setShowForm(false);
      setEditingCombo(null);
    } catch (error) {
      console.error("Lỗi khi lưu combo:", error);
      toast.error("Đã có lỗi xảy ra khi lưu combo.");
    }
  };

  const handleEdit = (combo) => {
    setEditingCombo(combo);
    setShowForm(true);
  };

  const handleDelete = async (comboId) => {
    if (window.confirm("Bạn có chắc muốn xóa combo này?")) {
      await deleteDoc(doc(db, "combos", comboId));
      toast.success("Đã xóa combo.");
    }
  };

  // Hiển thị Spinner hoặc thông báo lỗi nếu không có quyền
  if (loading) {
    return <Spinner />;
  } else if (!userPermissions.isAdmin && !userPermissions.combos) {
    return (
      <div className="p-4 text-red-500">
        Bạn không có quyền truy cập trang này.
      </div>
    );
  }

  // Lọc combo dựa trên trạng thái đã chọn
  const filteredCombos = combos.filter((combo) => {
    const statusMatch =
      statusFilter === "all" ||
      (statusFilter === "active"
        ? combo.isActive === true
        : combo.isActive === false);

    const searchMatch =
      searchTerm === "" ||
      combo.name.toLowerCase().includes(searchTerm.toLowerCase());

    return statusMatch && searchMatch;
  });

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Quản lý Combo Sản phẩm</h1>
        <button
          onClick={() => {
            setEditingCombo(null);
            setShowForm(true);
          }}
          className="admin-button-green"
        >
          <PackagePlus size={18} className="mr-2" /> Tạo Combo Mới
        </button>
      </div>

      {showForm && (
        <ComboForm
          combo={editingCombo}
          products={products}
          onSave={handleSaveCombo}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md mb-6 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label htmlFor="status-filter" className="font-semibold text-sm">
            Trạng thái:
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 border rounded-md text-sm dark:bg-gray-700"
          >
            <option value="all">Tất cả</option>
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Tạm ẩn</option>
          </select>
        </div>
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Tìm theo tên combo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 pl-10 border rounded-md text-sm dark:bg-gray-700"
          />
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
        </div>
      </div>

      <div className="admin-table-container">
        <table className="w-full">
          <thead>
            <tr className="border-b dark:border-gray-700">
              <th className="p-2 text-left">Tên Combo</th>
              <th className="p-2 text-left">Giá Combo</th>
              <th className="p-2 text-left">Số lượng sản phẩm</th>
              <th className="p-2 text-center">Trạng thái</th>
              <th className="p-2 text-left">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filteredCombos.map((combo) => (
              <tr
                key={combo.id}
                className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td className="p-2 flex items-center gap-3">
                  <img
                    src={combo.imageUrl || "https://placehold.co/60"}
                    alt={combo.name}
                    className="w-12 h-12 object-cover rounded-md"
                  />
                  <span className="font-semibold">{combo.name}</span>
                </td>
                <td className="p-2 font-semibold text-green-600">
                  {formatCurrency(combo.totalPrice || 0)}
                </td>
                <td className="p-2">{combo.products?.length || 0}</td>
                <td className="p-2 text-center">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      combo.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {combo.isActive ? "Đang hoạt động" : "Tạm ẩn"}
                  </span>
                </td>
                <td className="p-2 flex space-x-2">
                  <button
                    onClick={() => handleEdit(combo)}
                    className="text-blue-500"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(combo.id)}
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

export default AdminCombosPage;
