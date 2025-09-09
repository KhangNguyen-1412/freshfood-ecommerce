import React from "react";
import "../../styles/common.css";

const Spinner = ({ size = "md" }) => {
  const sizeClasses = {
    sm: "h-5 w-5 border-2",
    md: "h-8 w-8 border-4",
    lg: "h-16 w-16 border-t-4 border-b-4",
  };

  // Kết hợp class chung và class kích thước
  const spinnerClass = `spinner-indicator ${sizeClasses[size]}`;

  return (
    <div className="spinner-container">
      <div className={spinnerClass}></div>
    </div>
  );
};

export default Spinner;
