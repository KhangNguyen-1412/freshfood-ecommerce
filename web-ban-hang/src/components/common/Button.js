import React from "react";
import "../../styles/common.css";

const Button = ({
  children,
  onClick,
  variant = "primary",
  className = "",
  ...props
}) => {
  const variantClassName =
    variant === "primary" ? "btn-primary" : "btn-secondary";
  const combinedClassName = `btn ${variantClassName} ${className}`;

  return (
    <button className={combinedClassName} onClick={onClick} {...props}>
      {children}
    </button>
  );
};

export default Button;
