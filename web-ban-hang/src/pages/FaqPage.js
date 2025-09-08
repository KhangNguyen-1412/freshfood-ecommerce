import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase/config";
import Spinner from "../components/common/Spinner";
import { ChevronDown, ChevronUp } from "lucide-react";
import "../styles/pages.css";
import SEO from "../components/common/SEO";

const FaqPage = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openFaqId, setOpenFaqId] = useState(null);

  useEffect(() => {
    const q = query(
      collection(db, "content"),
      where("type", "==", "faq"),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setFaqs(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleToggleFaq = (id) => {
    setOpenFaqId((prevId) => (prevId === id ? null : id));
  };

  if (loading) return <Spinner />;

  return (
    <>
      <SEO
        title="Câu hỏi thường gặp (FAQ)"
        description="Tìm câu trả lời cho các câu hỏi phổ biến về sản phẩm, giao hàng và chính sách của FreshFood."
      />
      <div className="page-container animate-fade-in">
        <h1 className="content-title">Câu hỏi thường gặp (FAQ)</h1>
        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq) => (
            <div key={faq.id} className="border-b dark:border-gray-700 pb-4">
              <button
                onClick={() => handleToggleFaq(faq.id)}
                className="w-full flex justify-between items-center text-left"
              >
                <h3 className="text-xl font-semibold text-green-700 dark:text-green-400">
                  {faq.title}
                </h3>
                <span className="text-green-700 dark:text-green-400">
                  {openFaqId === faq.id ? <ChevronUp /> : <ChevronDown />}
                </span>
              </button>
              {openFaqId === faq.id && (
                <div className="mt-2 pl-2 animate-fade-in">
                  <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                    {faq.content}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default FaqPage;
