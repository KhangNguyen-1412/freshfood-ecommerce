import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  deleteDoc,
  where,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import { useAppContext } from "../../context/AppContext";
import { toast } from "react-toastify";
import {
  Send,
  MessageSquare,
  CornerDownRight,
  Edit,
  Trash2,
} from "lucide-react";

const ProductQnA = ({ productId, filterByUser = false }) => {
  const { user, userData } = useAppContext();
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [editingText, setEditingText] = useState("");

  useEffect(() => {
    if (!productId) return;
    let q = query(
      collection(db, "products", productId, "questions"),
      orderBy("createdAt", "desc")
    );

    // Nếu filterByUser là true và có user đăng nhập, thêm điều kiện lọc
    if (filterByUser && user) {
      q = query(q, where("userId", "==", user.uid));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const qnaData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setQuestions(qnaData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [productId, filterByUser, user]);

  const handleAskQuestion = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.warn("Vui lòng đăng nhập để đặt câu hỏi.");
      return;
    }
    if (newQuestion.trim() === "") {
      toast.warn("Vui lòng nhập câu hỏi của bạn.");
      return;
    }

    setIsSubmitting(true);
    try {
      const questionsCol = collection(db, "products", productId, "questions");
      await addDoc(questionsCol, {
        questionText: newQuestion,
        userId: user.uid,
        userName: userData?.displayName || "Người dùng ẩn danh",
        userAvatar: userData?.photoURL || null,
        createdAt: serverTimestamp(),
        answer: null, // Admin sẽ điền câu trả lời vào đây
        answeredAt: null,
      });
      setNewQuestion("");
      toast.success("Câu hỏi của bạn đã được gửi!");
    } catch (error) {
      console.error("Lỗi khi đặt câu hỏi:", error);
      toast.error("Đã có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa câu hỏi này không?")) {
      const questionRef = doc(
        db,
        "products",
        productId,
        "questions",
        questionId
      );
      try {
        await deleteDoc(questionRef);
        toast.success("Đã xóa câu hỏi của bạn.");
      } catch (error) {
        toast.error("Đã có lỗi xảy ra khi xóa.");
      }
    }
  };

  const handleUpdateQuestion = async () => {
    if (editingText.trim() === "") {
      toast.warn("Nội dung câu hỏi không được để trống.");
      return;
    }
    const questionRef = doc(
      db,
      "products",
      productId,
      "questions",
      editingQuestionId
    );
    try {
      await updateDoc(questionRef, { questionText: editingText });
      toast.success("Cập nhật câu hỏi thành công!");
      setEditingQuestionId(null);
    } catch (error) {
      toast.error("Đã có lỗi xảy ra khi cập nhật.");
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Form đặt câu hỏi */}
      <div className="mb-8 p-4 border rounded-lg dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <h3 className="font-semibold text-lg mb-3 flex items-center">
          <MessageSquare size={20} className="mr-2" />
          Đặt câu hỏi về sản phẩm này
        </h3>
        {user && !filterByUser ? ( // Chỉ hiển thị form ở tab "Hỏi & Đáp" chung
          <form onSubmit={handleAskQuestion} className="flex gap-3">
            <input
              type="text"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="Nhập câu hỏi của bạn ở đây..."
              className="flex-grow p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
              disabled={isSubmitting}
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400 flex items-center"
            >
              <Send size={18} className="mr-2" />
              {isSubmitting ? "Đang gửi..." : "Gửi"}
            </button>
          </form>
        ) : !user && !filterByUser ? (
          <p className="text-gray-500">
            Vui lòng{" "}
            <a href="/login" className="text-blue-500 underline">
              đăng nhập
            </a>{" "}
            để đặt câu hỏi.
          </p>
        ) : null}
      </div>

      {/* Danh sách câu hỏi */}
      <div className="space-y-6">
        {loading ? (
          <p>Đang tải câu hỏi...</p>
        ) : questions.length > 0 ? (
          questions.map((q) => (
            <div
              key={q.id}
              className="flex gap-4 border-b dark:border-gray-700 pb-4 last:border-0"
            >
              <img
                src={q.userAvatar || `https://i.pravatar.cc/150?u=${q.userId}`}
                alt="avatar"
                className="h-12 w-12 rounded-full object-cover"
              />
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{q.userName}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {q.createdAt
                        ? new Date(q.createdAt.toDate()).toLocaleString("vi-VN")
                        : "..."}
                    </p>
                  </div>
                  {user && user.uid === q.userId && !q.answer && (
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => {
                          setEditingQuestionId(q.id);
                          setEditingText(q.questionText);
                        }}
                        className="text-blue-500 hover:underline text-sm flex items-center"
                      >
                        <Edit size={14} className="mr-1" /> Chỉnh sửa
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="text-red-500 hover:underline text-sm flex items-center"
                      >
                        <Trash2 size={14} className="mr-1" /> Xóa
                      </button>
                    </div>
                  )}
                </div>

                {editingQuestionId === q.id ? (
                  <div className="mt-2">
                    <textarea
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                      rows="3"
                    />
                    <div className="flex gap-2 mt-2 justify-end">
                      <button
                        onClick={() => setEditingQuestionId(null)}
                        className="px-3 py-1 bg-gray-200 dark:bg-gray-600 rounded-md text-sm"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={handleUpdateQuestion}
                        className="px-3 py-1 bg-green-600 text-white rounded-md text-sm"
                      >
                        Lưu
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-600 dark:text-gray-300 mt-2">
                    {q.questionText}
                  </p>
                )}

                {/* Phần trả lời của Admin */}
                {q.answer && (
                  <div className="mt-3 ml-4 pl-4 border-l-2 border-green-500 bg-green-50 dark:bg-gray-900/50 p-3 rounded-r-lg">
                    <p className="font-semibold text-green-700 dark:text-green-400 flex items-center">
                      <CornerDownRight size={16} className="mr-1" />
                      Phản hồi từ FreshFood:
                    </p>
                    <p className="text-gray-700 dark:text-gray-200 italic mt-1">
                      {q.answer}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center py-4">
            {filterByUser
              ? "Bạn chưa đặt câu hỏi nào cho sản phẩm này."
              : "Chưa có câu hỏi nào cho sản phẩm này. Hãy là người đầu tiên đặt câu hỏi!"}
          </p>
        )}
      </div>
    </div>
  );
};

export default ProductQnA;
