import React from "react";
import { Link } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import SEO from "../components/common/SEO";
import { formatCurrency } from "../utils/formatCurrency";
import { X, GitCompareArrows } from "lucide-react";
import StarRating from "../components/common/StarRating";

const ComparePage = () => {
  const { compareList, removeFromCompare, clearCompareList } = useAppContext();

  if (compareList.length === 0) {
    return (
      <div className="page-container text-center py-20">
        <GitCompareArrows
          size={80}
          className="mx-auto text-gray-300 dark:text-gray-600"
        />
        <h2 className="text-3xl font-bold mt-4">
          Chưa có sản phẩm nào để so sánh
        </h2>
        <p className="text-gray-500 mt-2 mb-8">
          Thêm sản phẩm vào danh sách để bắt đầu so sánh.
        </p>
        <Link
          to="/"
          className="mt-8 bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
        >
          Tiếp tục mua sắm
        </Link>
      </div>
    );
  }

  const attributes = [
    { key: "name", label: "Tên sản phẩm" },
    { key: "price", label: "Giá" },
    { key: "rating", label: "Đánh giá" },
    { key: "description", label: "Mô tả" },
    { key: "brandName", label: "Nhãn hiệu" },
    { key: "categoryName", label: "Danh mục" },
  ];

  return (
    <>
      <SEO
        title="So sánh sản phẩm"
        description="So sánh chi tiết các sản phẩm bạn đã chọn."
      />
      <div className="page-container">
        <div className="flex justify-between items-center mb-6">
          <h1 className="page-title !mb-0">So sánh sản phẩm</h1>
          <button
            onClick={clearCompareList}
            className="text-red-500 font-semibold hover:underline"
          >
            Xóa tất cả
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800">
                <th className="p-4 text-left font-semibold w-1/5">Tính năng</th>
                {compareList.map((product) => (
                  <th key={product.id} className="p-4 text-center relative">
                    <button
                      onClick={() => removeFromCompare(product.id)}
                      className="absolute top-1 right-1 text-gray-400 hover:text-red-500"
                    >
                      <X size={18} />
                    </button>
                    <Link to={`/product/${product.id}`}>
                      <img
                        src={
                          product.imageUrls?.[0] ||
                          "https://placehold.co/150x150"
                        }
                        alt={product.name}
                        className="w-32 h-32 object-contain mx-auto mb-2 rounded-md"
                      />
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {attributes.map((attr) => (
                <tr
                  key={attr.key}
                  className="border-b dark:border-gray-700 last:border-0"
                >
                  <td className="p-4 font-semibold align-top">{attr.label}</td>
                  {compareList.map((product) => (
                    <td
                      key={product.id}
                      className="p-4 text-sm align-top text-center"
                    >
                      {attr.key === "name" ? (
                        <Link
                          to={`/product/${product.id}`}
                          className="font-bold text-blue-600 hover:underline"
                        >
                          {product[attr.key]}
                        </Link>
                      ) : attr.key === "price" ? (
                        <span className="font-bold text-green-600">
                          {formatCurrency(product[attr.key])}
                        </span>
                      ) : attr.key === "rating" ? (
                        <div className="flex flex-col items-center">
                          <StarRating
                            rating={product.averageRating || 0}
                            isEditable={false}
                          />
                          <span className="text-xs text-gray-500">
                            ({product.reviewCount || 0} đánh giá)
                          </span>
                        </div>
                      ) : (
                        product[attr.key] || "N/A"
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default ComparePage;
