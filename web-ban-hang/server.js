const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const qs = require('qs');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Logging function
const log = (message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(message);
  fs.appendFileSync(path.join(__dirname, 'server.log'), logMessage);
};

// Custom Date Formatter (yyyymmddHHMMss)
function formatDate(date) {
  const pad = (n) => (n < 10 ? '0' + n : n);
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const HH = pad(date.getHours());
  const MM = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  return `${yyyy}${mm}${dd}${HH}${MM}${ss}`;
}

app.use(cors());
app.use(express.json());

// Request Logger
app.use((req, res, next) => {
  log(`${req.method} ${req.url}`);
  next();
});

// Health Check
app.get('/', (req, res) => {
  res.send('VNPay Server is running');
});

// VNPay Payment URL Creation Endpoint
app.post('/api/create_vnpay_payment_url', (req, res) => {
  try {
    const vnp_TmnCode = (process.env.VNP_TMNCODE || "").trim();
    const vnp_HashSecret = (process.env.VNP_HASHSECRET || "").trim();
    const vnp_Url = (process.env.VNP_URL || "").trim();
    const vnp_ReturnUrl = (process.env.VNP_RETURNURL || "").trim();

    log(`Config Check: TmnCode=${!!vnp_TmnCode}, HashSecret=${!!vnp_HashSecret}`);
    log(`Using VNP_URL: ${vnp_Url}`);
    log(`Using VNP_RETURNURL: ${vnp_ReturnUrl}`);

    if (!vnp_TmnCode || !vnp_HashSecret || !vnp_Url || !vnp_ReturnUrl) {
      const errorMsg = "VNPay config is missing on the server.";
      log(errorMsg);
      return res.status(500).json({ message: errorMsg });
    }

    const date = new Date();
    const createDate = formatDate(date);
    let ipAddr = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    
    // Normalize IP for localhost
    if (ipAddr === '::1' || ipAddr === '::ffff:127.0.0.1') {
        ipAddr = '127.0.0.1';
    }

    const { orderId, amount, orderInfo } = req.body;
    log(`Creating payment URL for Order: ${orderId}, Amount: ${amount}, IP: ${ipAddr}`);

    let vnp_Params = {};
    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'pay';
    vnp_Params['vnp_TmnCode'] = vnp_TmnCode;
    vnp_Params['vnp_Locale'] = 'vn';
    vnp_Params['vnp_CurrCode'] = 'VND';
    vnp_Params['vnp_TxnRef'] = orderId;
    vnp_Params['vnp_OrderInfo'] = orderInfo;
    vnp_Params['vnp_OrderType'] = 'other';
    vnp_Params['vnp_Amount'] = Math.floor(amount * 100); // Ensure integer
    vnp_Params['vnp_ReturnUrl'] = vnp_ReturnUrl;
    vnp_Params['vnp_IpAddr'] = ipAddr;
    vnp_Params['vnp_CreateDate'] = createDate;

    // Sort parameters
    let sortedParams = {};
    const keys = Object.keys(vnp_Params).sort();
    for (const key of keys) {
      sortedParams[key] = vnp_Params[key];
    }

    const signData = qs.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac("sha512", vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

    sortedParams['vnp_SecureHash'] = signed;
    const paymentUrl = vnp_Url + "?" + qs.stringify(sortedParams, { encode: true });

    log(`Payment URL created successfully`);
    res.status(200).json({ paymentUrl });
  } catch (error) {
    log(`Error creating VNPay URL: ${error.message}`);
    console.error(error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});

// Global Error Handler
app.use((err, req, res, next) => {
  log(`Unhandled Error: ${err.message}`);
  console.error(err);
  res.status(500).send('Something broke!');
});

app.listen(PORT, () => {
  log(`Server is running on port ${PORT}`);
});
