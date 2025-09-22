import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase/config";
import Spinner from "../components/common/Spinner";
import SEO from "../components/common/SEO";
import "../styles/pages.css";

const BlogListPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "content"),
      where("type", "==", "blog"),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <Spinner />;

  return (
    <>
      <SEO
        title="Blog - Mẹo vặt & Công thức"
        description="Khám phá các bài viết hữu ích về mẹo nấu ăn, công thức chế biến và thông tin dinh dưỡng từ FreshFood."
      />
      <div className="page-container animate-fade-in">
        <h1 className="content-title">Blog</h1>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
          Khám phá các bài viết hữu ích về mẹo nấu ăn, công thức chế biến và
          thông tin dinh dưỡng từ FreshFood.
        </p>
        <div className="max-w-4xl mx-auto space-y-8">
          {posts.length > 0 ? (
            posts.map((post) => (
              <Link
                key={post.id}
                to={`/pages/${post.slug}`}
                className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow"
              >
                <h2 className="text-2xl font-bold text-green-700 dark:text-green-400 mb-2">
                  {post.title}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  Đăng ngày:{" "}
                  {new Date(post.createdAt?.toDate()).toLocaleDateString(
                    "vi-VN"
                  )}
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  {post.content.substring(0, 200)}...
                </p>
              </Link>
            ))
          ) : (
            <p className="text-center text-gray-500 py-10">
              Chưa có bài viết nào.
            </p>
          )}
        </div>
      </div>
    </>
  );
};

export default BlogListPage;
