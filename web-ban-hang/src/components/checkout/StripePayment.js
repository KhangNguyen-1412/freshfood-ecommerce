import React from "react";
import { CardElement } from "@stripe/react-stripe-js";

const StripePayment = ({ theme }) => {
  const cardElementOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: theme === "dark" ? "#FFF" : "#424770",
        "::placeholder": { color: "#aab7c4" },
      },
      invalid: { color: "#9e2146" },
    },
  };

  return (
    <div className="p-4 border dark:border-gray-700 rounded-md mt-2 animate-fade-in">
      <CardElement options={cardElementOptions} />
    </div>
  );
};

export default StripePayment;
