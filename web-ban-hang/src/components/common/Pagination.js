import React from "react";
import "../../styles/common.css";

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) {
    return null;
  }

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="pagination-container">
      {pageNumbers.map((number) => (
        <button
          key={number}
          onClick={() => onPageChange(number)}
          className={`pagination-button ${
            currentPage === number
              ? "pagination-button-active"
              : "pagination-button-inactive"
          }`}
        >
          {number}
        </button>
      ))}
    </div>
  );
};

export default Pagination;
