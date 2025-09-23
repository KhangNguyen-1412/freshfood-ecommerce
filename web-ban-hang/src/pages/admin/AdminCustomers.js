import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db, auth } from "../../firebase/config";
import { toast } from "react-toastify";
import Spinner from "../../components/common/Spinner";
import { useAppContext } from "../../context/AppContext";
import "../../styles/admin.css";

const AdminCustomers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState([]);
  const { setPage } = useAppContext();

  useEffect(() => {
    if (!auth.currentUser) return;

    const qRoles = query(collection(db, "roles"));
    const unsubRoles = onSnapshot(qRoles, (snapshot) => {
      setRoles(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    const qUsers = query(
      collection(db, "users"),
      where("__name__", "!=", auth.currentUser.uid)
    );
    const unsubUsers = onSnapshot(
      qUsers,
      (snapshot) => {
        setUsers(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      },
      (error) => {
        console.error("Lỗi khi tải danh sách người dùng:", error);
        setLoading(false);
      }
    );
    return () => {
      unsubRoles();
      unsubUsers();
    };
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    const userRef = doc(db, "users", userId);
    try {
      await updateDoc(userRef, { role: newRole });
      toast.success("Cập nhật vai trò thành công!");
    } catch (error) {
      toast.error("Cập nhật vai trò thất bại.");
      console.error("Lỗi khi cập nhật vai trò:", error);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <h1 className="admin-page-title">Quản lý Người dùng</h1>
      <div className="admin-table-container">
        <table className="w-full">
          <thead>
            <tr className="border-b dark:border-gray-700">
              <th className="p-2 text-left">Tên hiển thị</th>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">Ngày tham gia</th>
              <th className="p-2 text-left">Vai trò</th>
              <th className="p-2 text-left">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td className="p-2">{user.displayName}</td>
                <td className="p-2">{user.email}</td>
                <td className="p-2">
                  {user.createdAt
                    ? new Date(user.createdAt.toDate()).toLocaleDateString(
                        "vi-VN"
                      )
                    : "N/A"}
                </td>
                <td className="p-2">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    className="p-1 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value="customer">Khách hàng</option>
                    <option value="admin">Quản trị viên</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-2">
                  <button
                    onClick={() =>
                      setPage({ name: "admin-customer-details", data: user })
                    }
                    className="text-blue-500 hover:underline text-sm"
                  >
                    Xem lịch sử
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

export default AdminCustomers;
