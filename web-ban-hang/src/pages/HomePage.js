import React, { useState, useEffect } from "react";
import SEO from "../components/common/SEO";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  getDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-toastify";
import ProductCarousel from "../components/product/ProductCarousel";
import CategorySidebar from "../components/ui/CategorySidebar";
import ProductCard from "../components/product/ProductCard";
import Spinner from "../components/common/Spinner";
import Pagination from "../components/common/Pagination";
import "../styles/pages.css";

const HomePage = () => {
  const { searchQuery, brands, brandFilter, setBrandFilter } = useAppContext();
  const [mainProducts, setMainProducts] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [saleProducts, setSaleProducts] = useState([]);
  const [categoriesMap, setCategoriesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [categoryName, setCategoryName] = useState("Tất cả sản phẩm");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [sortOption, setSortOption] = useState("latest");
  const [allCategories, setAllCategories] = useState([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const PRODUCTS_PER_PAGE = 9;

  const slides = [
    {
      title: "Thực phẩm tươi ngon, giao tận nhà",
      subtitle: "Chọn lọc từ những nông trại tốt nhất...",
      imageUrl: "https://mtcs.1cdn.vn/2023/05/30/rau-cu-qua.jpg",
      buttonText: "Khám phá ngay",
    },
    {
      title: "Trái Cây Nhập Khẩu Mọng Nước",
      subtitle: "Vitamin tự nhiên cho cả gia đình...",
      imageUrl:
        "https://cdn2.fptshop.com.vn/unsafe/1920x0/filters:format(webp):quality(75)/30_loai_trai_cay_mien_Nam_4db0ad30c0.jpg",
      buttonText: "Mua ngay",
    },
    {
      title: "Thịt Sạch Mỗi Ngày",
      subtitle: "Nguồn cung cấp protein chất lượng cao...",
      imageUrl:
        "https://kamereo.vn/blog/wp-content/uploads/2024/06/thit-lon-sach-1.jpg",
      buttonText: "Xem sản phẩm",
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlideIndex((prevIndex) => (prevIndex + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const goToSlide = (index) => setCurrentSlideIndex(index);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const categoriesSnapshot = await getDocs(
          query(collection(db, "categories"))
        );
        const categoriesData = categoriesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAllCategories(categoriesData);
        const catMap = categoriesSnapshot.docs.reduce(
          (acc, doc) => ({ ...acc, [doc.id]: doc.data().name }),
          {}
        );
        setCategoriesMap(catMap);

        const bestSellersQuery = query(
          collection(db, "products"),
          orderBy("purchaseCount", "desc"),
          limit(10)
        );
        const bestSellersSnapshot = await getDocs(bestSellersQuery);
        setBestSellers(
          bestSellersSnapshot.docs
            .map((doc) => ({ id: doc.id, ...doc.data() }))
            .map((p) => ({
              ...p,
              categoryName: catMap[p.categoryId] || "N/A",
            }))
        );

        const saleQuery = query(
          collection(db, "products"),
          where("onSale", "==", true),
          limit(10)
        );
        const saleSnapshot = await getDocs(saleQuery);
        setSaleProducts(
          saleSnapshot.docs
            .map((doc) => ({ id: doc.id, ...doc.data() }))
            .map((p) => ({
              ...p,
              categoryName: catMap[p.categoryId] || "N/A",
            }))
        );
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu nổi bật:", error);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (Object.keys(categoriesMap).length === 0) return;
    const fetchMainProducts = async () => {
      setLoading(true);
      setCurrentPage(1);
      try {
        let q = collection(db, "products");
        let constraints = [];
        if (brandFilter) {
          constraints.push(where("brandId", "==", brandFilter));
        }
        if (selectedCategory) {
          const childCategoryIds = allCategories
            .filter((cat) => cat.parentId === selectedCategory)
            .map((cat) => cat.id);
          const idsToQuery = [selectedCategory, ...childCategoryIds];
          constraints.push(where("categoryId", "in", idsToQuery));
        }
        switch (sortOption) {
          case "price-asc":
            constraints.push(orderBy("price", "asc"));
            break;
          case "price-desc":
            constraints.push(orderBy("price", "desc"));
            break;
          case "popular":
            constraints.push(orderBy("purchaseCount", "desc"));
            break;
          default:
            constraints.push(orderBy("createdAt", "desc"));
            break;
        }
        const finalQuery = query(q, ...constraints);
        const productsSnapshot = await getDocs(finalQuery);
        let fetchedProducts = productsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        fetchedProducts = fetchedProducts.map((p) => ({
          ...p,
          categoryName: categoriesMap[p.categoryId] || "N/A",
        }));
        if (searchQuery) {
          fetchedProducts = fetchedProducts.filter((p) =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }
        setMainProducts(fetchedProducts);
        if (searchQuery) setCategoryName(`Kết quả cho "${searchQuery}"`);
        else if (selectedCategory)
          setCategoryName(categoriesMap[selectedCategory] || "Danh mục");
        else setCategoryName("Tất cả sản phẩm");
      } catch (error) {
        console.error("Lỗi khi tải sản phẩm chính:", error);
        if (error.code === "failed-precondition")
          toast.error("Cần tạo chỉ mục Firestore, kiểm tra Console (F12).");
      } finally {
        setLoading(false);
      }
    };
    fetchMainProducts();
  }, [
    sortOption,
    selectedCategory,
    searchQuery,
    categoriesMap,
    allCategories,
    brandFilter,
  ]);

  const totalPages = Math.ceil(mainProducts.length / PRODUCTS_PER_PAGE);
  const productsToDisplay = mainProducts.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );
  const filteredBrandName = brandFilter
    ? brands.find((b) => b.id === brandFilter)?.brandName
    : null;

  return (
    <>
      <SEO
        title="Trang chủ"
        description="Mua sắm rau củ quả, thịt cá tươi sạch, an toàn với giá tốt nhất tại FreshFood."
      />
      <div className="page-container">
        <div className="home-hero-banner">
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                index === currentSlideIndex ? "opacity-100" : "opacity-0"
              }`}
            >
              <div className="w-full h-full p-8 md:p-12 flex flex-col md:flex-row items-center">
                <div className="md:w-1/2 text-center md:text-left">
                  <h1 className="text-4xl md:text-5xl font-bold text-green-800 dark:text-green-300 mb-4">
                    {slide.title}
                  </h1>
                  <p className="text-lg text-green-700 dark:text-green-400 mb-6">
                    {slide.subtitle}
                  </p>
                  <button className="bg-green-600 text-white px-8 py-3 rounded-full font-semibold text-lg hover:bg-green-700 transition-transform hover:scale-105">
                    {slide.buttonText}
                  </button>
                </div>
                <div className="md:w-1/2 mt-8 md:mt-0 flex justify-center">
                  <img
                    src={slide.imageUrl}
                    alt={slide.title}
                    className="rounded-lg shadow-xl max-h-[300px]"
                  />
                </div>
              </div>
            </div>
          ))}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-3">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  currentSlideIndex === index ? "bg-green-600" : "bg-green-300"
                }`}
              />
            ))}
          </div>
        </div>
        <ProductCarousel
          title="Sản phẩm Bán chạy nhất"
          products={bestSellers}
          loading={loading && bestSellers.length === 0}
        />
        <ProductCarousel
          title="Khuyến mãi Đặc biệt"
          products={saleProducts}
          loading={loading && saleProducts.length === 0}
        />
        <div className="home-main-grid">
          <CategorySidebar onSelectCategory={setSelectedCategory} />
          <main className="flex-1">
            {filteredBrandName && (
              <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg mb-6 flex justify-between items-center">
                <p>
                  Đang xem sản phẩm của:{" "}
                  <span className="font-bold">{filteredBrandName}</span>
                </p>
                <button
                  onClick={() => setBrandFilter(null)}
                  className="text-red-600 font-semibold text-sm hover:underline"
                >
                  Xóa bộ lọc
                </button>
              </div>
            )}
            <section>
              <div className="home-filter-bar">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
                  {categoryName}
                </h2>
                <div className="flex items-center gap-2">
                  <label htmlFor="sort-select" className="text-sm font-medium">
                    Sắp xếp theo:
                  </label>
                  <select
                    id="sort-select"
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                    className="p-2 border rounded-md text-sm dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-green-500"
                  >
                    <option value="latest">Mới nhất</option>
                    <option value="popular">Bán chạy nhất</option>
                    <option value="price-asc">Giá: Thấp đến Cao</option>
                    <option value="price-desc">Giá: Cao đến Thấp</option>
                  </select>
                </div>
              </div>
              {loading ? (
                <Spinner />
              ) : productsToDisplay.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {productsToDisplay.map((p) => (
                      <ProductCard key={p.id} product={p} />
                    ))}
                  </div>
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </>
              ) : (
                <p className="text-center text-gray-500 py-10">
                  Không tìm thấy sản phẩm nào phù hợp.
                </p>
              )}
            </section>
          </main>
        </div>
      </div>
    </>
  );
};

export default HomePage;
