import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  getDocs,
  doc,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import { toast } from "react-toastify";
import { X, Trash2, PlusCircle } from "lucide-react";
import { formatCurrency } from "../../utils/formatCurrency";
import "../../styles/purchase.css";
import "../../styles/common.css";

const PurchaseForm = ({ onCancel }) => {
  const [supplier, setSupplier] = useState("");
  const [items, setItems] = useState([
    { productId: "", productName: "", quantity: 1, purchasePrice: 0 },
  ]);
  const [products, setProducts] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      const snapshot = await getDocs(
        query(collection(db, "products"), orderBy("name"))
      );
      setProducts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };
    fetchProducts();
  }, []);

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    if (field === "productId") {
      const selectedProduct = products.find((p) => p.id === value);
      newItems[index].productName = selectedProduct ? selectedProduct.name : "";
    }
    setItems(newItems);
  };

  const addItem = () => {
    setItems([
      ...items,
      { productId: "", productName: "", quantity: 1, purchasePrice: 0 },
    ]);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const totalCost = items.reduce(
    (sum, item) => sum + Number(item.quantity) * Number(item.purchasePrice),
    0
  );

  const handleSavePurchase = async () => {
    setIsSaving(true);
    try {
      const validItems = items.filter(
        (item) => item.productId && item.quantity > 0
      );
      if (validItems.length === 0) {
        toast.error("Vui lòng thêm ít nhất một sản phẩm hợp lệ.");
        setIsSaving(false);
        return;
      }

      const batch = writeBatch(db);
      const purchaseRef = doc(collection(db, "purchases"));
      batch.set(purchaseRef, {
        supplier,
        items: validItems.map(
          ({ productId, productName, quantity, purchasePrice }) => ({
            productId,
            productName,
            quantity: Number(quantity),
            purchasePrice: Number(purchasePrice),
          })
        ),
        totalCost,
        createdAt: serverTimestamp(),
      });

      await batch.commit();
      toast.success("Lưu đơn nhập kho thành công!");
      onCancel();
    } catch (error) {
      console.error("Lỗi khi lưu đơn nhập kho:", error);
      toast.error("Đã có lỗi xảy ra.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
      <div className="purchase-form-panel">
        <button
          onClick={onCancel}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
        >
          <X size={24} />
        </button>
        <h2 className="purchase-form-title">Tạo đơn Nhập kho mới</h2>

        <input
          type="text"
          placeholder="Tên nhà cung cấp (tùy chọn)"
          value={supplier}
          onChange={(e) => setSupplier(e.target.value)}
          className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 mb-4"
        />

        <div className="flex-grow overflow-y-auto pr-2">
          {items.map((item, index) => (
            <div key={index} className="purchase-form-input-row">
              <select
                value={item.productId}
                onChange={(e) =>
                  handleItemChange(index, "productId", e.target.value)
                }
                className="col-span-5 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="">-- Chọn sản phẩm --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Số lượng"
                value={item.quantity}
                onChange={(e) =>
                  handleItemChange(index, "quantity", e.target.value)
                }
                className="col-span-2 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                min="1"
              />
              <input
                type="number"
                placeholder="Giá nhập"
                value={item.purchasePrice}
                onChange={(e) =>
                  handleItemChange(index, "purchasePrice", e.target.value)
                }
                className="col-span-3 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                min="0"
              />
              <button
                onClick={() => removeItem(index)}
                className="col-span-2 text-red-500 hover:text-red-700 flex justify-center"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))}
        </div>

        <button onClick={addItem} className="purchase-form-add-button">
          <PlusCircle size={18} className="mr-1" />
          Thêm sản phẩm
        </button>

        <div className="border-t dark:border-gray-700 pt-4 mt-auto">
          <p className="text-xl font-bold text-right mb-4">
            Tổng chi phí: {formatCurrency(totalCost)}
          </p>
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-md"
            >
              Hủy
            </button>
            <button
              onClick={handleSavePurchase}
              disabled={isSaving}
              className="btn btn-primary disabled:bg-gray-400"
            >
              {isSaving ? "Đang lưu..." : "Lưu đơn nhập kho"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseForm;
