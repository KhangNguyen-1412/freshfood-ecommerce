import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";
import SEO from "../components/common/SEO";
import Spinner from "../components/common/Spinner";
import { formatCurrency } from "../utils/formatCurrency";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-toastify";
import { ShoppingCart } from "lucide-react";

const ComboDetailPage = () => {
  const { comboId } = useParams();
  const { user, addToCart } = useAppContext();
  const [combo, setCombo] = useState(null);
  const [comboProducts, setComboProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComboDetails = async () => {
      if (!comboId) return;
      setLoading(true);

      try {
        const comboRef = doc(db, "combos", comboId);
        const comboSnap = await getDoc(comboRef);

        if (comboSnap.exists()) {
          const comboData = { id: comboSnap.id, ...comboSnap.data() };
          setCombo(comboData);

          // Lấy thông tin chi tiết của từng sản phẩm trong combo
          const productPromises = comboData.products.map(async (item) => {
            const productRef = doc(db, "products", item.productId);
            const variantRef = doc(productRef, "variants", item.variantId);

            const [productSnap, variantSnap] = await Promise.all([
              getDoc(productRef),
              getDoc(variantRef),
            ]);

            return {
              ...item,
              productDetails: productSnap.data(),
              variantDetails: variantSnap.data(),
            };
          });

          const productsWithDetails = await Promise.all(productPromises);
          setComboProducts(productsWithDetails);
        }
      } catch (error) {
        console.error("Lỗi khi tải chi tiết combo:", error);
        toast.error("Không thể tải thông tin combo.");
      } finally {
        setLoading(false);
      }
    };

    fetchComboDetails();
  }, [comboId]);

  const handleAddComboToCart = () => {
    // Logic thêm vào giỏ hàng tương tự như ở trang CombosPage
    // Bạn có thể tái sử dụng hoặc tùy chỉnh nếu cần
    toast.info("Chức năng thêm vào giỏ hàng đang được phát triển.");
  };

  if (loading) return <Spinner />;
  if (!combo)
    return (
      <div className="page-container text-center">Không tìm thấy combo.</div>
    );

  return (
    <>
      <SEO
        title={combo.name}
        description={combo.description}
        image={combo.imageUrl}
      />
      <div className="page-container">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <img
              src={combo.imageUrl || "https://placehold.co/600x400"}
              alt={combo.name}
              className="w-full h-auto object-cover rounded-lg shadow-lg"
            />
          </div>
          <div>
            <h1 className="text-4xl font-bold">{combo.name}</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2 mb-4">
              {combo.description}
            </p>
            <p className="text-4xl font-bold text-green-600 mb-6">
              {formatCurrency(combo.totalPrice)}
            </p>
            <button
              onClick={handleAddComboToCart}
              className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
            >
              <ShoppingCart className="mr-2" /> Thêm vào giỏ hàng
            </button>
          </div>
        </div>

        <div className="mt-12 border-t dark:border-gray-700 pt-8">
          <h2 className="text-2xl font-bold mb-6">Các sản phẩm trong Combo</h2>
          <div className="space-y-4">
            {comboProducts.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm"
              >
                <img
                  src={
                    item.variantDetails.imageUrl ||
                    item.productDetails.imageUrls?.[0] ||
                    "https://placehold.co/100"
                  }
                  alt={item.productDetails.name}
                  className="w-20 h-20 object-cover rounded-md"
                />
                <div className="flex-grow">
                  <Link
                    to={`/product/${item.productId}`}
                    className="font-semibold text-lg hover:underline"
                  >
                    {item.productDetails.name}
                  </Link>
                  <p className="text-sm text-gray-500">
                    {item.variantDetails.name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">x {item.quantity}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default ComboDetailPage;
