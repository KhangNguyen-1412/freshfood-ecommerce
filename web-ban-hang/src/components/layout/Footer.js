import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Leaf, Facebook, Instagram, Linkedin } from "lucide-react";
import { useAppContext } from "../../context/AppContext";
import "../../styles/layout.css";

const Footer = () => {
  const { brands, setBrandFilter } = useAppContext();
  const navigate = useNavigate();

  const handleBrandClick = (brandId) => {
    setBrandFilter(brandId);
    navigate("/");
  };

  return (
    <footer className="footer">
      {brands.length > 0 && (
        <div className="py-6 border-b dark:border-gray-700">
          <div className="container mx-auto px-4">
            <h4 className="font-semibold text-center text-gray-800 dark:text-gray-200 mb-4">
              Thương hiệu Đối tác
            </h4>
            <div className="flex items-center space-x-8 overflow-x-auto pb-2">
              {brands.map((brand) => (
                <button
                  key={brand.id}
                  onClick={() => handleBrandClick(brand.id)}
                  className="flex-shrink-0"
                >
                  <img
                    src={brand.logoUrl || "https://placehold.co/120x60"}
                    alt={brand.brandName}
                    className="h-12 object-contain grayscale hover:grayscale-0 transition-all duration-300"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      <div className="footer-container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <h3 className="text-xl font-bold text-green-700 flex items-center mb-3">
              <Leaf size={24} className="mr-2" />
              FreshFood
            </h3>
            <p className="text-sm">
              FreshFood tự hào mang đến những sản phẩm nông sản tươi sạch, an
              toàn và chất lượng cao từ các nông trại uy tín đến tận tay người
              tiêu dùng.
            </p>
          </div>
          <div>
            <h4 className="footer-section-title">Hỗ trợ khách hàng</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/pages/cau-hoi-thuong-gap" className="footer-link">
                  Câu hỏi thường gặp
                </Link>
              </li>
              <li>
                <Link to="/pages/chinh-sach-van-chuyen" className="footer-link">
                  Chính sách vận chuyển
                </Link>
              </li>
              <li>
                <Link to="/pages/chinh-sach-doi-tra" className="footer-link">
                  Chính sách đổi trả
                </Link>
              </li>
              <li>
                <Link to="/pages/huong-dan-mua-hang" className="footer-link">
                  Hướng dẫn mua hàng
                </Link>
              </li>
              <li>
                <Link to="/dang-ky-nha-tin" className="footer-link">
                  Đăng ký nhận tin
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="footer-section-title">Kết nối với chúng tôi</h4>
            <div className="flex space-x-4">
              <a
                href="https://www.facebook.com/khangphuc1412"
                className="footer-link"
              >
                <Facebook size={24} />
              </a>
              <a
                href="https://www.instagram.com/nhpk1412/"
                className="footer-link"
              >
                <Instagram size={24} />
              </a>
              <a
                href="https://www.linkedin.com/in/nguy%E1%BB%85n-hu%E1%BB%B3nh-ph%C3%BAc-khang-29699825b/"
                className="footer-link"
              >
                <Linkedin size={24} />
              </a>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t dark:border-gray-700 pt-4 text-center text-sm">
          <p>&copy; 2025 FreshFood. Bảo lưu mọi quyền.</p>
        </div>
      </div>
    </footer>
  );
};
export default Footer;
