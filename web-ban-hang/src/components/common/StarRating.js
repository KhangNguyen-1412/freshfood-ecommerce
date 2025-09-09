import React, { useState } from "react";
import "../../styles/common.css";

const StarRating = ({
  rating = 0,
  onRatingChange,
  size = 24,
  isEditable = true,
}) => {
  const [hoverRating, setHoverRating] = useState(0);

  const stars = Array(5)
    .fill(0)
    .map((_, index) => {
      const starValue = index + 1;

      // Logic xác định class
      let starClass = "star";
      if ((hoverRating || rating) >= starValue) {
        starClass = "star-active";
      }

      return (
        <span
          key={starValue}
          className={`${starClass} ${isEditable ? "star-editable" : ""}`}
          onClick={() =>
            isEditable && onRatingChange && onRatingChange(starValue)
          }
          onMouseEnter={() => isEditable && setHoverRating(starValue)}
          onMouseLeave={() => isEditable && setHoverRating(0)}
          style={{ fontSize: `${size}px`, lineHeight: "1" }}
        >
          ★
        </span>
      );
    });

  return <div className="star-rating-container">{stars}</div>;
};

export default StarRating;
