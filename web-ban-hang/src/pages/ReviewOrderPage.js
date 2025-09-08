import React, { useState, useEffect } from "react";
import { useParams, useLocation, Link, useNavigate } from "react-router-dom";
import {
  doc,
  collection,
  runTransaction,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-toastify";
import StarRating from "../components/common/StarRating";
import { ArrowLeft } from "lucide-react";
import "../styles/pages.css";
import SEO from "../components/common/SEO";

const ReviewOrderPage = () => {
  const { orderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userData } = useAppContext();

  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!order);
  const [reviews, setReviews] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!order && orderId) {
      const fetchOrder = async () => {
        const docRef = doc(db, "orders", orderId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setOrder({ id: docSnap.id, ...docSnap.data() });
        }
        setLoading(false);
      };
      fetchOrder();
    }
  }, [order, orderId]);

  const handleReviewChange = (productId, field, value) => {
    setReviews((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], [field]: value },
    }));
  };

  const handleSubmitReviews = async () => {
    if (!user) return;
    setIsSubmitting(true);
    const reviewsToSubmit = Object.entries(reviews).filter(
      ([_, data]) => data.rating > 0
    );
    if (reviewsToSubmit.length === 0) {
      toast.error("Vui lòng đánh giá ít nhất một sản phẩm.");
      setIsSubmitting(false);
      return;
    }
    try {
      for (const [productId, reviewData] of reviewsToSubmit) {
        const productRef = doc(db, "products", productId);
        const reviewRef = doc(collection(db, "products", productId, "reviews"));
        await runTransaction(db, async (transaction) => {
          const productDoc = await transaction.get(productRef);
          if (!productDoc.exists()) throw new Error("Sản phẩm không tồn tại!");
          const currentData = productDoc.data();
          const currentRating = currentData.averageRating || 0;
          const currentCount = currentData.reviewCount || 0;
          const newCount = currentCount + 1;
          const newAverageRating =
            (currentRating * currentCount + reviewData.rating) / newCount;
          transaction.update(productRef, {
            averageRating: newAverageRating,
            reviewCount: newCount,
          });
          transaction.set(reviewRef, {
            ...reviewData,
            userId: user.uid,
            userName: userData.displayName,
            userAvatar: userData.photoURL || null,
            createdAt: serverTimestamp(),
            orderId: order.id,
          });
        });
      }
      toast.success("Cảm ơn bạn đã gửi đánh giá!");
      navigate("/profile", { replace: true });
    } catch (error) {
      console.error("Lỗi khi gửi đánh giá:", error);
      toast.error("Đã có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <SEO title={`Đánh giá đơn hàng #${order.id.substring(0, 8)}`} />
      <div className="page-container">
        <Link
          to="/profile"
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={20} className="mr-2" /> Quay lại Lịch sử đơn hàng
        </Link>
        <h1 className="text-3xl font-bold mb-2">Đánh giá đơn hàng</h1>
        <p className="font-mono text-sm text-gray-500 mb-6">#{order.id}</p>
        <div className="space-y-6">
          {order.items.map((item) => (
            <div key={item.id} className="review-item-card">
              <img
                src={item.imageUrls?.[0] || "https://placehold.co/100x100"}
                alt={item.name}
                className="w-24 h-24 object-cover rounded-md"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{item.name}</h3>
                <div className="mt-2">
                  <p className="font-medium mb-1">Xếp hạng của bạn:</p>
                  <StarRating
                    rating={reviews[item.id]?.rating || 0}
                    onRatingChange={(rating) =>
                      handleReviewChange(item.id, "rating", rating)
                    }
                  />
                </div>
                <textarea
                  placeholder="Viết bình luận của bạn về sản phẩm này..."
                  className="w-full p-2 border rounded-md mt-4 dark:bg-gray-700 dark:border-gray-600"
                  rows="3"
                  value={reviews[item.id]?.comment || ""}
                  onChange={(e) =>
                    handleReviewChange(item.id, "comment", e.target.value)
                  }
                ></textarea>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <button
            onClick={handleSubmitReviews}
            disabled={isSubmitting}
            className="review-submit-button"
          >
            {isSubmitting ? "Đang gửi..." : "Hoàn tất đánh giá"}
          </button>
        </div>
      </div>
    </>
  );
};

export default ReviewOrderPage;
