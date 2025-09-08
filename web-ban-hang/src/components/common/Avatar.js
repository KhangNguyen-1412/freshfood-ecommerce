import React from "react";
import "../../styles/common.css"; // <-- Import file CSS

const Avatar = ({ src, alt = "User Avatar", size = "md" }) => {
  const sizeClassName = `avatar-${size}`;
  const defaultAvatar = `https://i.pravatar.cc/150?u=default`;

  return (
    <img
      src={src || defaultAvatar}
      alt={alt}
      className={`avatar ${sizeClassName}`}
      onError={(e) => {
        e.currentTarget.src = defaultAvatar;
      }}
    />
  );
};

export default Avatar;
