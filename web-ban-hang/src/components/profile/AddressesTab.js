import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  onSnapshot,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import { PlusCircle } from "lucide-react";

const AddressesTab = ({ user, onAddAddress, onEditAddress }) => {
  const [addresses, setAddresses] = useState([]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "users", user.uid, "addresses"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAddresses(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  const handleDeleteAddress = async (addressId) => {
    if (window.confirm("Bạn có chắc muốn xóa địa chỉ này?")) {
      await deleteDoc(doc(db, "users", user.uid, "addresses", addressId));
    }
  };

  return (
    <div className="page-section">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Sổ địa chỉ</h2>
        <button
          onClick={onAddAddress} // Gọi hàm từ props
          className="flex items-center text-green-600 hover:underline"
        >
          <PlusCircle size={18} className="mr-1" /> Thêm địa chỉ mới
        </button>
      </div>
      <div className="space-y-4">
        {addresses.length > 0 ? (
          addresses.map((addr) => (
            <div key={addr.id} className="border-t dark:border-gray-700 pt-4">
              <p className="font-semibold">
                {addr.name} - {addr.phone}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {addr.address}
              </p>
              <div className="flex space-x-4 mt-2">
                <button
                  onClick={() => onEditAddress(addr)}
                  className="text-sm text-blue-500"
                >
                  Sửa
                </button>
                <button
                  onClick={() => handleDeleteAddress(addr.id)}
                  className="text-sm text-red-500"
                >
                  Xóa
                </button>
              </div>
            </div>
          ))
        ) : (
          <p>Bạn chưa có địa chỉ nào được lưu.</p>
        )}
      </div>
    </div>
  );
};

export default AddressesTab;
