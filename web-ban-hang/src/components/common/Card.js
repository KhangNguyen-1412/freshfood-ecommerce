import React from "react";
import "../../styles/common.css"; // <-- Import file CSS

const Card = ({ children, className = "" }) => {
  const combinedClassName = `card ${className}`;

  return <div className={combinedClassName}>{children}</div>;
};

export default Card;
