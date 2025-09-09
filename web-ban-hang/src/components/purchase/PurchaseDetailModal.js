import React from "react";
import { X } from "lucide-react";
import { formatCurrency } from "../../utils/formatCurrency";
import "../../styles/purchase.css";

const PurchaseDetailModal = ({ purchase, onClose }) => {
  if (!purchase) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
      <div className="purchase-detail-panel">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
        >
          <X size={24} />
        </button>

        <div className="purchase-detail-header">
          <h2 className="purchase-detail-title">Chi tiết đơn nhập kho</h2>
          <p className="purchase-detail-id">#{purchase.id}</p>
          <div className="purchase-detail-info">
            <p>
              <strong>Ngày nhập:</strong>{" "}
              {purchase.createdAt?.toLocaleString("vi-VN")}
            </p>
            <p>
              <strong>Nhà cung cấp:</strong>{" "}
              {purchase.supplier || "Không có thông tin"}
            </p>
          </div>
        </div>

        <div className="purchase-detail-table-container">
          <table className="w-full">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="p-2 text-left">Sản phẩm</th>
                <th className="p-2 text-right">Số lượng</th>
                <th className="p-2 text-right">Giá nhập / đơn vị</th>
                <th className="p-2 text-right">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {purchase.items.map((item, index) => (
                <tr
                  key={index}
                  className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="p-2 font-semibold">{item.productName}</td>
                  <td className="p-2 text-right">{item.quantity}</td>
                  <td className="p-2 text-right">
                    {formatCurrency(item.purchasePrice)}
                  </td>
                  <td className="p-2 text-right font-medium">
                    {formatCurrency(item.quantity * item.purchasePrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="purchase-detail-footer">
          <span className="text-lg font-semibold mr-4">Tổng chi phí:</span>
          <span className="text-2xl font-bold text-red-600">
            {formatCurrency(purchase.totalCost)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PurchaseDetailModal;
