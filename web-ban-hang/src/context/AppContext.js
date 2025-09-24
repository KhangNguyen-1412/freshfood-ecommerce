import React, { useState, useEffect, createContext, useContext } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  onSnapshot,
  addDoc,
  setDoc,
  getDoc,
  serverTimestamp,
  collection,
  query,
  orderBy,
  getDocs,
  increment,
  deleteDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { toast } from "react-toastify";
import { auth, db } from "../firebase/config";

// 1. Tạo Context
const AppContext = createContext();

// 2. Tạo Provider để bao bọc ứng dụng và cung cấp state
export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [userPermissions, setUserPermissions] = useState({}); // State mới cho quyền
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState(null);
  const [cart, setCart] = useState([]);
  const [page, setPage] = useState("home");
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [searchQuery, setSearchQuery] = useState("");

  const [wishlist, setWishlist] = useState(new Set());
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [brands, setBrands] = useState([]);
  const [brandFilter, setBrandFilter] = useState(null);

  // State mới cho sản phẩm đã xem
  const [recentlyViewed, setRecentlyViewed] = useState(() => {
    const saved = localStorage.getItem("recentlyViewed");
    return saved ? JSON.parse(saved) : [];
  });

  const [compareList, setCompareList] = useState(
    () => JSON.parse(localStorage.getItem("compareList")) || []
  );

  // Effect để lấy danh sách chi nhánh và khôi phục lựa chọn
  useEffect(() => {
    const fetchBranchesAndRestoreSelection = async () => {
      try {
        const q = query(collection(db, "branches"), orderBy("branchName"));
        const snapshot = await getDocs(q);
        const branchesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setBranches(branchesData);

        const savedBranchId = localStorage.getItem("selectedBranchId");
        if (savedBranchId) {
          const savedBranch = branchesData.find((b) => b.id === savedBranchId);
          if (savedBranch) {
            setSelectedBranch(savedBranch);
            const savedDistrict = localStorage.getItem("selectedDistrict");
            if (savedDistrict) {
              setSelectedDistrict(savedDistrict);
            }
          }
        }
      } catch (error) {
        console.error("Lỗi khi tải danh sách chi nhánh:", error);
      }
    };
    fetchBranchesAndRestoreSelection();
  }, []);

  const handleSelectBranch = (branch) => {
    setSelectedBranch(branch);
    localStorage.setItem("selectedBranchId", branch.id);
    setSelectedDistrict(null);
    localStorage.removeItem("selectedDistrict");
  };

  const handleSelectDistrict = (district) => {
    setSelectedDistrict(district);
    localStorage.setItem("selectedDistrict", district);
  };

  const resetBranchSelection = () => {
    setSelectedBranch(null);
    setSelectedDistrict(null);
    localStorage.removeItem("selectedBranchId");
    localStorage.removeItem("selectedDistrict");
  };

  // Effect quản lý Wishlist
  useEffect(() => {
    if (user && db) {
      const wishlistCol = collection(db, "users", user.uid, "wishlist");
      const unsubscribe = onSnapshot(wishlistCol, (snapshot) => {
        const likedProductIds = snapshot.docs.map((doc) => doc.id);
        setWishlist(new Set(likedProductIds));
      });
      return () => unsubscribe();
    } else {
      setWishlist(new Set());
    }
  }, [user]);

  const toggleWishlist = async (productId) => {
    if (!user) {
      toast.info("Vui lòng đăng nhập để sử dụng tính năng này.");
      return;
    }
    const wishlistItemRef = doc(db, "users", user.uid, "wishlist", productId);

    if (wishlist.has(productId)) {
      await deleteDoc(wishlistItemRef);
    } else {
      await setDoc(wishlistItemRef, { addedAt: serverTimestamp() });
    }
  };

  // Effect quản lý Theme (Dark/Light mode)
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  // Effect chính để lắng nghe trạng thái đăng nhập và dữ liệu người dùng
  useEffect(() => {
    let unsubscribeUser = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      unsubscribeUser();

      if (currentUser) {
        try {
          // Bắt buộc làm mới token để nhận custom claims mới nhất
          // Điều này rất quan trọng sau khi vai trò người dùng thay đổi
          await currentUser.getIdToken(true);
        } catch (error) {
          console.error("Lỗi khi làm mới token:", error);
        }

        setUser(currentUser);
        const userDocRef = doc(db, "users", currentUser.uid);

        unsubscribeUser = onSnapshot(
          userDocRef,
          (docSnap) => {
            if (docSnap.exists()) {
              setUserData(docSnap.data());
              // Tải quyền dựa trên vai trò
              const role = docSnap.data().role;
              if (role === "admin") {
                // Admin có tất cả các quyền
                setUserPermissions({ isAdmin: true });
                setLoading(false);
              } else if (role) {
                const roleRef = doc(db, "roles", role);
                getDoc(roleRef).then((roleSnap) => {
                  if (roleSnap.exists()) {
                    setUserPermissions(roleSnap.data().permissions || {});
                  } else {
                    setUserPermissions({}); // Vai trò không tồn tại, không có quyền
                  }
                  setLoading(false);
                });
              }
            } else {
              const newUser = {
                email: currentUser.email,
                displayName: currentUser.displayName || "New User",
                role: "customer",
                createdAt: serverTimestamp(),
                photoURL:
                  currentUser.photoURL ||
                  `https://i.pravatar.cc/150?u=${currentUser.uid}`,
              };
              setDoc(userDocRef, newUser).then(() => {
                setUserData(newUser);
                setLoading(false);
              });
            }
          },
          (error) => {
            console.error("Lỗi khi lấy user data:", error);
            setInitError(
              "Không thể tải dữ liệu người dùng. Vui lòng kiểm tra kết nối và thử lại."
            );
            setLoading(false);
          }
        );
      } else {
        setUser(null);
        setUserData(null);
        setUserPermissions({});
        setLoading(false);
      }
    });

    const qBrands = query(collection(db, "brands"), orderBy("brandName"));
    const unsubscribeBrands = onSnapshot(qBrands, (snapshot) => {
      setBrands(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribeAuth();
      unsubscribeUser();
      unsubscribeBrands();
    };
  }, []);

  // Effect quản lý giỏ hàng
  useEffect(() => {
    if (user) {
      const cartRef = collection(db, "users", user.uid, "cart");
      const unsubscribe = onSnapshot(query(cartRef), async (snapshot) => {
        if (snapshot.empty) {
          setCart([]);
          return;
        }
        const cartItemsPromises = snapshot.docs.map(async (cartDoc) => {
          const cartData = cartDoc.data();
          const variantId = cartDoc.id; // ID của document trong cart chính là variantId
          const productId = cartData.productId; // Lấy productId từ dữ liệu của cart item

          // Nếu không có productId (dữ liệu cũ), hoặc không có variantId, bỏ qua
          if (!productId || !variantId) {
            console.warn(
              "Cart item is missing productId or variantId",
              cartData
            );
            return null;
          }

          const productRef = doc(db, "products", productId);
          // Lấy thông tin biến thể bằng variantId
          const variantRef = doc(productRef, "variants", variantId);

          const [productSnap, variantSnap] = await Promise.all([
            getDoc(productRef),
            getDoc(variantRef),
          ]);

          if (productSnap.exists() && variantSnap.exists()) {
            return {
              ...productSnap.data(), // Dữ liệu sản phẩm cha
              ...variantSnap.data(), // Ghi đè bằng dữ liệu biến thể (giá, ảnh, tên biến thể...)
              id: variantId, // ID của item trong giỏ hàng là ID của biến thể
              productId: productId, // Đảm bảo productId được giữ lại
              quantity: cartData.quantity,
            };
          }
          return null;
        });
        const cartItems = (await Promise.all(cartItemsPromises)).filter(
          (item) => item
        );
        setCart(cartItems);
      });
      return () => unsubscribe();
    } else {
      setCart([]);
    }
  }, [user]);

  // Các hàm xử lý giỏ hàng
  const addToCart = async (product, quantity = 1) => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để thêm sản phẩm.");
      return;
    }
    // Sửa lỗi: Luôn sử dụng ID của biến thể (variant) làm ID trong giỏ hàng.
    // Nếu sản phẩm không có biến thể, ID sản phẩm và ID biến thể mặc định là một.
    // product.id ở đây có thể là variantId nếu được truyền từ ProductDetailPage.
    const cartItemId = product.id;
    if (!cartItemId) {
      console.error("Attempted to add a product to cart with no ID:", product);
      toast.error("Không thể thêm sản phẩm không xác định vào giỏ hàng.");
      return;
    }

    const cartItemRef = doc(db, "users", user.uid, "cart", cartItemId);
    await setDoc(
      cartItemRef,
      {
        quantity: increment(quantity),
        productId: product.productId || product.id, // Lưu ID sản phẩm cha
        addedAt: serverTimestamp(),
      },
      { merge: true }
    );
    toast.success(`${product.name} đã được thêm vào giỏ hàng!`);
  };

  const updateCartQuantity = async (productId, quantity) => {
    if (!user) return;
    const cartItemRef = doc(db, "users", user.uid, "cart", productId);
    if (quantity <= 0) {
      await deleteDoc(cartItemRef);
    } else {
      await updateDoc(cartItemRef, { quantity: quantity });
    }
  };

  const clearCart = async (userId) => {
    if (!userId) return;
    const cartRef = collection(db, "users", userId, "cart");
    const snapshot = await getDocs(cartRef);
    if (!snapshot.empty) {
      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
    }
  };

  const removeItemsFromCart = async (itemIdsToRemove) => {
    if (!user || itemIdsToRemove.length === 0) return;
    const batch = writeBatch(db);
    itemIdsToRemove.forEach((productId) => {
      const cartItemRef = doc(db, "users", user.uid, "cart", productId);
      batch.delete(cartItemRef);
    });
    await batch.commit();
  };

  const cartTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const reorderItems = async (items) => {
    if (!user) {
      toast.info("Vui lòng đăng nhập để thực hiện chức năng này.");
      return;
    }
    if (!items || items.length === 0) {
      toast.warn("Không có sản phẩm nào để thêm lại.");
      return;
    }

    const batch = writeBatch(db);
    let itemsAddedCount = 0;

    for (const item of items) {
      const cartItemRef = doc(db, "users", user.uid, "cart", item.id);
      batch.set(
        cartItemRef,
        {
          quantity: increment(item.quantity),
          addedAt: serverTimestamp(),
        },
        { merge: true }
      );
      itemsAddedCount++;
    }

    await batch.commit();
    toast.success(`Đã thêm ${itemsAddedCount} sản phẩm vào giỏ hàng!`);
  };

  const addRecentlyViewed = (productId) => {
    setRecentlyViewed((prev) => {
      // Xóa sản phẩm nếu đã tồn tại để đưa lên đầu
      const updatedList = prev.filter((id) => id !== productId);
      // Thêm sản phẩm mới vào đầu danh sách
      const newList = [productId, ...updatedList];
      // Giới hạn danh sách (ví dụ: 20 sản phẩm)
      const limitedList = newList.slice(0, 20);
      // Lưu vào localStorage
      localStorage.setItem("recentlyViewed", JSON.stringify(limitedList));
      return limitedList;
    });
  };

  // Hàm tiện ích để tạo thông báo
  const createNotification = async (userId, notificationData) => {
    if (!userId) return;
    try {
      const notificationsCol = collection(db, "users", userId, "notifications");
      await addDoc(notificationsCol, {
        ...notificationData,
        isRead: false,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Lỗi khi tạo thông báo:", error);
    }
  };

  const toggleCompare = (product) => {
    setCompareList((prev) => {
      const isComparing = prev.some((p) => p.id === product.id);
      if (isComparing) {
        toast.info(`Đã xóa "${product.name}" khỏi danh sách so sánh.`);
        return prev.filter((p) => p.id !== product.id);
      } else {
        if (prev.length >= 4) {
          toast.warn("Bạn chỉ có thể so sánh tối đa 4 sản phẩm.");
          return prev;
        }
        toast.success(`Đã thêm "${product.name}" vào danh sách so sánh.`);
        return [...prev, product];
      }
    });
  };

  const removeFromCompare = (productId) => {
    setCompareList((prev) => prev.filter((p) => p.id !== productId));
  };

  const clearCompareList = () => {
    setCompareList([]);
    toast.info("Đã xóa danh sách so sánh.");
  };

  if (initError) {
    return (
      <div className="flex items-center justify-center h-screen text-center p-4 bg-red-50">
        <div>
          <h1 className="text-2xl font-bold text-red-700">
            Lỗi Cấu Hình Firebase
          </h1>
          <p className="mt-2 text-red-900">{initError}</p>
        </div>
      </div>
    );
  }

  // Giá trị được cung cấp bởi Context cho toàn bộ ứng dụng
  const value = {
    user,
    userData,
    userPermissions, // Cung cấp quyền cho toàn ứng dụng
    loading,
    page,
    setPage,
    cart,
    cartTotal,
    addToCart,
    updateCartQuantity,
    clearCart,
    theme,
    toggleTheme,
    searchQuery,
    setSearchQuery,
    wishlist,
    toggleWishlist,
    branches,
    selectedBranch,
    selectedDistrict,
    handleSelectBranch,
    handleSelectDistrict,
    resetBranchSelection,
    brands,
    brandFilter,
    setBrandFilter,
    removeItemsFromCart,
    reorderItems, // Thêm hàm này vào giá trị của context
    recentlyViewed,
    addRecentlyViewed,
    createNotification, // Thêm hàm mới vào context
    compareList,
    toggleCompare,
    removeFromCompare,
    clearCompareList,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// 3. Tạo custom hook để sử dụng Context dễ dàng hơn
export const useAppContext = () => useContext(AppContext);
