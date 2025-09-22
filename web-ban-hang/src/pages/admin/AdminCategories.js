import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import { toast } from "react-toastify";
import * as ExcelJS from "exceljs";
import Spinner from "../../components/common/Spinner";
import CategoryForm from "../../components/category/CategoryForm";
import CategoryExcelUploadModal from "../../components/category/CategoryExcelUploadModal";
import {
  ChevronDown,
  ChevronRight,
  Edit,
  Trash2,
  Upload,
  Download,
} from "lucide-react";
import "../../styles/admin.css";

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [openCategoryId, setOpenCategoryId] = useState(null);

  useEffect(() => {
    const qCategories = query(collection(db, "categories"), orderBy("name"));
    const unsubscribeCategories = onSnapshot(qCategories, (snapshot) => {
      setCategories(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
      setLoading(false);
    });

    const qBranches = query(collection(db, "branches"));
    const unsubscribeBranches = onSnapshot(qBranches, (snapshot) => {
      setBranches(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribeCategories();
      unsubscribeBranches();
    };
  }, []);

  const handleSaveCategory = async (categoryData) => {
    try {
      if (editingCategory) {
        await updateDoc(
          doc(db, "categories", editingCategory.id),
          categoryData
        );
      } else {
        await addDoc(collection(db, "categories"), {
          ...categoryData,
          createdAt: serverTimestamp(),
        });
      }
      setShowForm(false);
      setEditingCategory(null);
    } catch (error) {
      console.error("Lỗi khi lưu danh mục:", error);
      toast.error("Đã có lỗi xảy ra khi lưu danh mục.");
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setShowForm(true);
  };

  const handleDelete = async (categoryId) => {
    if (
      window.confirm(
        "Bạn có chắc muốn xóa danh mục này? Các danh mục con (nếu có) sẽ không bị xóa."
      )
    ) {
      await deleteDoc(doc(db, "categories", categoryId));
    }
  };

  const handleToggleCategory = (categoryId) => {
    setOpenCategoryId((prevId) => (prevId === categoryId ? null : categoryId));
  };

  const handleExportTemplate = async () => {
    if (categories.length === 0 || branches.length === 0) {
      toast.warn("Cần có ít nhất một danh mục và chi nhánh để tạo file.");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const productSheet = workbook.addWorksheet("Sản phẩm nhập kho");
    const categorySheet = workbook.addWorksheet("Danh sách Danh mục");
    categorySheet.state = "hidden";

    const categoryNames = categories.map((cat) => [cat.name]);
    categorySheet.addRows(categoryNames);

    const columns = [
      { header: "product_group_id", key: "product_group_id", width: 30 },
      { header: "product_name", key: "product_name", width: 40 },
      { header: "description", key: "description", width: 50 },
      { header: "category_name", key: "category_name", width: 30 },
      { header: "brand_name", key: "brand_name", width: 20 },
      { header: "variant_name", key: "variant_name", width: 20 },
      { header: "price", key: "price", width: 15 },
      { header: "sale_price", key: "sale_price", width: 15 },
      { header: "on_sale", key: "on_sale", width: 10 },
      { header: "sku", key: "sku", width: 20 },
      { header: "variant_image_url", key: "variant_image_url", width: 50 },
      { header: "is_default_variant", key: "is_default_variant", width: 15 },
      { header: "product_image_url_1", key: "product_image_url_1", width: 50 },
      { header: "product_image_url_2", key: "product_image_url_2", width: 50 },
      { header: "product_image_url_3", key: "product_image_url_3", width: 50 },
    ];
    branches.forEach((branch) => {
      columns.push({
        header: `stock_${branch.branchName.replace(/\s+/g, "_")}`,
        key: `stock_${branch.id}`, // Giữ key là ID để xử lý
        width: 20,
      });
    });
    productSheet.columns = columns;

    for (let i = 2; i <= 1000; i++) {
      productSheet.getCell(`B${i}`).dataValidation = {
        type: "list", // Sửa lại cột category
        allowBlank: false,
        formulae: [`'Danh sách Danh mục'!$A$1:$A$${categories.length}`],
        showErrorMessage: true,
        errorStyle: "error",
        errorTitle: "Dữ liệu không hợp lệ",
        error: "Vui lòng chọn một danh mục từ danh sách thả xuống.",
      };
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const link = document.createElement("a"); // Sửa lại tên file
    link.href = URL.createObjectURL(blob);
    link.download = "Mau_Them_San_Pham_Va_Bien_The.xlsx";
    link.click();
  };

  const parentCategories = categories.filter((cat) => !cat.parentId);
  const structuredCategories = parentCategories.map((parent) => ({
    ...parent,
    children: categories.filter((child) => child.parentId === parent.id),
  }));

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Quản lý Danh mục</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowExcelModal(true)}
            className="admin-button-blue"
          >
            <Upload size={18} className="mr-2" /> Thêm từ Excel
          </button>
          <button onClick={handleExportTemplate} className="admin-button-teal">
            <Download size={18} className="mr-2" /> Tải file mẫu
          </button>
          <button
            onClick={() => {
              setEditingCategory(null);
              setShowForm(true);
            }}
            className="admin-button-green"
          >
            Thêm thủ công
          </button>
        </div>
      </div>

      {showExcelModal && (
        <CategoryExcelUploadModal
          onCancel={() => setShowExcelModal(false)}
          onUploadSuccess={() => setShowExcelModal(false)}
        />
      )}

      {showForm && (
        <CategoryForm
          category={editingCategory}
          onSave={handleSaveCategory}
          onCancel={() => setShowForm(false)}
          parentCategories={parentCategories}
        />
      )}

      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md mt-6">
        {structuredCategories.map((parent) => (
          <div
            key={parent.id}
            className="border-b dark:border-gray-700 last:border-b-0 py-2"
          >
            <div
              className="flex justify-between items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded"
              onClick={() => handleToggleCategory(parent.id)}
            >
              <div className="flex items-center">
                {parent.children.length > 0 ? (
                  openCategoryId === parent.id ? (
                    <ChevronDown size={20} className="mr-2 text-gray-500" />
                  ) : (
                    <ChevronRight size={20} className="mr-2 text-gray-500" />
                  )
                ) : (
                  <div className="w-[28px]"></div>
                )}
                <span className="font-semibold">{parent.name}</span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(parent);
                  }}
                  className="text-blue-500"
                >
                  <Edit size={18} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(parent.id);
                  }}
                  className="text-red-500"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            {openCategoryId === parent.id && parent.children.length > 0 && (
              <div className="pl-12 mt-2 space-y-2 animate-fade-in">
                {parent.children.map((child) => (
                  <div
                    key={child.id}
                    className="flex justify-between items-center py-1 px-2 rounded hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    <span>- {child.name}</span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(child)}
                        className="text-blue-500"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(child.id)}
                        className="text-red-500"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminCategories;
