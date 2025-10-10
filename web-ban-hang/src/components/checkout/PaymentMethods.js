import React from "react";
import StripePayment from "./StripePayment";
import PayPalPayment from "./PayPalPayment";
import Spinner from "../common/Spinner";

const paymentOptions = [
  { value: "COD", label: "Thanh toán khi nhận hàng (COD)" },
  { value: "BANK_TRANSFER", label: "Chuyển khoản ngân hàng" },
  { value: "STRIPE_CARD", label: "Thanh toán qua thẻ (Visa, Mastercard)" },
  { value: "VNPAY", label: "Thanh toán qua VNPay" },
  { value: "PAYPAL", label: "Thanh toán qua PayPal" },
];

const PaymentMethods = ({
  selectedPaymentMethod,
  setSelectedPaymentMethod,
  isProcessing,
  finalTotal,
  onPayPalApprove,
  theme,
}) => {
  return (
    <div className="relative">
      {/* Lớp phủ loading */}
      {isProcessing && selectedPaymentMethod !== "PAYPAL" && (
        <div className="absolute inset-0 bg-white dark:bg-gray-800 bg-opacity-70 dark:bg-opacity-70 flex justify-center items-center z-10 rounded-lg">
          <Spinner />
        </div>
      )}

      <h2 className="text-xl font-bold mt-8 mb-4">Phương thức thanh toán</h2>
      <div className="space-y-2">
        {paymentOptions.map((option) => (
          <label
            key={option.value}
            className={`flex items-center p-3 border rounded-md cursor-pointer dark:border-gray-700 ${
              isProcessing ? "cursor-not-allowed opacity-60" : ""
            }`}
          >
            <input
              type="radio"
              name="payment"
              value={option.value}
              checked={selectedPaymentMethod === option.value}
              onChange={(e) =>
                !isProcessing && setSelectedPaymentMethod(e.target.value)
              }
              className="mr-3 h-4 w-4 text-green-600 focus:ring-green-500"
              disabled={isProcessing}
            />
            {option.label}
          </label>
        ))}

        {selectedPaymentMethod === "STRIPE_CARD" && (
          <StripePayment theme={theme} />
        )}

        {selectedPaymentMethod === "PAYPAL" && (
          <PayPalPayment
            isProcessing={isProcessing}
            finalTotal={finalTotal}
            onPayPalApprove={onPayPalApprove}
          />
        )}

        {selectedPaymentMethod === "BANK_TRANSFER" && (
          <div className="p-4 border dark:border-gray-700 rounded-md mt-2 animate-fade-in text-sm space-y-2">
            <p className="font-semibold">
              Vui lòng chuyển khoản với nội dung sau:
            </p>
            <ul className="list-disc list-inside bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md">
              <li>
                <strong>Ngân hàng:</strong> Vietcombank
              </li>
              <li>
                <strong>Số tài khoản:</strong> 999988889999
              </li>
              <li>
                <strong>Nội dung:</strong> Thanh toan don hang [Mã đơn hàng của
                bạn]
              </li>
            </ul>
            <p className="text-xs text-gray-500">
              Đơn hàng sẽ được xử lý sau khi chúng tôi xác nhận đã nhận được
              thanh toán.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentMethods;
