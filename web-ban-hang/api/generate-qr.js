import axios from "axios";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  // Lấy dữ liệu từ frontend gửi lên
  const { amount, addInfo } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ message: "Số tiền không hợp lệ" });
  }

  // Thông tin tài khoản và API Keys lấy từ biến môi trường
  const VIETQR_API_URL = "https://api.vietqr.io/v2/generate";
  const VIETQR_CLIENT_ID = process.env.VIETQR_CLIENT_ID;
  const VIETQR_API_KEY = process.env.VIETQR_API_KEY;

  const payload = {
    accountNo: "101877135020",
    accountName: "NGUYEN HUYNH PHUC KHANG",
    acqId: "970415",
    amount: amount,
    addInfo: addInfo || "Thanh toan don hang",
    template: "compact",
  };

  try {
    const response = await axios.post(VIETQR_API_URL, payload, {
      headers: {
        "x-client-id": VIETQR_CLIENT_ID,
        "x-api-key": VIETQR_API_KEY,
        "Content-Type": "application/json",
      },
    });

    // VietQR API trả về dữ liệu QR dưới dạng Base64 trong qrDataURL
    if (response.data && response.data.code === "00") {
      res.status(200).json({ qrDataURL: response.data.data.qrDataURL });
    } else {
      throw new Error(response.data.desc || "Lỗi không xác định từ VietQR");
    }
  } catch (error) {
    console.error(
      "Lỗi khi tạo mã QR:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({ message: "Không thể tạo mã QR." });
  }
}
