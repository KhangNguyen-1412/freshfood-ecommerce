import React from "react";
import { Helmet } from "react-helmet-async";

const SEO = ({ title, description, image, url }) => {
  const siteName = "FreshFood";
  const defaultDescription =
    "FreshFood - Cung cấp thực phẩm tươi sạch, an toàn và chất lượng cao đến mọi gia đình.";
  const defaultImage = "https://quanlybanhang.vercel.app/";

  const seo = {
    title: `${title} | ${siteName}`,
    description: description || defaultDescription,
    image: image || defaultImage,
    url: `https://quanlybanhang.vercel.app${url || ""}`,
  };

  return (
    <Helmet>
      <title>{seo.title}</title>
      <meta name="description" content={seo.description} />
      <meta name="image" content={seo.image} />

      <meta property="og:type" content="website" />
      <meta property="og:title" content={seo.title} />
      <meta property="og:description" content={seo.description} />
      <meta property="og:image" content={seo.image} />
      <meta property="og:url" content={seo.url} />
      <meta property="og:site_name" content={siteName} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seo.title} />
      <meta name="twitter:description" content={seo.description} />
      <meta name="twitter:image" content={seo.image} />
    </Helmet>
  );
};

export default SEO;
