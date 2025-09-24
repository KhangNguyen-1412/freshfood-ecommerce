import React, { useState, useEffect } from "react";
import {
  collectionGroup,
  collection, // Import collection
  query,
  orderBy,
  getDocs,
  where, // Import where
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import { useAppContext } from "../../context/AppContext";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Spinner from "../../components/common/Spinner";
import SEO from "../../components/common/SEO";
import {
  Send,
  MessageCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Trash2,
} from "lucide-react";

const AdminQnAPage = () => {
  const { userData, createNotification } = useAppContext();
  const navigate = useNavigate();
  const [allQuestions, setAllQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("unanswered"); // 'unanswered' or 'all'
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProductFilter, setSelectedProductFilter] = useState("all");
  const [replyText, setReplyText] = useState({});
  const [submittingId, setSubmittingId] = useState(null);
  const [page, setPage] = useState(1);

  const QUESTIONS_PER_PAGE = 10;

  const fetchAllQuestions = React.useCallback(async () => {
    setLoading(true);
    try {
      // 1. Lấy tất cả các câu hỏi bằng collectionGroup
      const questionsQuery = query(
        collectionGroup(db, "questions"),
        orderBy("createdAt", "desc")
      );
      const questionsSnapshot = await getDocs(questionsQuery);
      const questions = questionsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        productId: doc.ref.parent.parent.id,
        productRef: doc.ref,
      }));

      // 2. Lấy danh sách các ID sản phẩm duy nhất
      const productIds = [...new Set(questions.map((q) => q.productId))];

      if (productIds.length === 0) {
        setAllQuestions([]);
        setLoading(false);
        return;
      }

      // 3. Lấy thông tin sản phẩm theo từng đợt (tối đa 30 ID mỗi lần)
      const productsMap = new Map();
      const CHUNK_SIZE = 30; // Firestore 'in' query limit
      for (let i = 0; i < productIds.length; i += CHUNK_SIZE) {
        const chunk = productIds.slice(i, i + CHUNK_SIZE);
        const productsQuery = query(
          collection(db, "products"),
          where("__name__", "in", chunk)
        );
        const productsSnapshot = await getDocs(productsQuery);
        productsSnapshot.forEach((doc) => {
          productsMap.set(doc.id, doc.data());
        });
      }

      // 4. Kết hợp dữ liệu câu hỏi và sản phẩm
      const questionsData = questions.map((q) => ({
        ...q,
        productName:
          productsMap.get(q.productId)?.name || "Sản phẩm không xác định",
      }));

      setAllQuestions(questionsData);
    } catch (error) {
      console.error("Lỗi khi tải câu hỏi:", error.message);
      toast.error(
        "Không thể tải danh sách câu hỏi. Vui lòng kiểm tra chỉ mục Firestore."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Gộp logic kiểm tra quyền và fetch data vào một useEffect
    if (userData) {
      if (userData.role === "admin") {
        fetchAllQuestions();
      } else {
        toast.error("Bạn không có quyền truy cập trang này.");
        navigate("/admin"); // Chuyển hướng về trang an toàn hơn
      }
    }
  }, [userData, navigate, fetchAllQuestions]);

  useEffect(() => {
    let tempQuestions = [...allQuestions];

    if (filter === "unanswered") {
      tempQuestions = tempQuestions.filter((q) => !q.answer);
    }

    if (selectedProductFilter !== "all") {
      tempQuestions = tempQuestions.filter(
        (q) => q.productId === selectedProductFilter
      );
    }

    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      tempQuestions = tempQuestions.filter(
        (q) =>
          q.questionText.toLowerCase().includes(lowercasedTerm) ||
          q.productName.toLowerCase().includes(lowercasedTerm)
      );
    }

    setFilteredQuestions(tempQuestions);
    setPage(1); // Reset to first page on filter/search change
  }, [allQuestions, filter, searchTerm, selectedProductFilter]);

  const handleReplyChange = (id, text) => {
    setReplyText((prev) => ({ ...prev, [id]: text }));
  };

  const handleReplySubmit = async (question) => {
    const answer = replyText[question.id];
    if (!answer || answer.trim() === "") {
      toast.warn("Vui lòng nhập nội dung trả lời.");
      return;
    }

    setSubmittingId(question.id);
    try {
      await updateDoc(question.productRef, {
        answer: answer,
        answeredAt: serverTimestamp(),
      });

      // Tạo thông báo cho người dùng
      await createNotification(question.userId, {
        title: "Câu hỏi của bạn đã được trả lời",
        message: `Câu trả lời cho câu hỏi về sản phẩm "${question.productName}".`,
        link: `/product/${question.productId}?tab=my-qna`, // Link thẳng đến tab câu hỏi của tôi
      });

      toast.success("Trả lời câu hỏi thành công!");
      // Cập nhật lại danh sách câu hỏi
      setAllQuestions((prev) =>
        prev.map((q) =>
          q.id === question.id
            ? { ...q, answer: answer, answeredAt: new Date() }
            : q
        )
      );
      setReplyText((prev) => ({ ...prev, [question.id]: "" }));
    } catch (error) {
      console.error("Lỗi khi trả lời:", error);
      toast.error("Đã có lỗi xảy ra.");
    } finally {
      setSubmittingId(null);
    }
  };

  const handleDeleteQuestion = async (question) => {
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn xóa câu hỏi về sản phẩm "${question.productName}"? Hành động này không thể hoàn tác.`
      )
    ) {
      return;
    }

    try {
      await deleteDoc(question.productRef);
      toast.success("Đã xóa câu hỏi thành công.");
      setAllQuestions((prev) => prev.filter((q) => q.id !== question.id));
    } catch (error) {
      console.error("Lỗi khi xóa câu hỏi:", error);
      toast.error("Đã có lỗi xảy ra khi xóa câu hỏi.");
    }
  };

  const totalPages = Math.ceil(filteredQuestions.length / QUESTIONS_PER_PAGE);
  const paginatedQuestions = filteredQuestions.slice(
    (page - 1) * QUESTIONS_PER_PAGE,
    page * QUESTIONS_PER_PAGE
  );

  // Tạo danh sách sản phẩm duy nhất để lọc
  const productsWithQuestions = React.useMemo(() => {
    const productMap = new Map();
    allQuestions.forEach((q) => {
      if (!productMap.has(q.productId)) {
        productMap.set(q.productId, {
          id: q.productId,
          name: q.productName,
          unansweredCount: 0,
        });
      }
      if (!q.answer) {
        productMap.get(q.productId).unansweredCount++;
      }
    });
    // Sắp xếp theo số câu hỏi chưa trả lời giảm dần, sau đó theo tên
    return Array.from(productMap.values()).sort(
      (a, b) =>
        b.unansweredCount - a.unansweredCount || a.name.localeCompare(b.name)
    );
  }, [allQuestions]);

  if (loading) return <Spinner />;
  if (userData?.role !== "admin") return null; // Không hiển thị gì nếu chưa xác định là admin

  return (
    <>
      <SEO title="Quản lý Hỏi & Đáp" />
      <div className="page-container">
        <h1 className="page-title">Quản lý Hỏi & Đáp</h1>

        <div className="flex flex-wrap gap-4 items-center mb-6 border-b dark:border-gray-700 pb-4">
          <button
            onClick={() => setFilter("unanswered")}
            className={`px-4 py-2 rounded-md font-semibold ${
              filter === "unanswered"
                ? "bg-green-600 text-white"
                : "bg-gray-200 dark:bg-gray-700"
            }`}
          >
            Chưa trả lời
          </button>
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-md font-semibold ${
              filter === "all"
                ? "bg-green-600 text-white"
                : "bg-gray-200 dark:bg-gray-700"
            }`}
          >
            Tất cả câu hỏi
          </button>
          <button className="flex-grow">
            <select
              value={selectedProductFilter}
              onChange={(e) => setSelectedProductFilter(e.target.value)}
              className="w-full p-2 border rounded-md bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600"
            >
              <option value="all">-- Lọc theo sản phẩm --</option>
              {productsWithQuestions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}{" "}
                  {p.unansweredCount > 0 &&
                    `(${p.unansweredCount} chưa trả lời)`}
                </option>
              ))}
            </select>
          </button>
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Tìm theo tên sản phẩm hoặc nội dung..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 pl-10 border rounded-md bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600"
            />
            <Search
              size={20}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
          </div>
          <button
            onClick={fetchAllQuestions}
            className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
          >
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        <div className="space-y-8">
          {paginatedQuestions.length > 0 ? (
            paginatedQuestions.map((q) => (
              <div key={q.id} className="page-section">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Sản phẩm:{" "}
                      <Link
                        to={`/product/${q.productId}`}
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {q.productName}
                      </Link>
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Người hỏi: {q.userName}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-xs text-gray-400">
                      {q.createdAt?.toDate
                        ? new Date(q.createdAt.toDate()).toLocaleString("vi-VN")
                        : "..."}
                    </p>
                    <button
                      onClick={() => handleDeleteQuestion(q)}
                      className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/20"
                      title="Xóa câu hỏi này"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <p className="my-3 text-lg font-medium flex items-start">
                  <MessageCircle
                    size={20}
                    className="mr-2 mt-1 text-gray-500 dark:text-gray-400 flex-shrink-0"
                  />{" "}
                  {q.questionText}
                </p>

                {q.answer ? (
                  <div className="bg-green-50 dark:bg-gray-700 p-3 rounded-md">
                    <p className="font-semibold text-green-700 dark:text-green-400">
                      Đã trả lời:
                    </p>
                    <p className="italic">{q.answer}</p>
                  </div>
                ) : (
                  <div className="mt-4">
                    <textarea
                      value={replyText[q.id] || ""}
                      onChange={(e) => handleReplyChange(q.id, e.target.value)}
                      placeholder="Viết câu trả lời của bạn..."
                      className="w-full p-2 border rounded-md bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600"
                      rows="2"
                    />
                    <button
                      onClick={() => handleReplySubmit(q)}
                      disabled={submittingId === q.id}
                      className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 flex items-center"
                    >
                      <Send size={16} className="mr-2" />
                      {submittingId === q.id ? "Đang gửi..." : "Gửi trả lời"}
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-10">
              Không có câu hỏi nào.
            </p>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center mt-8 space-x-4">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={page <= 1 || loading}
              className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <ChevronLeft size={16} className="mr-1" /> Trang trước
            </button>
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              Trang {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages || loading}
              className="px-4 py-2 bg-green-600 text-white rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
            >
              Trang sau <ChevronRight size={16} className="ml-1" />
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default AdminQnAPage;
