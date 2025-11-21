import React from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import Spinner from "../common/Spinner";

const PayPalPayment = ({ isProcessing, finalTotal, onPayPalApprove, validateOrder }) => {
  const styles = {
    shape: "rect",
    layout: "vertical",
  };

  // !!! CẢNH BÁO: Tỷ giá nên được lấy động từ một API thay vì chia cứng
  // Đây chỉ là tạm tính
  const EXCHANGE_RATE_VND_TO_USD = 25000;

  return (
    <div className="p-4 border dark:border-gray-700 rounded-md mt-2 animate-fade-in">
      {isProcessing ? (
        <Spinner />
      ) : (
        <PayPalScriptProvider
          options={{
            "client-id": process.env.REACT_APP_PAYPAL_CLIENT_ID,
            // SỬA 1: Phải là "USD" để khớp với số tiền bạn sắp gửi
            currency: "USD",
          }}
        >
          <PayPalButtons
            disabled={isProcessing}
            forceReRender={[finalTotal, EXCHANGE_RATE_VND_TO_USD]} // Render lại nếu tổng tiền hoặc tỷ giá thay đổi
            style={styles}
            // ... bên trong PayPalPayment.js
            onClick={(data, actions) => {
              if (validateOrder && !validateOrder()) {
                return actions.reject();
              }
              return actions.resolve();
            }}
            createOrder={(data, actions) => {
              const amountInUSD = (
                finalTotal / EXCHANGE_RATE_VND_TO_USD
              ).toFixed(2);

              // THÊM DÒNG NÀY ĐỂ KIỂM TRA
              console.log("ĐANG GỬI CHO PAYPAL:", {
                finalTotal_VND: finalTotal,
                amount_USD: amountInUSD,
              });

              // Nếu amountInUSD là "0.00", đây chính là lỗi
              if (amountInUSD === "0.00") {
                alert("Lỗi: Không thể thanh toán 0 USD.");
                return; // Dừng lại
              }

              return actions.order.create({
                purchase_units: [
                  {
                    // --- THÊM DÒNG NÀY ---
                    description: "Thanh toán đơn hàng cho FreshFood", 
                    
                    amount: {
                      currency_code: "USD",
                      value: amountInUSD,
                    },
                  },
                ],
              });
            }}
            onApprove={onPayPalApprove}

            // --- THÊM 2 DÒNG NÀY ---
            onError={(err) => {
              console.error("PAYPAL BUTTONS onError (Lỗi trước khi Approve):", err);
            }}
            onCancel={(data) => {
              console.log("PAYPAL onCancel (Người dùng tự đóng cửa sổ):", data);
            }}
            // --- KẾT THÚC THÊM ---
          />
        </PayPalScriptProvider>
      )}
    </div>
  );
};

export default PayPalPayment;
