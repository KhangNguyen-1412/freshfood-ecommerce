import React, { useState, useEffect } from "react";
import {
  collectionGroup,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import { Link } from "react-router-dom";
import Spinner from "../common/Spinner";
import { CornerDownRight, MessageSquare } from "lucide-react";

const MyQuestionsTab = ({ user }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchMyQuestions = async () => {
      setLoading(true);
      try {
        const q = query(
          collectionGroup(db, "questions"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );

        const snapshot = await getDocs(q);
        const questionsData = await Promise.all(
          snapshot.docs.map(async (qDoc) => {
            const data = qDoc.data();
            const productRef = qDoc.ref.parent.parent;
            const productSnap = await getDoc(productRef);
            return {
              id: qDoc.id,
              ...data,
              productId: productRef.id,
              productName:
                productSnap.data()?.name || "Sản phẩm không xác định",
            };
          })
        );
        setQuestions(questionsData);
      } catch (error) {
        console.error("Lỗi khi tải câu hỏi của tôi:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyQuestions();
  }, [user]);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      {questions.length > 0 ? (
        questions.map((q) => (
          <div key={q.id} className="page-section !p-4">
            <p className="text-sm text-gray-500 mb-2">
              Trong sản phẩm:{" "}
              <Link
                to={`/product/${q.productId}`}
                className="text-blue-500 hover:underline"
              >
                {q.productName}
              </Link>
            </p>
            <p className="flex items-start">
              <MessageSquare
                size={18}
                className="mr-2 mt-1 text-gray-500 flex-shrink-0"
              />{" "}
              {q.questionText}
            </p>
            <p className="text-xs text-gray-400 mt-2 ml-7">
              {new Date(q.createdAt.toDate()).toLocaleString("vi-VN")}
            </p>
            {q.answer && (
              <div className="mt-3 ml-7 pl-4 border-l-2 border-green-500 bg-green-50 dark:bg-gray-900/50 p-3 rounded-r-lg">
                <p className="font-semibold text-green-700 dark:text-green-400 flex items-center">
                  <CornerDownRight size={16} className="mr-1" /> Phản hồi:
                </p>
                <p className="text-gray-700 dark:text-gray-200 italic mt-1">
                  {q.answer}
                </p>
              </div>
            )}
          </div>
        ))
      ) : (
        <p className="text-center text-gray-500 py-10">
          Bạn chưa đặt câu hỏi nào.
        </p>
      )}
    </div>
  );
};

export default MyQuestionsTab;
