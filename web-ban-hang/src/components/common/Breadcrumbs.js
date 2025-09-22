import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
import { ChevronRight, Home } from "lucide-react";

const breadcrumbNameMap = {
  profile: "Tài khoản của tôi",
  cart: "Giỏ hàng",
  checkout: "Thanh toán",
  faq: "Câu hỏi thường gặp",
  "payment-success": "Thanh toán thành công",
  "payment-cancel": "Thanh toán thất bại",
};

const Breadcrumbs = () => {
  const location = useLocation();
  const [productName, setProductName] = useState("");
  const pathnames = location.pathname.split("/").filter((x) => x);

  useEffect(() => {
    const fetchDynamicName = async () => {
      if (pathnames[0] === "product" && pathnames[1]) {
        const productRef = doc(db, "products", pathnames[1]);
        const productSnap = await getDoc(productRef);
        if (productSnap.exists()) {
          setProductName(productSnap.data().name);
        }
      }
    };
    fetchDynamicName();
  }, [pathnames]);

  if (pathnames.length === 0) {
    return null; // Không hiển thị breadcrumbs ở trang chủ
  }

  return (
    <nav
      aria-label="breadcrumb"
      className="page-container py-4 bg-gray-100 dark:bg-gray-800"
    >
      <ol className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
        <li>
          <Link to="/" className="hover:text-green-600 flex items-center">
            <Home size={16} className="mr-1" />
            Trang chủ
          </Link>
        </li>
        {pathnames.map((value, index) => {
          const last = index === pathnames.length - 1;
          const to = `/${pathnames.slice(0, index + 1).join("/")}`;
          let name = breadcrumbNameMap[value] || value;

          if (value === pathnames[1] && pathnames[0] === "product") {
            name = productName || "Đang tải...";
          }

          return (
            <li key={to} className="flex items-center">
              <ChevronRight size={16} />
              {last ? (
                <span className="ml-2 font-semibold text-gray-700 dark:text-gray-200">
                  {name}
                </span>
              ) : (
                <Link to={to} className="ml-2 hover:text-green-600">
                  {name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
