import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  collectionGroup,
  query,
  orderBy,
  onSnapshot,
  doc,
  runTransaction,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import { useAppContext } from "../../context/AppContext";
import { toast } from "react-toastify";
import Spinner from "../../components/common/Spinner";
import StarRating from "../../components/common/StarRating";
import { Trash2, X } from "lucide-react";
import "../../styles/admin.css";

const AdminReviewsPage = () => {
  const [allReviews, setAllReviews] = useState([]);
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [productsMap, setProductsMap] = useState({});

  const { userData } = useAppContext();
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Lấy tên sản phẩm để hiển thị
        // SỬA LẠI DÒNG DƯỚI ĐÂY: Dùng getDocs() thay vì .get()
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
  }, []);

  useEffect(() => {
    if (searchTerm === "") {
      setFilteredReviews(allReviews);
    } else {
      setFilteredReviews(
        allReviews.filter(
          (review) =>
            (review.comment &&
              review.comment
                .toLowerCase()
                .includes(searchTerm.toLowerCase())) ||
            (review.userName &&
              review.userName.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      );
    }
  }, [searchTerm, allReviews]);

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
      await updateDoc(reviewRef, {
        adminReply: replyText,
        repliedAt: serverTimestamp(),
        repliedBy: userData.displayName,
      });
      toast.success("Gửi phản hồi thành công!");
      setReplyingTo(null);
      setReplyText("");
    } catch (error) {
      toast.error("Gửi phản hồi thất bại.");
      console.error("Lỗi khi phản hồi:", error);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <h1 className="admin-page-title">Quản lý Bình luận</h1>
      <div className="reviews-search-bar">
        <input
          type="text"
          placeholder="Tìm kiếm..."
          className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

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
            {filteredReviews.map((review) => (
              <tr
                key={review.id}
                className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td className="p-2 text-sm max-w-sm">
                  <p className="truncate">{review.comment}</p>
                  {review.adminReply && (
                    <p className="text-xs text-green-600 italic mt-1">
                      Đã phản hồi
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
    </div>
  );
};

export default AdminReviewsPage;
