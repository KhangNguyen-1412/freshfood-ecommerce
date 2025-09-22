// api/create_vnpay_payment_url.js
import crypto from "crypto";
import dateFormat from "dateformat";

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  // Lấy các biến môi trường
  const vnp_TmnCode = process.env.VNP_TMNCODE;
  const vnp_HashSecret = process.env.VNP_HASHSECRET;
  const vnp_Url = process.env.VNP_URL;
  const vnp_ReturnUrl = process.env.VNP_RETURN_URL;

  if (!vnp_TmnCode || !vnp_HashSecret || !vnp_Url || !vnp_ReturnUrl) {
    return res
      .status(500)
      .json({ message: "VNPay config is missing on the server." });
  }

  const date = new Date();
  const createDate = dateFormat(date, "yyyymmddHHMMss");

  const ipAddr = req.headers["x-forwarded-for"] || req.connection.remoteAddress;

  const { orderId, amount, orderInfo } = req.body;
  const tmnCode = vnp_TmnCode;
  const secretKey = vnp_HashSecret;
  let vnpUrl = vnp_Url;
  const returnUrl = vnp_ReturnUrl;

  const locale = "vn";
  const currCode = "VND";
  let vnp_Params = {};
  vnp_Params["vnp_Version"] = "2.1.0";
  vnp_Params["vnp_Command"] = "pay";
  vnp_Params["vnp_TmnCode"] = tmnCode;
  vnp_Params["vnp_Locale"] = locale;
  vnp_Params["vnp_CurrCode"] = currCode;
  vnp_Params["vnp_TxnRef"] = orderId;
  vnp_Params["vnp_OrderInfo"] = orderInfo;
  vnp_Params["vnp_OrderType"] = "other";
  vnp_Params["vnp_Amount"] = amount * 100; // VNPay yêu cầu nhân 100
  vnp_Params["vnp_ReturnUrl"] = returnUrl;
  vnp_Params["vnp_IpAddr"] = ipAddr;
  vnp_Params["vnp_CreateDate"] = createDate;

  // Sắp xếp các tham số theo thứ tự alphabet
  vnp_Params = sortObject(vnp_Params);

  const querystring = require("qs");
  const signData = querystring.stringify(vnp_Params, { encode: false });
  const hmac = crypto.createHmac("sha512", secretKey);
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  vnp_Params["vnp_SecureHash"] = signed;
  vnpUrl += "?" + querystring.stringify(vnp_Params, { encode: false });

  res.status(200).json({ paymentUrl: vnpUrl });
}

// Hàm sắp xếp các thuộc tính của object theo thứ tự alphabet
function sortObject(obj) {
  let sorted = {};
  let str = [];
  let key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
  }
  return sorted;
}
