/**
 * Định dạng một số thành chuỗi tiền tệ Việt Nam (VND).
 * @param {number} amount - Số tiền cần định dạng.
 * @returns {string} - Chuỗi tiền tệ đã được định dạng (ví dụ: "50.000 ₫").
 */
export const formatCurrency = (amount) => {
  // Kiểm tra nếu amount không phải là số thì trả về chuỗi rỗng hoặc giá trị mặc định
  if (typeof amount !== "number" || isNaN(amount)) {
    return "0 ₫";
  }

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};
