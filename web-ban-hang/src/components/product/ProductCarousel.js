import React from "react";
import ProductCard from "./ProductCard";
import ProductCardSkeleton from "./ProductCardSkeleton";
import "../../styles/product.css";

const ProductCarousel = ({ title, products, loading }) => {
  if (loading) {
    return (
      <section className="carousel-section">
        <h2 className="carousel-title">{title}</h2>
        <div className="carousel-container">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="carousel-item">
              <ProductCardSkeleton />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section className="carousel-section">
      <h2 className="carousel-title">{title}</h2>
      <div className="carousel-container">
        {products.map((p) => (
          <div key={p.id} className="carousel-item">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default ProductCarousel;
