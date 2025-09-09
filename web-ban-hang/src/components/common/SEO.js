// src/components/common/SEO.js

import React from "react";
import { Helmet } from "react-helmet-async";

const SEO = ({ title, description, image, url }) => {
  const siteName = "FreshFood";
  const defaultDescription =
    "FreshFood - Cung cấp thực phẩm tươi sạch, an toàn và chất lượng cao đến mọi gia đình.";
  const defaultImage = "https://quanlybanhang.vercel.app/"; // Ví dụ: https://yourdomain.com/logo.png

  const seo = {
    title: `${title} | ${siteName}`,
    description: description || defaultDescription,
    image: image || defaultImage,
    url: `https://quanlybanhang.vercel.app${url || ""}`, // Thay 'yourdomain.com' bằng tên miền của bạn
  };

  return (
    <Helmet>
      {/* Thẻ SEO cơ bản */}
      <title>{seo.title}</title>
      <meta name="description" content={seo.description} />
      <meta name="image" content={seo.image} />

      {/* Thẻ Open Graph cho Facebook, Zalo... */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={seo.title} />
      <meta property="og:description" content={seo.description} />
      <meta property="og:image" content={seo.image} />
      <meta property="og:url" content={seo.url} />
      <meta property="og:site_name" content={siteName} />

      {/* Thẻ cho Twitter Card (Tùy chọn) */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seo.title} />
      <meta name="twitter:description" content={seo.description} />
      <meta name="twitter:image" content={seo.image} />
    </Helmet>
  );
};

export default SEO;
