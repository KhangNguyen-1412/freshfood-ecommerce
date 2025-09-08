// src/pages/ProfilePage.js

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  deleteDoc,
  writeBatch,
  increment,
  serverTimestamp,
} from "firebase/firestore";
import {
  updateProfile,
  EmailAuthProvider,
  reauthenticateWithCredential,
  deleteUser,
} from "firebase/auth";
import { db, auth } from "../firebase/config";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-toastify";
import SEO from "../components/common/SEO";

// Component imports
import Spinner from "../components/common/Spinner";
import ProfileTabs from "../components/profile/ProfileTabs";
import WishlistTab from "../components/profile/WishlistTab";
import AddressForm from "../components/profile/AddressForm";
import ReauthenticationModal from "../components/auth/ReauthenticationModal";

// Utility & Icon imports
import { formatCurrency } from "../utils/formatCurrency";
import { CreditCard, AlertTriangle, PlusCircle } from "lucide-react";

// CSS imports
import "../styles/pages.css"; // CSS cho layout trang chung
import "../styles/profile.css"; // CSS đặc thù cho trang profile

const ProfilePage = () => {
  const { user, userData, setPage } = useAppContext();
  const [activeTab, setActiveTab] = useState("orders");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    displayName: "",
    gender: "",
    dob: "",
  });
  const [addresses, setAddresses] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pointsHistory, setPointsHistory] = useState([]);

  useEffect(() => {
    if (!user) return;
    const pointsHistoryRef = collection(db, "users", user.uid, "pointsHistory");
    const q = query(pointsHistoryRef, orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPointsHistory(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (userData) {
      setProfileData({
        displayName: userData.displayName || "",
        gender: userData.gender || "",
        dob: userData.dob || "",
      });
    }
  }, [userData]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const qOrders = query(
      collection(db, "orders"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsubscribeOrders = onSnapshot(qOrders, (snapshot) => {
      setOrders(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    const qAddresses = query(collection(db, "users", user.uid, "addresses"));
    const unsubscribeAddresses = onSnapshot(qAddresses, (snapshot) => {
      setAddresses(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => {
      unsubscribeOrders();
      unsubscribeAddresses();
    };
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    try {
      const dataToUpdate = {
        displayName: profileData.displayName,
        gender: profileData.gender,
        dob: profileData.dob,
      };
      if (profileData.displayName !== user.displayName) {
        await updateProfile(user, { displayName: profileData.displayName });
      }
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, dataToUpdate);
      toast.success("Cập nhật thông tin thành công!");
      setIsEditing(false);
    } catch (error) {
      toast.error("Đã có lỗi xảy ra khi cập nhật thông tin.");
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile || !user) return;
    setIsUploadingAvatar(true);
    const CLOUDINARY_CLOUD_NAME = "web_ban-hang"; // Thay bằng cloud name của bạn
    const CLOUDINARY_UPLOAD_PRESET = "user_avatars"; // Thay bằng upload preset của bạn

    const formData = new FormData();
    formData.append("file", avatarFile);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );
      const data = await res.json();
      const newPhotoURL = data.secure_url;

      if (newPhotoURL) {
        await updateProfile(auth.currentUser, { photoURL: newPhotoURL });
        await updateDoc(doc(db, "users", user.uid), { photoURL: newPhotoURL });
        toast.success("Cập nhật ảnh đại diện thành công!");
        setAvatarFile(null);
      }
    } catch (error) {
      toast.error("Đã có lỗi xảy ra khi tải ảnh lên.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSaveAddress = async (addressData) => {
    if (!user) return;
    const addressesCol = collection(db, "users", user.uid, "addresses");
    if (editingAddress) {
      await updateDoc(doc(addressesCol, editingAddress.id), addressData);
    } else {
      await addDoc(addressesCol, addressData);
    }
    setShowAddressForm(false);
    setEditingAddress(null);
  };

  const handleDeleteAddress = async (addressId) => {
    if (window.confirm("Bạn có chắc muốn xóa địa chỉ này?")) {
      await deleteDoc(doc(db, "users", user.uid, "addresses", addressId));
    }
  };

  const handlePaymentMethodChange = async (e) => {
    if (!user) return;
    await updateDoc(doc(db, "users", user.uid), {
      defaultPaymentMethod: e.target.value,
    });
    toast.success("Đã cập nhật phương thức thanh toán mặc định!");
  };

  const handleDeleteAccount = async (password) => {
    if (!user) return;
    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);
    await deleteDoc(doc(db, "users", user.uid));
    await deleteUser(user);
    toast.success("Tài khoản của bạn đã được xóa thành công.");
    setShowDeleteModal(false);
  };

  const handleCancelOrder = async (orderId) => {
    if (window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này?")) {
      await updateDoc(doc(db, "orders", orderId), { status: "Đã hủy" });
      toast.success("Đã hủy đơn hàng thành công.");
    }
  };
  const handleRedeemPoints = async (pointsToRedeem, voucherValue) => {
    if (!user || userData.loyaltyPoints < pointsToRedeem) {
      toast.error("Bạn không đủ điểm để đổi vật phẩm này.");
      return;
    }
    const voucherCode = `VOUCHER_${user.uid.substring(0, 5)}_${Date.now()}`;
    const userRef = doc(db, "users", user.uid);
    const historyRef = doc(collection(userRef, "pointsHistory"));
    const promoRef = doc(db, "promotions", voucherCode);
    try {
      const batch = writeBatch(db);
      batch.update(userRef, { loyaltyPoints: increment(-pointsToRedeem) });
      batch.set(historyRef, {
        pointsChanged: -pointsToRedeem,
        reason: `Đổi điểm lấy voucher ${formatCurrency(voucherValue)}`,
        createdAt: serverTimestamp(),
      });
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
      batch.set(promoRef, {
        code: voucherCode,
        description: `Voucher đổi từ ${pointsToRedeem} điểm`,
        discountType: "fixed",
        discountValue: voucherValue,
        expiresAt: expiryDate,
        minimumPurchaseAmount: 0,
        createdAt: serverTimestamp(),
      });
      await batch.commit();
      toast.success(
        `Đổi điểm thành công! Mã voucher của bạn là: ${voucherCode}`
      );
    } catch (error) {
      toast.error("Đã có lỗi xảy ra, vui lòng thử lại.");
    }
  };
  const getStatusClass = (status) =>
    ({
      "Đang xử lý": "bg-yellow-100 text-yellow-800",
      "Đang giao hàng": "bg-blue-100 text-blue-800",
      "Hoàn thành": "bg-green-100 text-green-800",
      "Đã hủy": "bg-red-100 text-red-800",
    }[status] || "bg-gray-100 text-gray-800");

  if (loading) return <Spinner />;

  return (
    <>
      <SEO title={`Tài khoản của ${userData?.displayName || "bạn"}`} />
      <div className="page-container">
        <h1 className="page-title">Tài khoản của tôi</h1>

        <div className="page-section mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Thông tin cá nhân</h2>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-blue-500 hover:underline"
              >
                Chỉnh sửa
              </button>
            )}
          </div>
          <div className="flex flex-col items-center mb-6">
            <img
              src={user?.photoURL || `https://i.pravatar.cc/150?u=${user?.uid}`}
              alt="avatar"
              className="h-24 w-24 rounded-full object-cover mb-4"
            />
            <input
              type="file"
              id="avatarUpload"
              className="hidden"
              accept="image/*"
              onChange={(e) => setAvatarFile(e.target.files[0])}
            />
            <label
              htmlFor="avatarUpload"
              className="cursor-pointer bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-md text-sm hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Chọn ảnh mới
            </label>
            {avatarFile && (
              <div className="text-center mt-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {avatarFile.name}
                </p>
                <button
                  onClick={handleAvatarUpload}
                  disabled={isUploadingAvatar}
                  className="mt-2 px-4 py-2 bg-green-600 text-white rounded disabled:bg-gray-400"
                >
                  {isUploadingAvatar ? "Đang tải lên..." : "Lưu ảnh"}
                </button>
              </div>
            )}
          </div>
          {isEditing ? (
            <div className="space-y-4 border-t dark:border-gray-700 pt-4">
              <div>
                <label className="block text-sm font-medium">
                  Tên hiển thị
                </label>
                <input
                  type="text"
                  value={profileData.displayName}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      displayName: e.target.value,
                    })
                  }
                  className="mt-1 block w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">Giới tính</label>
                  <select
                    value={profileData.gender}
                    onChange={(e) =>
                      setProfileData({ ...profileData, gender: e.target.value })
                    }
                    className="mt-1 block w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value="">-- Chọn giới tính --</option>
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">Ngày sinh</label>
                  <input
                    type="date"
                    value={profileData.dob}
                    onChange={(e) =>
                      setProfileData({ ...profileData, dob: e.target.value })
                    }
                    className="mt-1 block w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
              </div>
              <p>
                <strong>Email:</strong> {user?.email} (không thể thay đổi)
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveProfile}
                  className="px-4 py-2 bg-green-600 text-white rounded"
                >
                  Lưu thay đổi
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-center md:text-left border-t dark:border-gray-700 pt-4">
              <p>
                <strong>Tên hiển thị:</strong> {userData?.displayName}
              </p>
              <p>
                <strong>Giới tính:</strong>{" "}
                {userData?.gender || "Chưa cập nhật"}
              </p>
              <p>
                <strong>Ngày sinh:</strong> {userData?.dob || "Chưa cập nhật"}
              </p>
              <p>
                <strong>Email:</strong> {user?.email}
              </p>
            </div>
          )}
        </div>

        <div className="mb-8">
          <ProfileTabs activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>

        <div>
          {activeTab === "orders" && (
            <div className="page-section">
              <h2 className="text-xl font-bold mb-4">Lịch sử đơn hàng</h2>
              <div className="space-y-4">
                {orders.length > 0 ? (
                  orders.map((order) => (
                    <div
                      key={order.id}
                      className="border-t dark:border-gray-700 p-4 rounded-md"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold">
                            Mã đơn hàng: #{order.id.substring(0, 8)}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Ngày đặt:{" "}
                            {order.createdAt
                              ? new Date(
                                  order.createdAt.toDate()
                                ).toLocaleDateString("vi-VN")
                              : "N/A"}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        {order.items.length} sản phẩm
                      </div>
                      <div className="flex justify-between items-end mt-2">
                        <p className="font-bold">
                          Tổng tiền: {formatCurrency(order.totalAmount)}
                        </p>
                        <div className="flex items-center space-x-4">
                          {order.status === "Đang xử lý" && (
                            <button
                              onClick={() => handleCancelOrder(order.id)}
                              className="text-sm text-red-500 hover:underline"
                            >
                              Hủy đơn
                            </button>
                          )}
                          {order.status === "Hoàn thành" && !order.reviewed && (
                            <Link
                              to={`/profile/review/${order.id}`}
                              state={{ order: order }}
                              className="text-sm text-green-600 hover:underline font-semibold"
                            >
                              Đánh giá
                            </Link>
                          )}
                          <Link
                            to={`/profile/orders/${order.id}`}
                            state={{ order: order }}
                            className="text-sm text-blue-500 hover:underline font-semibold"
                          >
                            Xem chi tiết
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p>Bạn chưa có đơn hàng nào.</p>
                )}
              </div>
            </div>
          )}
          {activeTab === "points" && (
            <div className="space-y-6 animate-fade-in">
              <div className="page-section text-center">
                <p className="text-lg text-gray-500 dark:text-gray-400">
                  Điểm thưởng của bạn
                </p>
                <p className="text-5xl font-bold text-green-600 my-2">
                  {userData?.loyaltyPoints || 0}
                </p>
                <p className="text-sm text-gray-400">
                  Tích lũy khi mua hàng, đổi lấy voucher giảm giá!
                </p>
              </div>
              <div className="page-section">
                <h3 className="text-xl font-bold mb-4">Đổi thưởng</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 border dark:border-gray-700 rounded-md">
                    <div>
                      <p className="font-semibold">Voucher giảm 20.000đ</p>
                      <p className="text-sm text-yellow-500">Cần 500 điểm</p>
                    </div>
                    <button
                      onClick={() => handleRedeemPoints(500, 20000)}
                      disabled={userData?.loyaltyPoints < 500}
                      className="px-4 py-2 text-sm bg-green-600 text-white rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      Đổi
                    </button>
                  </div>
                  <div className="flex justify-between items-center p-3 border dark:border-gray-700 rounded-md">
                    <div>
                      <p className="font-semibold">Voucher giảm 50.000đ</p>
                      <p className="text-sm text-yellow-500">Cần 1000 điểm</p>
                    </div>
                    <button
                      onClick={() => handleRedeemPoints(1000, 50000)}
                      disabled={userData?.loyaltyPoints < 1000}
                      className="px-4 py-2 text-sm bg-green-600 text-white rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      Đổi
                    </button>
                  </div>
                </div>
              </div>
              <div className="page-section">
                <h3 className="text-xl font-bold mb-4">Lịch sử điểm</h3>
                <div className="space-y-2">
                  {pointsHistory.length > 0 ? (
                    pointsHistory.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center border-b dark:border-gray-700 py-2 last:border-0"
                      >
                        <div>
                          <p className="font-semibold">{item.reason}</p>
                          <p className="text-xs text-gray-500">
                            {item.createdAt?.toDate().toLocaleString("vi-VN")}
                          </p>
                        </div>
                        <p
                          className={`font-bold text-lg ${
                            item.pointsChanged > 0
                              ? "text-green-500"
                              : "text-red-500"
                          }`}
                        >
                          {item.pointsChanged > 0
                            ? `+${item.pointsChanged}`
                            : item.pointsChanged}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">
                      Chưa có lịch sử giao dịch điểm.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
          {activeTab === "wishlist" && <WishlistTab />}
          {activeTab === "addresses" && (
            <div className="page-section">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Sổ địa chỉ</h2>
                <button
                  onClick={() => {
                    setEditingAddress(null);
                    setShowAddressForm(true);
                  }}
                  className="flex items-center text-green-600 hover:underline"
                >
                  <PlusCircle size={18} className="mr-1" /> Thêm địa chỉ mới
                </button>
              </div>
              <div className="space-y-4">
                {addresses.length > 0 ? (
                  addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className="border-t dark:border-gray-700 pt-4"
                    >
                      <p className="font-semibold">
                        {addr.name} - {addr.phone}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {addr.address}
                      </p>
                      <div className="flex space-x-4 mt-2">
                        <button
                          onClick={() => {
                            setEditingAddress(addr);
                            setShowAddressForm(true);
                          }}
                          className="text-sm text-blue-500"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="text-sm text-red-500"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p>Bạn chưa có địa chỉ nào được lưu.</p>
                )}
              </div>
            </div>
          )}
          {activeTab === "settings" && (
            <>
              <div className="page-section mb-8">
                <h2 className="text-xl font-bold mb-4 flex items-center">
                  <CreditCard size={20} className="mr-2" /> Cài đặt thanh toán
                </h2>
                <div className="space-y-2">
                  <p className="text-gray-600 dark:text-gray-400">
                    Chọn phương thức thanh toán mặc định.
                  </p>
                  <div>
                    <label className="flex items-center p-3 border rounded-md cursor-pointer dark:border-gray-700">
                      <input
                        type="radio"
                        name="defaultPayment"
                        value="COD"
                        checked={
                          userData?.defaultPaymentMethod === "COD" ||
                          !userData?.defaultPaymentMethod
                        }
                        onChange={handlePaymentMethodChange}
                        className="mr-3"
                      />
                      Thanh toán khi nhận hàng (COD)
                    </label>
                  </div>
                  <div>
                    <label className="flex items-center p-3 border rounded-md cursor-pointer dark:border-gray-700">
                      <input
                        type="radio"
                        name="defaultPayment"
                        value="QR"
                        checked={userData?.defaultPaymentMethod === "QR"}
                        onChange={handlePaymentMethodChange}
                        className="mr-3"
                      />
                      Chuyển khoản qua mã QR
                    </label>
                  </div>
                </div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold text-red-700 dark:text-red-400 mb-4 flex items-center">
                  <AlertTriangle size={20} className="mr-2" /> Khu vực nguy hiểm
                </h2>
                <p className="text-red-600 dark:text-red-300 mb-4">
                  Hành động dưới đây không thể được hoàn tác.
                </p>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="bg-red-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-red-700"
                >
                  Xóa tài khoản của tôi
                </button>
              </div>
            </>
          )}
        </div>

        {showAddressForm && (
          <AddressForm
            address={editingAddress}
            onSave={handleSaveAddress}
            onCancel={() => setShowAddressForm(false)}
          />
        )}
        {showDeleteModal && (
          <ReauthenticationModal
            onConfirm={handleDeleteAccount}
            onCancel={() => setShowDeleteModal(false)}
          />
        )}
      </div>
    </>
  );
};

export default ProfilePage;
