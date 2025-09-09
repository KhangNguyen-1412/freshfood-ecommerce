import React from "react";
import "../../styles/common.css";
const Input = ({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  className = "",
  ...props
}) => {
  return (
    <div className="input-wrapper">
      <label htmlFor={id} className="input-label">
        {label}
      </label>
      <input
        type={type}
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`input-field ${className}`}
        {...props}
      />
    </div>
  );
};

export default Input;
