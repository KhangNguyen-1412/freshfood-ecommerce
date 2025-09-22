import admin from "firebase-admin";
const SibApiV3Sdk = require("@sendinblue/client");

// Cấu hình Firebase Admin SDK
try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
    });
  }
} catch (error) {
  console.error("Firebase Admin initialization error", error.stack);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { subject, htmlContent } = req.body;
  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL;
  const BREVO_SENDER_NAME = "FreshFood";

  if (!subject || !htmlContent) {
    return res
      .status(400)
      .json({ message: "Subject and content are required." });
  }

  if (!BREVO_API_KEY || !BREVO_SENDER_EMAIL) {
    return res
      .status(500)
      .json({ message: "Brevo config is missing on the server." });
  }

  try {
    // 1. Lấy danh sách email từ Firestore
    const db = admin.firestore();
    const subscribersSnapshot = await db
      .collection("newsletter_subscribers")
      .get();
    if (subscribersSnapshot.empty) {
      return res.status(404).json({ message: "No subscribers found." });
    }

    const toRecipients = subscribersSnapshot.docs.map((doc) => ({
      email: doc.data().email,
    }));

    // 2. Sử dụng Brevo SDK để gửi email giao dịch (Transactional Email)
    let defaultClient = SibApiV3Sdk.ApiClient.instance;
    let apiKey = defaultClient.authentications["api-key"];
    apiKey.apiKey = BREVO_API_KEY;

    let apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = htmlContent;
    sendSmtpEmail.sender = {
      name: BREVO_SENDER_NAME,
      email: BREVO_SENDER_EMAIL,
    };
    // Gửi đến tất cả người đăng ký
    // Brevo giới hạn 1000 người nhận mỗi API call, chúng ta sẽ chia nhỏ để an toàn
    const batchSize = 500;
    let totalSent = 0;

    for (let i = 0; i < toRecipients.length; i += batchSize) {
      const batchRecipients = toRecipients.slice(i, i + batchSize);

      // Tạo một đối tượng email mới cho mỗi lô
      const emailBatch = new SibApiV3Sdk.SendSmtpEmail();
      emailBatch.subject = subject;
      emailBatch.htmlContent = htmlContent;
      emailBatch.sender = {
        name: BREVO_SENDER_NAME,
        email: BREVO_SENDER_EMAIL,
      };
      emailBatch.to = batchRecipients;

      try {
        console.log(
          `Sending batch ${i / batchSize + 1} to ${
            batchRecipients.length
          } recipients...`
        );
        const data = await apiInstance.sendTransacEmail(emailBatch);
        console.log("Brevo API response for batch: " + JSON.stringify(data));
        totalSent += batchRecipients.length;
      } catch (batchError) {
        console.error(
          `Failed to send batch starting at index ${i}:`,
          batchError
        );
        // Có thể chọn dừng lại hoặc tiếp tục gửi các lô khác
      }
    }

    res.status(200).json({
      message: `Hoàn tất gửi bản tin. Đã gửi đến ${totalSent}/${toRecipients.length} người đăng ký.`,
    });
  } catch (error) {
    console.error("Error sending email campaign:", error);
    // Thêm chi tiết lỗi từ Brevo nếu có
    const errorMessage = error.response
      ? JSON.stringify(error.response.body)
      : error.message;
    res.status(500).json({ message: `An error occurred: ${errorMessage}` });
  }
}
