import React, { useState, useEffect, useMemo } from "react";
import {
  collection,
  getDocs,
  collectionGroup,
  query,
  orderBy,
  onSnapshot,
  doc,
  arrayUnion,
  runTransaction,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase/config";
import { useAppContext } from "../../context/AppContext";
import * as ExcelJS from "exceljs";
import { toast } from "react-toastify";
import Spinner from "../../components/common/Spinner";
import StarRating from "../../components/common/StarRating";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  History,
  Pin,
  Download,
} from "lucide-react";
import "../../styles/admin.css";

const AdminReviewsPage = () => {
  const [allReviews, setAllReviews] = useState([]);
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [productsMap, setProductsMap] = useState({});
  const [ratingFilter, setRatingFilter] = useState("all");
  const [productFilter, setProductFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const { userData, userPermissions } = useAppContext();
  const navigate = useNavigate();
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [historyModalReview, setHistoryModalReview] = useState(null);

  useEffect(() => {
    // KIỂM TRA QUYỀN TRƯỚC KHI TRUY VẤN
    if (!userPermissions.isAdmin && !userPermissions.reviews) {
      toast.error("Bạn không có quyền truy cập chức năng này.");
      navigate("/admin"); // Chuyển hướng về trang admin dashboard
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        // Lấy tên sản phẩm để hiển thị
        const productsSnapshot = await getDocs(collection(db, "products"));
        const pMap = productsSnapshot.docs.reduce((map, doc) => {
          map[doc.id] = doc.data().name;
          return map;
        }, {});
        setProductsMap(pMap);

        // Sử dụng collectionGroup để lấy tất cả review từ tất cả sản phẩm
        const reviewsQuery = query(
          collectionGroup(db, "reviews"),
          orderBy("createdAt", "desc")
        );
        const unsubscribe = onSnapshot(reviewsQuery, (snapshot) => {
          const reviewsData = snapshot.docs.map((doc) => ({
            id: doc.id,
            productId: doc.ref.parent.parent.id, // Lấy ID sản phẩm từ đường dẫn
            ...doc.data(),
          }));
          setAllReviews(reviewsData);
          setFilteredReviews(reviewsData); // Khởi tạo danh sách lọc ban đầu
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu:", error);
        toast.error("Không thể tải đánh giá. Cần tạo chỉ mục trên Firestore.");
        setLoading(false);
      }
    };

    fetchData();
  }, [userPermissions, navigate]);

  useEffect(() => {
    let tempReviews = allReviews
      .filter((review) => {
        const searchTermMatch =
          searchTerm.trim() === "" ||
          (review.comment &&
            review.comment.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (review.userName &&
            review.userName.toLowerCase().includes(searchTerm.toLowerCase()));
        const ratingMatch =
          ratingFilter === "all" || review.rating === parseInt(ratingFilter);
        const productMatch =
          productFilter === "all" || review.productId === productFilter;
        return searchTermMatch && ratingMatch && productMatch;
      })
      .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0)); // Đưa bình luận đã ghim lên đầu

    setFilteredReviews(tempReviews);
    setCurrentPage(1); // Reset về trang đầu khi tìm kiếm hoặc lọc
  }, [searchTerm, allReviews, ratingFilter, productFilter]);

  const ratingStats = useMemo(() => {
    if (allReviews.length === 0) return [];

    const stats = [
      { name: "1 Sao", count: 0 },
      { name: "2 Sao", count: 0 },
      { name: "3 Sao", count: 0 },
      { name: "4 Sao", count: 0 },
      { name: "5 Sao", count: 0 },
    ];

    allReviews.forEach((review) => {
      if (review.rating >= 1 && review.rating <= 5) {
        stats[review.rating - 1].count++;
      }
    });
    return stats;
  }, [allReviews]);

  const handleDeleteReview = async (review) => {
    if (
      !window.confirm(
        "Bạn có chắc chắn muốn xóa bình luận này? Rating của sản phẩm sẽ được cập nhật lại."
      )
    )
      return;

    const productRef = doc(db, "products", review.productId);
    const reviewRef = doc(
      db,
      "products",
      review.productId,
      "reviews",
      review.id
    );

    try {
      await runTransaction(db, async (transaction) => {
        const productDoc = await transaction.get(productRef);
        if (!productDoc.exists()) throw new Error("Sản phẩm không tồn tại!");

        const productData = productDoc.data();
        const currentRating = productData.averageRating || 0;
        const currentCount = productData.reviewCount || 0;

        if (currentCount <= 1) {
          transaction.update(productRef, { averageRating: 0, reviewCount: 0 });
        } else {
          const newCount = currentCount - 1;
          const newTotalRating = currentRating * currentCount - review.rating;
          const newAverageRating = newTotalRating / newCount;

          transaction.update(productRef, {
            averageRating: newAverageRating,
            reviewCount: newCount,
          });
        }

        transaction.delete(reviewRef);
      });
      toast.success("Đã xóa bình luận thành công.");
    } catch (error) {
      console.error("Lỗi khi xóa bình luận:", error);
      toast.error("Đã có lỗi xảy ra: " + error.message);
    }
  };

  const handleToggleVisibility = async (review) => {
    const reviewRef = doc(
      db,
      "products",
      review.productId,
      "reviews",
      review.id
    );
    const newVisibility = !(review.isVisible ?? true); // Mặc định là true nếu chưa có

    try {
      await updateDoc(reviewRef, {
        isVisible: newVisibility,
      });
      toast.success(
        `Đã ${newVisibility ? "hiện" : "ẩn"} bình luận thành công!`
      );
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái bình luận:", error);
      toast.error("Đã có lỗi xảy ra.");
    }
  };

  const handleTogglePin = async (review) => {
    const reviewRef = doc(
      db,
      "products",
      review.productId,
      "reviews",
      review.id
    );
    const newPinnedStatus = !(review.isPinned ?? false); // Mặc định là false nếu chưa có

    try {
      await updateDoc(reviewRef, {
        isPinned: newPinnedStatus,
      });
      toast.success(
        `Đã ${newPinnedStatus ? "ghim" : "bỏ ghim"} bình luận thành công!`
      );
    } catch (error) {
      console.error("Lỗi khi ghim bình luận:", error);
      toast.error("Đã có lỗi xảy ra.");
    }
  };

  const handleReplySubmit = async () => {
    if (!replyingTo || !replyText.trim()) {
      return toast.error("Vui lòng nhập nội dung phản hồi.");
    }

    const reviewRef = doc(
      db,
      "products",
      replyingTo.productId,
      "reviews",
      replyingTo.id
    );

    try {
      const newReplyEntry = {
        text: replyText,
        repliedAt: new Date(), // Dùng new Date() để có thể dùng arrayUnion
        repliedBy: userData.displayName,
      };

      await updateDoc(reviewRef, {
        adminReply: replyText,
        repliedAt: serverTimestamp(),
        repliedBy: userData.displayName,
        // Thêm vào lịch sử phản hồi
        replyHistory: arrayUnion(newReplyEntry),
      });
      toast.success("Gửi phản hồi thành công!");

      setReplyingTo(null);
      setReplyText("");
    } catch (error) {
      toast.error("Gửi phản hồi thất bại.");
      console.error("Lỗi khi phản hồi:", error);
    }
  };

  const handleExportExcel = async () => {
    if (filteredReviews.length === 0) {
      return toast.warn("Không có bình luận nào để xuất.");
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Danh sách bình luận");

    worksheet.columns = [
      { header: "Sản phẩm", key: "productName", width: 30 },
      { header: "Người dùng", key: "userName", width: 20 },
      { header: "Rating", key: "rating", width: 10 },
      { header: "Nội dung", key: "comment", width: 50 },
      { header: "Phản hồi Admin", key: "adminReply", width: 50 },
      { header: "Trạng thái", key: "status", width: 15 },
      { header: "Ngày tạo", key: "createdAt", width: 20 },
    ];

    filteredReviews.forEach((review) => {
      worksheet.addRow({
        productName: productsMap[review.productId] || "N/A",
        userName: review.userName,
        rating: review.rating,
        comment: review.comment,
        adminReply: review.adminReply || "",
        status: review.isVisible ?? true ? "Hiển thị" : "Đã ẩn",
        createdAt: review.createdAt.toDate().toLocaleString("vi-VN"),
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Danh_sach_binh_luan.xlsx";
    link.click();
  };

  if (loading) return <Spinner />;

  // Logic phân trang
  const REVIEWS_PER_PAGE = 10;
  const totalPages = Math.ceil(filteredReviews.length / REVIEWS_PER_PAGE);
  const paginatedReviews = filteredReviews.slice(
    (currentPage - 1) * REVIEWS_PER_PAGE,
    currentPage * REVIEWS_PER_PAGE
  );
  return (
    <div>
      <h1 className="admin-page-title">Quản lý Bình luận</h1>
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md mb-6 flex items-center gap-4 flex-wrap">
        <input
          type="text"
          placeholder="Tìm theo bình luận hoặc tên người dùng..."
          className="flex-grow p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="flex items-center gap-2">
          <label htmlFor="rating-filter" className="text-sm font-medium">
            Lọc theo sao:
          </label>
          <select
            id="rating-filter"
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="p-2 border rounded-md text-sm dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="all">Tất cả</option>
            <option value="5">5 sao</option>
            <option value="4">4 sao</option>
            <option value="3">3 sao</option>
            <option value="2">2 sao</option>
            <option value="1">1 sao</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="product-filter" className="text-sm font-medium">
            Lọc theo sản phẩm:
          </label>
          <select
            id="product-filter"
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            className="p-2 border rounded-md text-sm dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="all">Tất cả sản phẩm</option>
            {Object.entries(productsMap).map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div className="ml-auto">
          <button onClick={handleExportExcel} className="admin-button-teal">
            <Download size={18} className="mr-2" />
            Xuất Excel
          </button>
        </div>
      </div>

      {ratingStats.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-bold mb-4">Thống kê đánh giá</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={ratingStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.8)",
                  backdropFilter: "blur(5px)",
                  border: "1px solid #ccc",
                  borderRadius: "0.5rem",
                }}
                labelStyle={{ fontWeight: "bold" }}
                formatter={(value) => [value, "Số lượng"]}
              />
              <Bar dataKey="count" fill="#8884d8" name="Số lượng" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr className="border-b dark:border-gray-700">
              <th className="p-2 text-left">Bình luận</th>
              <th className="p-2 text-left">Rating</th>
              <th className="p-2 text-left">Người dùng</th>
              <th className="p-2 text-left">Sản phẩm</th>
              <th className="p-2 text-left">Ngày</th>
              <th className="p-2 text-left">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {paginatedReviews.map((review) => (
              <tr
                key={review.id}
                className={`border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all ${
                  review.isPinned ? "bg-yellow-50 dark:bg-yellow-900/20" : ""
                } ${!(review.isVisible ?? true) ? "opacity-50" : ""}`}
              >
                <td className="p-2 text-sm max-w-sm">
                  <p className="truncate">{review.comment}</p>
                  {review.adminReply && (
                    <p className="text-xs text-green-600 italic mt-1">
                      Đã phản hồi
                    </p>
                  )}
                  {!(review.isVisible ?? true) && (
                    <p className="text-xs text-yellow-600 font-semibold mt-1">
                      [Đã ẩn]
                    </p>
                  )}
                  {review.isPinned && (
                    <p className="text-xs text-blue-600 font-semibold mt-1">
                      [Đã ghim]
                    </p>
                  )}
                </td>
                <td className="p-2">
                  <StarRating
                    rating={review.rating}
                    size={16}
                    isEditable={false}
                  />
                </td>
                <td className="p-2">{review.userName}</td>
                <td className="p-2 text-xs">
                  {productsMap[review.productId] || "Sản phẩm đã bị xóa"}
                </td>
                <td className="p-2 text-xs">
                  {review.createdAt?.toDate().toLocaleDateString("vi-VN")}
                </td>
                <td className="p-2 flex space-x-2">
                  <button
                    onClick={() => {
                      setReplyingTo(review);
                      setReplyText(review.adminReply || "");
                    }}
                    className="text-blue-500 hover:underline text-sm"
                  >
                    {review.adminReply ? "Sửa" : "Phản hồi"}
                  </button>
                  {review.replyHistory && review.replyHistory.length > 1 && (
                    <button
                      onClick={() => setHistoryModalReview(review)}
                      className="text-gray-500"
                      title="Xem lịch sử phản hồi"
                    >
                      <History size={18} />
                    </button>
                  )}
                  <button
                    onClick={() => handleToggleVisibility(review)}
                    className="text-gray-500"
                    title={
                      review.isVisible ?? true
                        ? "Ẩn bình luận"
                        : "Hiện bình luận"
                    }
                  >
                    {review.isVisible ?? true ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                  <button
                    onClick={() => handleDeleteReview(review)}
                    className="text-red-500"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-6 space-x-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <ChevronLeft size={16} className="mr-1" /> Trang trước
          </button>
          <span className="font-semibold text-gray-700 dark:text-gray-300">
            Trang {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-green-600 text-white rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
          >
            Trang sau <ChevronRight size={16} className="ml-1" />
          </button>
        </div>
      )}

      {replyingTo && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Phản hồi đánh giá</h2>
              <button onClick={() => setReplyingTo(null)}>
                <X size={24} />
              </button>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md mb-4 text-sm">
              <p className="font-semibold">
                {replyingTo.userName}{" "}
                <span className="font-normal text-gray-500">đã viết:</span>
              </p>
              <p className="italic">"{replyingTo.comment}"</p>
            </div>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows="4"
              placeholder="Nhập nội dung phản hồi của bạn..."
              className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
            ></textarea>
            <div className="flex justify-end space-x-4 mt-4">
              <button
                onClick={() => setReplyingTo(null)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded"
              >
                Hủy
              </button>
              <button
                onClick={handleReplySubmit}
                className="px-4 py-2 bg-green-600 text-white rounded"
              >
                Gửi phản hồi
              </button>
            </div>
          </div>
        </div>
      )}

      {historyModalReview && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Lịch sử Phản hồi</h2>
              <button onClick={() => setHistoryModalReview(null)}>
                <X size={24} />
              </button>
            </div>
            <div className="overflow-y-auto pr-2 space-y-4">
              {[...historyModalReview.replyHistory]
                .reverse()
                .map((entry, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md"
                  >
                    <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 mb-1">
                      <span>
                        Bởi: <strong>{entry.repliedBy}</strong>
                      </span>
                      <span>
                        {entry.repliedAt?.toDate
                          ? entry.repliedAt.toDate().toLocaleString("vi-VN")
                          : new Date(entry.repliedAt).toLocaleString("vi-VN")}
                      </span>
                    </div>
                    <p>{entry.text}</p>
                  </div>
                ))}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setHistoryModalReview(null)}
                className="px-6 py-2 bg-gray-200 dark:bg-gray-600 rounded-md"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReviewsPage;
