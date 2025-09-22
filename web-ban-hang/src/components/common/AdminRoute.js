import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import Spinner from "./Spinner";

const AdminRoute = () => {
  const { user, userData, loading } = useAppContext();

  if (loading) {
    return <Spinner />; // Chờ cho đến khi thông tin người dùng được tải
  }

  if (!user || userData?.role !== "admin") {
    // Nếu không phải admin, chuyển hướng về trang chủ
    return <Navigate to="/" replace />;
  }

  return <Outlet />; // Nếu là admin, hiển thị component con
};

export default AdminRoute;
