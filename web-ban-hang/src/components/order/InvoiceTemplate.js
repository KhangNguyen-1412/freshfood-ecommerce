import React from "react";
import { formatCurrency } from "../../utils/formatCurrency";

// This component is designed to be printed.
// It's a class component to be compatible with the ref needed by react-to-print.
export class InvoiceTemplate extends React.PureComponent {
  render() {
    const { order } = this.props;

    if (!order) {
      return null;
    }

    const shopInfo = {
      name: "FreshFood",
      address: "123 Đường ABC, Quận 1, TP. Hồ Chí Minh",
      phone: "0123 456 789",
      email: "contact@freshfood.com",
    };

    return (
      <div className="p-10 font-sans text-gray-800">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold">{shopInfo.name}</h1>
            <p className="text-sm text-gray-600">{shopInfo.address}</p>
            <p className="text-sm text-gray-600">
              SĐT: {shopInfo.phone} | Email: {shopInfo.email}
            </p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-semibold">HÓA ĐƠN BÁN HÀNG</h2>
            <p className="text-sm text-gray-500">
              Mã ĐH: #{order.id.substring(0, 8)}
            </p>
            <p className="text-sm text-gray-500">
              Ngày: {order.createdAt.toDate().toLocaleString("vi-VN")}
            </p>
          </div>
        </div>

        {/* Customer Info */}
        <div className="mb-8 border-t border-b border-gray-200 py-4">
          <h3 className="text-lg font-semibold mb-2">Thông tin khách hàng:</h3>
          <p>
            <strong>Tên:</strong> {order.shippingInfo.name}
          </p>
          <p>
            <strong>SĐT:</strong> {order.shippingInfo.phone}
          </p>
          <p>
            <strong>Địa chỉ:</strong> {order.shippingInfo.address}
          </p>
        </div>

        {/* Items Table */}
        <table className="w-full mb-8">
          <thead>
            <tr className="border-b-2 border-gray-300 bg-gray-100">
              <th className="p-2 text-left font-semibold">Sản phẩm</th>
              <th className="p-2 text-center font-semibold">Số lượng</th>
              <th className="p-2 text-right font-semibold">Đơn giá</th>
              <th className="p-2 text-right font-semibold">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} className="border-b border-gray-200">
                <td className="p-2">{item.name}</td>
                <td className="p-2 text-center">{item.quantity}</td>
                <td className="p-2 text-right">{formatCurrency(item.price)}</td>
                <td className="p-2 text-right">
                  {formatCurrency(item.price * item.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-full max-w-xs space-y-2">
            <div className="flex justify-between">
              <span>Tạm tính:</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Giảm giá:</span>
              <span>-{formatCurrency(order.discountAmount)}</span>
            </div>
            <div className="flex justify-between font-bold text-xl border-t border-gray-300 pt-2">
              <span>Tổng cộng:</span>
              <span>{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 mt-16 pt-4 border-t border-gray-200">
          <p>Cảm ơn quý khách đã mua hàng tại {shopInfo.name}!</p>
        </div>
      </div>
    );
  }
}
