import React from "react";
import "../../styles/product.css";

const ProductCardSkeleton = () => (
  <div className="skeleton-card">
    <div className="skeleton-image"></div>
    <div className="p-4">
      <div className="h-6 skeleton-line w-3/4 mb-2"></div>
      <div className="h-4 skeleton-line w-1/2"></div>
      <div className="flex justify-between items-center mt-4">
        <div className="h-8 skeleton-line w-1/3"></div>
        <div className="h-10 w-10 skeleton-line rounded-full"></div>
      </div>
    </div>
  </div>
);

export default ProductCardSkeleton;
