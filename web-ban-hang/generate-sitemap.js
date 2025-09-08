// file: generate-sitemap.js

const admin = require("firebase-admin");
const fs = require("fs");

// Trỏ đến file key bạn vừa tải về
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const baseUrl = "https://qlwebbhtp.firebaseapp.com"; // THAY BẰNG TÊN MIỀN CỦA BẠN

async function generateSitemap() {
  console.log("Bắt đầu tạo sitemap...");
  try {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    // 1. Thêm trang chủ
    xml += `<url><loc>${baseUrl}/</loc></url>`;

    // 2. Lấy và thêm các trang sản phẩm (giả sử URL là /product/:id)
    const productsSnapshot = await db.collection("products").get();
    productsSnapshot.forEach(doc => {
      xml += `<url><loc>${baseUrl}/product/${doc.id}</loc></url>`;
    });
    console.log(`Đã thêm ${productsSnapshot.size} sản phẩm.`);

    // 3. Lấy và thêm các trang nội dung (giả sử URL là /page/:slug)
    const contentSnapshot = await db.collection("content").get();
    contentSnapshot.forEach(doc => {
      xml += `<url><loc>${baseUrl}/page/${doc.data().slug}</loc></url>`;
    });
    console.log(`Đã thêm ${contentSnapshot.size} trang nội dung.`);
    
    xml += `</urlset>`;

    // 4. Ghi file vào thư mục public của React
    fs.writeFileSync("./public/sitemap.xml", xml);
    console.log("✅ Tạo sitemap.xml thành công!");

  } catch (error) {
    console.error("❌ Lỗi khi tạo sitemap:", error);
  }
}

generateSitemap();