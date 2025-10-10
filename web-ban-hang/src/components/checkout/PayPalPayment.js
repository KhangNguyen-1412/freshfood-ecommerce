import React from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import Spinner from "../common/Spinner";

const PayPalPayment = ({ isProcessing, finalTotal, onPayPalApprove }) => {
  const styles = {
    shape: "rect",
    layout: "vertical",
  };

  return (
    <div className="p-4 border dark:border-gray-700 rounded-md mt-2 animate-fade-in">
      {isProcessing ? (
        <Spinner />
      ) : (
        <PayPalScriptProvider
          options={{
            "client-id": process.env.REACT_APP_PAYPAL_CLIENT_ID,
            currency: "USD", // PayPal không hỗ trợ VND, cần đổi sang USD
          }}
        >
          <PayPalButtons
            disabled={isProcessing}
            forceReRender={[finalTotal]} // Render lại nút nếu tổng tiền thay đổi
            style={styles}
            createOrder={(data, actions) => {
              const amountInUSD = (finalTotal / 25000).toFixed(2); // Tỷ giá tạm tính
              return actions.order.create({
                purchase_units: [{ amount: { value: amountInUSD } }],
              });
            }}
            onApprove={onPayPalApprove}
          />
        </PayPalScriptProvider>
      )}
    </div>
  );
};

export default PayPalPayment;
