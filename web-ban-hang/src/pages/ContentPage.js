import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import Spinner from "../components/common/Spinner";
import "../styles/pages.css";
import SEO from "../components/common/SEO";

const ContentPage = () => {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const { slug } = useParams(); // Lấy slug trực tiếp từ URL

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }
    const docRef = doc(db, "content", slug);
    getDoc(docRef).then((docSnap) => {
      if (docSnap.exists()) {
        setContent(docSnap.data());
      }
      setLoading(false);
    });
  }, [slug]);

  if (loading) return <Spinner />;

  if (!content)
    return <div className="text-center py-10">Không tìm thấy nội dung.</div>;

  return (
    <>
      <SEO
        title={content.title}
        description={content.content.substring(0, 155)}
      />
      <div className="page-container animate-fade-in">
        <h1 className="content-title">{content.title}</h1>
        <div className="content-body">
          <p className="whitespace-pre-wrap">{content.content}</p>
        </div>
      </div>
    </>
  );
};

export default ContentPage;
