import React from "react";
import { Link } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import { X, GitCompareArrows } from "lucide-react";

const CompareBar = () => {
  const { compareList, removeFromCompare, clearCompareList } = useAppContext();

  if (compareList.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-[0_-2px_10px_rgba(0,0,0,0.1)] z-40 animate-fade-in-up">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h3 className="font-semibold text-lg hidden sm:block">
              So sánh sản phẩm ({compareList.length}/4)
            </h3>
            <div className="flex gap-3">
              {compareList.map((product) => (
                <div key={product.id} className="relative group">
                  <img
                    src={product.imageUrls?.[0] || "https://placehold.co/60x60"}
                    alt={product.name}
                    className="w-12 h-12 object-contain rounded-md border dark:border-gray-600"
                  />
                  <button
                    onClick={() => removeFromCompare(product.id)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={clearCompareList}
              className="px-4 py-2 text-sm font-semibold text-red-600 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              Xóa tất cả
            </button>
            <Link
              to="/compare"
              className="px-6 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 flex items-center gap-2"
            >
              <GitCompareArrows size={18} />
              So sánh
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompareBar;
