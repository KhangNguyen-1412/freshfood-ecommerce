import React, { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase/config";
import { ChevronDown, ChevronRight } from "lucide-react";
import "../../styles/ui.css";

const CategorySidebar = ({ onSelectCategory }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openParentId, setOpenParentId] = useState(null);

  useEffect(() => {
    const q = query(collection(db, "categories"), orderBy("name"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const cats = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const parentCategories = cats.filter((cat) => !cat.parentId);
      const structuredCategories = parentCategories.map((parent) => ({
        ...parent,
        children: cats.filter((child) => child.parentId === parent.id),
      }));
      setCategories(structuredCategories);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleParentClick = (parentId) => {
    setOpenParentId((prevId) => (prevId === parentId ? null : parentId));
    onSelectCategory(parentId);
  };

  if (loading) {
    return <aside className="w-full md:w-64 p-4">Đang tải danh mục...</aside>;
  }

  return (
    <aside className="category-sidebar">
      <h2 className="category-sidebar-title">Danh mục sản phẩm</h2>
      <nav>
        <ul>
          <li className="mb-2">
            <button
              onClick={() => {
                onSelectCategory(null);
                setOpenParentId(null);
              }}
              className="category-sidebar-link-all"
            >
              Tất cả sản phẩm
            </button>
          </li>
          {categories.map((parent) => (
            <li key={parent.id} className="mb-1">
              <button
                onClick={() => handleParentClick(parent.id)}
                className="category-sidebar-link category-sidebar-parent-link"
              >
                <span>{parent.name}</span>
                {parent.children.length > 0 &&
                  (openParentId === parent.id ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  ))}
              </button>

              {parent.children.length > 0 && openParentId === parent.id && (
                <ul className="category-sidebar-child-list">
                  {parent.children.map((child) => (
                    <li key={child.id}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCategory(child.id);
                        }}
                        className="category-sidebar-link category-sidebar-child-link"
                      >
                        {child.name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default CategorySidebar;
