import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  deleteDoc,
} from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { db, auth } from "../firebase/config";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-toastify";
import SEO from "../components/common/SEO";

// Component imports
import Spinner from "../components/common/Spinner";
import ProfileTabs from "../components/profile/ProfileTabs";
import AddressForm from "../components/profile/AddressForm";
import OrdersTab from "../components/profile/OrdersTab";
import PointsTab from "../components/profile/PointsTab";
import SettingsTab from "../components/profile/SettingsTab";
import WishlistTab from "../components/profile/WishlistTab";
import AddressesTab from "../components/profile/AddressesTab";

// CSS imports
import "../styles/pages.css";
import "../styles/profile.css";

const ProfilePage = () => {
  const { user, userData } = useAppContext();
  const [activeTab, setActiveTab] = useState("orders");
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    displayName: "",
    gender: "",
    dob: "",
  });
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  useEffect(() => {
    if (userData) {
      setProfileData({
        displayName: userData.displayName || "",
        gender: userData.gender || "",
        dob: userData.dob || "",
      });
      setLoading(false);
    } else if (!user) {
      setLoading(false);
    }
  }, [user, userData]);

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
    const CLOUDINARY_CLOUD_NAME = "web_ban-hang";
    const CLOUDINARY_UPLOAD_PRESET = "user_avatars";

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
    try {
      if (editingAddress) {
        await updateDoc(doc(addressesCol, editingAddress.id), addressData);
        toast.success("Cập nhật địa chỉ thành công!");
      } else {
        await addDoc(addressesCol, addressData);
        toast.success("Thêm địa chỉ mới thành công!");
      }
    } catch (error) {
      toast.error("Đã có lỗi xảy ra.");
    }
    setShowAddressForm(false);
    setEditingAddress(null);
  };

  if (loading) return <Spinner />;

  return (
    <>
      <SEO title={`Tài khoản của ${userData?.displayName || "bạn"}`} />
      <div className="page-container">
        <h1 className="page-title">Tài khoản của tôi</h1>

        {/* Phần thông tin cá nhân */}
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

        {/* Thanh điều hướng các tab */}
        <div className="mb-8">
          <ProfileTabs activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>

        {/* Hiển thị component con tương ứng với tab được chọn */}
        <div>
          {activeTab === "orders" && <OrdersTab user={user} />}
          {activeTab === "points" && (
            <PointsTab user={user} userData={userData} />
          )}
          {activeTab === "wishlist" && <WishlistTab />}
          {activeTab === "addresses" && (
            <AddressesTab
              user={user}
              onAddAddress={() => {
                setEditingAddress(null);
                setShowAddressForm(true);
              }}
              onEditAddress={(address) => {
                setEditingAddress(address);
                setShowAddressForm(true);
              }}
            />
          )}
          {activeTab === "settings" && (
            <SettingsTab user={user} userData={userData} />
          )}
        </div>

        {/* Modal form địa chỉ */}
        {showAddressForm && (
          <AddressForm
            address={editingAddress}
            onSave={handleSaveAddress}
            onCancel={() => setShowAddressForm(false)}
          />
        )}
      </div>
    </>
  );
};

export default ProfilePage;
