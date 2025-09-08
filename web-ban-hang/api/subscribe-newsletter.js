// api/subscribe-newsletter.js

export default async function handler(req, res) {
  // Chỉ chấp nhận request bằng phương thức POST
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { email } = req.body;

  // Kiểm tra xem email có được gửi lên không
  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  // Lấy các biến môi trường đã lưu trên Vercel
  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  const BREVO_LIST_ID = process.env.BREVO_LIST_ID;

  try {
    // Gọi đến API của Brevo để thêm một contact mới
    const response = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        email: email,
        listIds: [Number(2)], // ID của danh sách bạn muốn thêm email vào
      }),
    });

    // Nếu Brevo trả về lỗi, ném lỗi để block catch xử lý
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || "Failed to subscribe. Please try again."
      );
    }

    const data = await response.json();
    // Trả về thông báo thành công cho frontend
    res.status(201).json({ message: "Subscription successful!", data });
  } catch (error) {
    // Trả về lỗi nếu có sự cố
    res.status(500).json({ message: error.message });
  }
}
