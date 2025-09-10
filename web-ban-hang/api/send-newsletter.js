import admin from "firebase-admin";

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
    const subscribersSnapshot = await db.collection("subscribers").get();
    if (subscribersSnapshot.empty) {
      return res.status(404).json({ message: "No subscribers found." });
    }

    const recipients = subscribersSnapshot.docs.map((doc) => ({
      email: doc.data().email,
    }));

    // 2. Tạo một chiến dịch Email trên Brevo
    const campaignResponse = await fetch(
      "https://api.brevo.com/v3/emailCampaigns",
      {
        method: "POST",
        headers: {
          accept: "application/json",
          "api-key": BREVO_API_KEY,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          name: `Campaign - ${subject} - ${new Date().toISOString()}`,
          subject: subject,
          htmlContent: htmlContent,
          sender: { name: BREVO_SENDER_NAME, email: BREVO_SENDER_EMAIL },
          recipients: { listIds: [Number(process.env.BREVO_LIST_ID)] },
        }),
      }
    );

    if (!campaignResponse.ok) {
      const errorData = await campaignResponse.json();
      throw new Error(`Failed to create campaign: ${errorData.message}`);
    }

    const campaignData = await campaignResponse.json();

    // 3. Gửi chiến dịch vừa tạo
    await fetch(
      `https://api.brevo.com/v3/emailCampaigns/${campaignData.id}/sendNow`,
      {
        method: "POST",
        headers: {
          accept: "application/json",
          "api-key": BREVO_API_KEY,
        },
      }
    );

    res
      .status(200)
      .json({ message: `Campaign sent to ${recipients.length} subscribers.` });
  } catch (error) {
    console.error("Error sending email campaign:", error);
    res.status(500).json({ message: error.message || "An error occurred." });
  }
}
