// src/App.js

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AppProvider, useAppContext } from "./context/AppContext";
import { Routes, Route, Navigate, useParams } from "react-router-dom";

// Import Layouts
// import Header from "./components/layout/Header";
// import Footer from "./components/layout/Footer";
import UserLayout from "./components/layout/UserLayout"; // Import UserLayout mới
import AdminLayout from "./components/layout/AdminLayout";

// Import common components
import Spinner from "./components/common/Spinner";
import AdminRoute from "./components/common/AdminRoute";
import BranchSelector from "./pages/BranchSelector";

// Import Customer Pages
import HomePage from "./pages/HomePage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import ProfilePage from "./pages/ProfilePage";
// import OrderDetailPage from "./pages/OrderDetailPage";
// import ReviewOrderPage from "./pages/ReviewOrderPage";
import FaqPage from "./pages/FaqPage";
import ContentPage from "./pages/ContentPage";
import NewsletterSignupPage from "./pages/NewsletterSignupPage";
import BlogListPage from "./pages/BlogListPage"; // Import trang Blog
import PaymentSuccessPage from "./pages/PaymentSuccessPage"; // Giả định bạn sẽ tạo trang này
import ComparePage from "./pages/ComparePage"; // Import trang so sánh
import CombosPage from "./pages/CombosPage"; // Import trang combo
import ComboDetailPage from "./pages/ComboDetailPage"; // Import trang chi tiết combo
import PaymentCancelPage from "./pages/PaymentCancelPage"; // Giả định bạn sẽ tạo trang này
import NotFoundPage from "./pages/NotFoundPage"; // Import trang 404

// Import Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import StaffDashboard from "./pages/admin/StaffDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminNewsletterPage from "./pages/admin/AdminNewsletterPage";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminCustomers from "./pages/admin/AdminCustomers";
import AdminCustomerDetails from "./pages/admin/AdminCustomerDetails";
import AdminPromotionsPage from "./pages/admin/AdminPromotionsPage";
import AdminPurchasesPage from "./pages/admin/AdminPurchasesPage";
import AdminReviewsPage from "./pages/admin/AdminReviewsPage";
import AdminReportsPage from "./pages/admin/AdminReportsPage";
import AdminContentPage from "./pages/admin/AdminContentPage";
import AdminBranchesPage from "./pages/admin/AdminBranchesPage";
import AdminBrandsPage from "./pages/admin/AdminBrandsPage";
import AdminCombosPage from "./pages/admin/AdminCombosPage";
import AdminRolesPage from "./pages/admin/AdminRolesPage";
import AdminQnAPage from "./pages/admin/AdminQnAPage";
import AdminChatPage from "./pages/admin/AdminChatPage";

// --- Main Routing Component ---
const AppRoutes = () => {
  const { loading } = useAppContext();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Các Route cho người dùng (Customer) giờ sẽ sử dụng UserLayout làm layout cha */}
      <Route path="/" element={<UserLayout />}>
        <Route index element={<HomePage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="dang-ky-nhan-tin" element={<NewsletterSignupPage />} />
        <Route path="newsletter" element={<NewsletterSignupPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="payment/success" element={<PaymentSuccessPage />} />
        <Route path="combos" element={<CombosPage />} />
        <Route path="combo/:comboId" element={<ComboDetailPage />} />
        <Route path="compare" element={<ComparePage />} />
        <Route path="payment/cancel" element={<PaymentCancelPage />} />
        <Route path="product/:productId" element={<ProductDetailPage />} />
        <Route path="faq" element={<FaqPage />} />
        <Route path="pages/:slug" element={<ContentPage />} />
        <Route path="blog" element={<BlogListPage />} />
        {/* Route 404 cho các đường dẫn không khớp */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Các Route cho Admin và Staff */}
      <Route
        path="/admin"
        element={<AdminRoute />} // AdminRoute sẽ kiểm tra quyền và render <Outlet />
      >
        {/* AdminLayout sẽ được render cho tất cả các route con bên trong */}
        <Route element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="newsletter" element={<AdminNewsletterPage />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="customers" element={<AdminCustomers />} />
          <Route
            path="customer/:customerId"
            element={<AdminCustomerDetails />}
          />
          <Route path="promotions" element={<AdminPromotionsPage />} />
          <Route path="purchases" element={<AdminPurchasesPage />} />
          <Route path="reviews" element={<AdminReviewsPage />} />
          <Route path="reports" element={<AdminReportsPage />} />
          <Route path="content" element={<AdminContentPage />} />
          <Route path="branches" element={<AdminBranchesPage />} />
          <Route path="brands" element={<AdminBrandsPage />} />
          <Route path="combos" element={<AdminCombosPage />} />
          <Route path="roles" element={<AdminRolesPage />} />
          <Route path="qna" element={<AdminQnAPage />} />
          <Route path="chat" element={<AdminChatPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
};

// Component App chính, bao bọc mọi thứ trong AppProvider
function App() {
  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  );
}

export default App;
