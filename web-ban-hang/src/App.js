// src/App.js

import React from "react";
import { AppProvider, useAppContext } from "./context/AppContext";
import { Routes, Route, Navigate, useParams } from "react-router-dom";

// Import Layouts
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import AdminLayout from "./components/layout/AdminLayout";

// Import common components
import Spinner from "./components/common/Spinner";
import BranchSelector from "./pages/BranchSelector";

// Import Customer Pages
import HomePage from "./pages/HomePage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import ProfilePage from "./pages/ProfilePage";
import OrderDetailPage from "./pages/OrderDetailPage";
import ReviewOrderPage from "./pages/ReviewOrderPage";
import FaqPage from "./pages/FaqPage";
import ContentPage from "./pages/ContentPage";
import NewsletterSignupPage from "./pages/NewsletterSignupPage";

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

// --- Helper Components for Routing ---

// Component bảo vệ các Route của Admin
const AdminRoute = ({ children }) => {
  const { userData, loading } = useAppContext();
  if (loading) return <Spinner size="lg" />; // Hiển thị spinner trong khi chờ xác thực

  // Chỉ cho phép truy cập nếu có vai trò admin hoặc staff
  if (userData?.role === "admin" || userData?.role === "staff") {
    return <AdminLayout>{children}</AdminLayout>;
  }
  // Nếu không, chuyển hướng về trang chủ
  return <Navigate to="/" replace />;
};

// Component Layout cho người dùng thông thường
const UserLayout = ({ children }) => (
  <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
    <Header />
    <main className="flex-grow">
      <BranchSelector />
      <div className="animate-fade-in">{children}</div>
    </main>
    <Footer />
  </div>
);

// Component Wrapper để xử lý URL động cho trang chi tiết sản phẩm
const ProductDetailWrapper = () => {
  const { productId } = useParams();
  // **LƯU Ý QUAN TRỌNG:**
  // Tại đây, bạn cần thêm logic để lấy dữ liệu sản phẩm từ Firestore
  // dựa trên `productId` lấy được từ URL.
  // Ví dụ: const { product, loading } = useFetchProduct(productId);
  // Hiện tại, component này sẽ chỉ là một placeholder.
  // Bạn cần cập nhật lại trang `ProductDetailPage` để nó tự fetch dữ liệu.
  const [productData, setProductData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchProduct = async () => {
      // Đây là logic giả định, bạn cần thay thế bằng logic fetch thật
      // const fetchedProduct = await getProductById(productId);
      // setProductData(fetchedProduct);
      setLoading(false);
    };
    fetchProduct();
  }, [productId]);

  if (loading) return <Spinner />;

  // Sau khi có dữ liệu, truyền vào component
  return <ProductDetailPage product={productData} />;
};

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
      {/* Các Route cho người dùng (Customer) sẽ nằm trong UserLayout */}
      <Route
        path="/*"
        element={
          <UserLayout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/newsletter" element={<NewsletterSignupPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route
                path="/product/:productId"
                element={<ProductDetailPage />}
              />
              <Route path="/faq" element={<FaqPage />} />
              <Route path="/pages/:slug" element={<ContentPage />} />
              {/* Route mặc định nếu không khớp, quay về trang chủ */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </UserLayout>
        }
      />

      {/* Các Route cho Admin và Staff */}
      <Route
        path="/admin/*"
        element={
          <AdminRoute>
            <Routes>
              <Route path="/" element={<AdminDashboard />} />
              <Route path="/products" element={<AdminProducts />} />
              <Route path="/newsletter" element={<AdminNewsletterPage />} />
              <Route path="/orders" element={<AdminOrders />} />
              <Route path="/categories" element={<AdminCategories />} />
              <Route path="/customers" element={<AdminCustomers />} />
              <Route
                path="/customer/:customerId"
                element={<AdminCustomerDetails />}
              />
              <Route path="/promotions" element={<AdminPromotionsPage />} />
              <Route path="/purchases" element={<AdminPurchasesPage />} />
              <Route path="/reviews" element={<AdminReviewsPage />} />
              <Route path="/reports" element={<AdminReportsPage />} />
              <Route path="/content" element={<AdminContentPage />} />
              <Route path="/branches" element={<AdminBranchesPage />} />
              <Route path="/brands" element={<AdminBrandsPage />} />
              {/* Route mặc định của admin, quay về dashboard */}
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Routes>
          </AdminRoute>
        }
      />
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
