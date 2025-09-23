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
import { db } from "../../firebase/config";
import { toast } from "react-toastify";
import Spinner from "../../components/common/Spinner";
import ComboForm from "../../components/combo/ComboForm";
import { formatCurrency } from "../../utils/formatCurrency";
import { Edit, Trash2, PackagePlus } from "lucide-react";

const AdminCombosPage = () => {
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCombo, setEditingCombo] = useState(null);
  const [products, setProducts] = useState([]);

  useEffect(() => {
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
  }, []);

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

  if (loading) return <Spinner />;

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
            {combos.map((combo) => (
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
                  {formatCurrency(combo.totalPrice)}
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
