import React from "react";
import { Link, useNavigate, useLocation, Outlet } from "react-router-dom";
import { signOut } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import { auth } from "../../firebase/config";
import { useAppContext } from "../../context/AppContext";
import {
  Shield,
  Leaf,
  Archive,
  MessageSquare,
  ShoppingCart,
  Tag,
  Users,
  Folder,
  BarChart,
  ArrowLeft,
  LogOut,
  FileText,
  HelpCircle,
  Building,
  Copyright,
  Mail,
  Package,
} from "lucide-react";
import "../../styles/layout.css";

const pageVariants = {
  initial: { opacity: 0, x: -50 },
  in: { opacity: 1, x: 0 },
  out: { opacity: 0, x: 50 },
};

const pageTransition = {
  type: "tween",
  ease: "circOut",
  duration: 0.3,
};

const AdminLayout = () => {
  const { userPermissions } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Lỗi đăng xuất:", error);
    }
  };

  const canAccess = (permissionKey) => {
    return userPermissions.isAdmin || userPermissions[permissionKey];
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <h2 className="admin-sidebar-title">Admin Panel</h2>
        <nav className="flex flex-col space-y-2 flex-grow overflow-y-auto">
          <Link to="/admin" className="admin-sidebar-button">
            <Shield size={18} className="mr-2" />
            Dashboard
          </Link>
          {canAccess("products") && (
            <Link to="/admin/products" className="admin-sidebar-button">
              <Leaf size={18} className="mr-2" />
              Quản lý Sản phẩm
            </Link>
          )}
          {canAccess("purchases") && (
            <Link to="/admin/purchases" className="admin-sidebar-button">
              <Archive size={18} className="mr-2" /> Quản lý Nhập kho
            </Link>
          )}
          {canAccess("reviews") && (
            <Link to="/admin/reviews" className="admin-sidebar-button">
              <MessageSquare size={18} className="mr-2" />
              Quản lý Bình luận
            </Link>
          )}
          {canAccess("qna") && (
            <Link to="/admin/qna" className="admin-sidebar-button">
              <HelpCircle size={18} className="mr-2" />
              Quản lý Hỏi & Đáp
            </Link>
          )}
          {canAccess("orders") && (
            <Link to="/admin/orders" className="admin-sidebar-button">
              <ShoppingCart size={18} className="mr-2" />
              Quản lý Đơn hàng
            </Link>
          )}
          {canAccess("promotions") && (
            <Link to="/admin/promotions" className="admin-sidebar-button">
              <Tag size={18} className="mr-2" />
              Quản lý Khuyến mãi
            </Link>
          )}
          {canAccess("combos") && ( // Giả sử có quyền 'combos'
            <Link to="/admin/combos" className="admin-sidebar-button">
              <Package size={18} className="mr-2" />
              Quản lý Combo
            </Link>
          )}
          {canAccess("content") && (
            <Link to="/admin/content" className="admin-sidebar-button">
              <FileText size={18} className="mr-2" />
              Quản lý Nội dung
            </Link>
          )}
          <Link to="/admin/newsletter" className="admin-sidebar-button">
            <Mail size={18} className="mr-2" />
            Email Marketing
          </Link>

          <div className="pt-2 mt-2 border-t border-gray-700"></div>
          {canAccess("customers") && (
            <Link to="/admin/customers" className="admin-sidebar-button">
              <Users size={18} className="mr-2" /> Quản lý Khách hàng
            </Link>
          )}
          {canAccess("roles") && (
            <Link to="/admin/roles" className="admin-sidebar-button">
              <Users size={18} className="mr-2" /> Phân quyền
            </Link>
          )}
          {canAccess("categories") && (
            <Link to="/admin/categories" className="admin-sidebar-button">
              <Folder size={18} className="mr-2" />
              Quản lý Danh mục
            </Link>
          )}
          {canAccess("branches") && (
            <Link to="/admin/branches" className="admin-sidebar-button">
              <Building size={18} className="mr-2" />
              Quản lý Chi nhánh
            </Link>
          )}
          {canAccess("brands") && (
            <Link to="/admin/brands" className="admin-sidebar-button">
              <Copyright size={18} className="mr-2" />
              Quản lý Nhãn hiệu
            </Link>
          )}
          {canAccess("reports") && (
            <Link to="/admin/reports" className="admin-sidebar-button">
              <BarChart size={18} className="mr-2" />
              Báo cáo
            </Link>
          )}
        </nav>
        <div className="flex flex-col space-y-2 pt-4 border-t border-gray-700">
          <Link
            to="/"
            className="p-2 rounded bg-green-600 hover:bg-green-700 text-left flex items-center"
          >
            <ArrowLeft size={18} className="mr-2" /> Về trang khách
          </Link>
          <button
            onClick={handleLogout}
            className="p-2 rounded bg-red-600 hover:bg-red-700 text-left flex items-center"
          >
            <LogOut size={18} className="mr-2" /> Đăng xuất
          </button>
        </div>
      </aside>
      <main className="admin-main-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default AdminLayout;
