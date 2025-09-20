// backend/server.js

const express = require("express");
const cors = require("cors");
const moment = require("moment");
const crypto = require("crypto");
const qs = require("qs");
require("dotenv").config(); // Nạp các biến môi trường từ file .env

const app = express();
const port = process.env.PORT || 5001;

// Middlewares
app.use(cors()); // Cho phép cross-origin requests
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Endpoint để tạo URL thanh toán VNPay
app.post("/create_vnpay_payment_url", (req, res) => {
  // --- BƯỚC 1: LẤY THÔNG TIN CẦN THIẾT ---
  let ipAddr =
    req.headers["x-forwarded-for"] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress;

  // Thêm dòng kiểm tra này để xử lý trường hợp IPv6 localhost
  if (ipAddr === "::1") {
    ipAddr = "127.0.0.1";
  }

  const tmnCode = process.env.VNP_TMNCODE;
  const secretKey = process.env.VNP_HASHSECRET;
  let vnpUrl = process.env.VNP_URL;
  const returnUrl = process.env.VNP_RETURNURL;

  const date = new Date();
  const createDate = moment(date).format("YYYYMMDDHHmmss");

  // Lấy thông tin từ request của frontend
  const orderId = req.body.orderId;

  const amount = req.body.amount;
  console.log("==================== VNPAY REQUEST DATA ====================");
  console.log("Amount received from frontend:", amount);
  const orderInfo = `Thanh toan cho don hang ${orderId}`;
  const bankCode = req.body.bankCode || ""; // Có thể trống
  const locale = req.body.language || "vn"; // Mặc định là tiếng Việt

  // --- BƯỚC 2: TẠO ĐỐI TƯỢNG DỮ LIỆU GỬI SANG VNPAY ---
  let vnp_Params = {};
  vnp_Params["vnp_Version"] = "2.1.0";
  vnp_Params["vnp_Command"] = "pay";
  vnp_Params["vnp_TmnCode"] = tmnCode;
  vnp_Params["vnp_Locale"] = locale;
  vnp_Params["vnp_CurrCode"] = "VND";
  vnp_Params["vnp_TxnRef"] = orderId; // Mã tham chiếu của giao dịch tại hệ thống của bạn
  vnp_Params["vnp_OrderInfo"] = orderInfo;
  vnp_Params["vnp_OrderType"] = "other"; // Loại hàng hóa
  vnp_Params["vnp_Amount"] = amount * 100; // Số tiền, nhân 100 theo quy định của VNPay
  vnp_Params["vnp_ReturnUrl"] = returnUrl;
  vnp_Params["vnp_IpAddr"] = ipAddr;
  vnp_Params["vnp_CreateDate"] = createDate;
  if (bankCode !== "") {
    vnp_Params["vnp_BankCode"] = bankCode;
  }

  // --- BƯỚC 3: SẮP XẾP VÀ TẠO CHỮ KÝ ---
  // Sắp xếp các tham số theo thứ tự alphabet
  vnp_Params = Object.keys(vnp_Params)
    .sort()
    .reduce((obj, key) => {
      obj[key] = vnp_Params[key];
      return obj;
    }, {});

  console.log("Params before hashing:", vnp_Params);

  // Tạo chuỗi query string
  const signData = qs.stringify(vnp_Params, { encode: false });

  // Tạo chữ ký HMAC-SHA512
  const hmac = crypto.createHmac("sha512", secretKey);
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
  vnp_Params["vnp_SecureHash"] = signed;

  console.log("String to sign (signData):", signData);
  console.log("Generated SecureHash:", signed);
  console.log("==========================================================");

  // --- BƯỚC 4: TẠO URL THANH TOÁN HOÀN CHỈNH ---
  vnpUrl += "?" + qs.stringify(vnp_Params, { encode: false });

  // --- BƯỚC 5: TRẢ VỀ URL CHO FRONTEND ---
  res.json({ paymentUrl: vnpUrl });
});

// Endpoint để xử lý callback từ VNPay
app.get("/vnpay_return", (req, res) => {
  console.log("==================== VNPAY RETURN ====================");
  let vnp_Params = req.query;
  const secureHash = vnp_Params["vnp_SecureHash"];

  // Xóa các tham số không cần thiết để xác thực chữ ký
  delete vnp_Params["vnp_SecureHash"];
  delete vnp_Params["vnp_SecureHashType"];

  // Sắp xếp lại các tham số theo alphabet
  vnp_Params = Object.keys(vnp_Params)
    .sort()
    .reduce((obj, key) => {
      obj[key] = vnp_Params[key];
      return obj;
    }, {});

  const secretKey = process.env.VNP_HASHSECRET;
  const signData = qs.stringify(vnp_Params, { encode: false });
  const hmac = crypto.createHmac("sha512", secretKey);
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  const orderId = vnp_Params["vnp_TxnRef"];
  const responseCode = vnp_Params["vnp_ResponseCode"];
  const frontendReturnUrl = process.env.FRONTEND_URL; // Ví dụ: http://localhost:3000

  console.log("Received vnp_Params:", vnp_Params);
  console.log("Received secureHash:", secureHash);
  console.log("Generated signed hash:", signed);

  if (secureHash === signed) {
    console.log("Signature is valid.");
    if (responseCode === "00") {
      // Giao dịch thành công
      // Chuyển hướng về frontend với trạng thái thành công
      console.log(
        `Payment success for order ${orderId}. Redirecting to success page.`
      );
      res.redirect(
        `${frontendReturnUrl}/payment-callback?orderId=${orderId}&status=success&paymentMethod=vnpay`
      );
    } else {
      // Giao dịch thất bại
      console.log(
        `Payment failed for order ${orderId} with code ${responseCode}. Redirecting to cancel page.`
      );
      res.redirect(
        `${frontendReturnUrl}/payment-callback?orderId=${orderId}&status=failed&reason=Giao dịch không thành công`
      );
    }
  } else {
    // Chữ ký không hợp lệ
    console.log("Signature is invalid. Redirecting to cancel page.");
    res.redirect(
      `${frontendReturnUrl}/payment-callback?orderId=${orderId}&status=failed&reason=Chữ ký không hợp lệ`
    );
  }
  console.log("======================================================");
});

// Khởi động server
app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
