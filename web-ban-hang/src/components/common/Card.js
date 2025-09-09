import React from "react";
import "../../styles/common.css";

const Card = ({ children, className = "" }) => {
  const combinedClassName = `card ${className}`;

  return <div className={combinedClassName}>{children}</div>;
};

export default Card;
