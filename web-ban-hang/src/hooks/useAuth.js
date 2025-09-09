import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/config";

/**
 * Custom hook để theo dõi trạng thái xác thực của người dùng.
 * @returns {{user: object | null, loading: boolean}} - Trả về người dùng hiện tại và trạng thái đang tải.
 */
const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChanged trả về một hàm "unsubscribe"
    // để chúng ta có thể hủy lắng nghe khi component bị unmount.
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Hàm cleanup của useEffect sẽ được gọi khi component unmount
    return () => unsubscribe();
  }, []); // Mảng rỗng đảm bảo useEffect chỉ chạy một lần khi component được mount

  return { user, loading };
};

export default useAuth;
