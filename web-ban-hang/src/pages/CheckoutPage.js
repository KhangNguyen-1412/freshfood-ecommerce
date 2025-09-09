// src/pages/CheckoutPage.js

import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  collection,
  query,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  runTransaction,
  increment,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-toastify";
import { formatCurrency } from "../utils/formatCurrency";
import Spinner from "../components/common/Spinner";
import AddressForm from "../components/profile/AddressForm";
import PromoCodeModal from "../components/checkout/PromoCodeModal";
import { ArrowLeft, PlusCircle, Tag } from "lucide-react";
import "../styles/pages.css";
import SEO from "../components/common/SEO";

import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";

const CheckoutPage = () => {
  const { user, userData, cart, removeItemsFromCart, selectedBranch, theme } =
    useAppContext();
  const navigate = useNavigate();
  const location = useLocation();

  const stripe = useStripe();
  const elements = useElements();

  const itemsToCheckout =
    location.state?.itemsForCheckout ||
    (location.state?.buyNowItem ? [location.state.buyNowItem] : cart);

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [shippingInfo, setShippingInfo] = useState({
    name: "",
    phone: "",
    address: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [isProcessing, setIsProcessing] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [availablePromos, setAvailablePromos] = useState([]);
  const [appliedPromos, setAppliedPromos] = useState([]);
  const [showPromoModal, setShowPromoModal] = useState(false);

  const subtotal = itemsToCheckout.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  const totalDiscount = appliedPromos.reduce((total, promo) => {
    let currentDiscount = 0;
    if (promo.discountType === "percentage") {
      currentDiscount = (subtotal * promo.discountValue) / 100;
    } else {
      currentDiscount = promo.discountValue;
    }
    return total + currentDiscount;
  }, 0);
  const finalTotal = subtotal > totalDiscount ? subtotal - totalDiscount : 0;

  useEffect(() => {
    const q = query(
      collection(db, "promotions"),
      where("expiresAt", ">", new Date())
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allActivePromos = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      const eligiblePromos = allActivePromos.filter(
        (promo) => subtotal >= (promo.minimumPurchaseAmount || 0)
      );
      setAvailablePromos(eligiblePromos);
    });
    return () => unsubscribe();
  }, [subtotal]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "users", user.uid, "addresses"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userAddresses = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAddresses(userAddresses);
      if (userAddresses.length > 0 && !selectedAddressId) {
        setSelectedAddressId(userAddresses[0].id);
      }
    });
    return () => unsubscribe();
  }, [user, selectedAddressId]);

  useEffect(() => {
    const selected = addresses.find((addr) => addr.id === selectedAddressId);
    if (selected) {
      setShippingInfo({
        name: selected.name,
        phone: selected.phone,
        address: selected.address,
      });
    }
  }, [selectedAddressId, addresses]);

  useEffect(() => {
    // Tạo một hàm async bên trong để gọi API
    const generateQrCode = async () => {
      if (paymentMethod === "QR" && finalTotal > 0) {
        try {
          const orderInfo = `Thanh toan don hang ${Math.random()
            .toString(36)
            .substring(2, 9)}`;

          // Gọi đến API của chính bạn
          const response = await fetch("/api/generate-qr", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              amount: finalTotal,
              addInfo: orderInfo,
            }),
          });

          if (!response.ok) {
            throw new Error("Lỗi khi tạo mã QR từ server");
          }

          const data = await response.json();
          // Cập nhật state với dữ liệu Base64 nhận được
          setQrCodeUrl(data.qrDataURL);
        } catch (error) {
          console.error("Không thể lấy mã QR:", error);
          toast.error("Không thể tạo mã QR, vui lòng thử lại.");
          setQrCodeUrl(""); // Xóa mã QR cũ nếu có lỗi
        }
      } else {
        setQrCodeUrl(""); // Xóa mã QR khi không chọn phương thức này
      }
    };

    generateQrCode();
  }, [paymentMethod, finalTotal]);

  const handleApplyPromo = (promoToApply) => {
    if (appliedPromos.some((p) => p.id === promoToApply.id)) return;
    setAppliedPromos((prev) => [...prev, promoToApply]);
    setShowPromoModal(false);
  };

  const handleRemovePromoCode = (promoId) => {
    setAppliedPromos((prev) => prev.filter((p) => p.id !== promoId));
  };

  const handleSaveAddress = async (addressData) => {
    if (!user) return;
    const addressesCol = collection(db, "users", user.uid, "addresses");
    if (addressData.id) {
      await updateDoc(doc(addressesCol, addressData.id), addressData);
    } else {
      const newAddress = await addDoc(addressesCol, addressData);
      setSelectedAddressId(newAddress.id);
    }
    setShowAddressForm(false);
  };

  // TÁCH LOGIC TẠO ORDER RA HÀM RIÊNG ĐỂ DÙNG LẠI
  const createOrderInFirestore = async (paymentIntentId = null) => {
    await runTransaction(db, async (transaction) => {
      for (const item of itemsToCheckout) {
        const inventoryRef = doc(
          db,
          "products",
          item.id,
          "inventory",
          selectedBranch.id
        );
        const inventoryDoc = await transaction.get(inventoryRef);
        if (
          !inventoryDoc.exists() ||
          inventoryDoc.data().stock < item.quantity
        ) {
          throw new Error(`Sản phẩm "${item.name}" không đủ số lượng.`);
        }
      }
      const newOrderRef = doc(collection(db, "orders"));
      const orderData = {
        userId: user.uid,
        items: itemsToCheckout,
        shippingInfo,
        paymentMethod,
        paymentIntentId,
        status: paymentMethod === "COD" ? "Đang xử lý" : "Đã thanh toán",
        createdAt: serverTimestamp(),
        branchId: selectedBranch.id,
        subtotal,
        discount: totalDiscount,
        appliedPromos: appliedPromos.map((p) => ({
          code: p.code,
          discountType: p.discountType,
          discountValue: p.discountValue,
        })),
        totalAmount: finalTotal,
      };
      transaction.set(newOrderRef, orderData);
      for (const item of itemsToCheckout) {
        const productRef = doc(db, "products", item.id);
        const inventoryRef = doc(
          db,
          "products",
          item.id,
          "inventory",
          selectedBranch.id
        );
        transaction.update(inventoryRef, { stock: increment(-item.quantity) });
        transaction.update(productRef, {
          purchaseCount: increment(item.quantity),
        });
      }
    });
    const purchasedItemIds = itemsToCheckout.map((item) => item.id);
    if (!location.state?.buyNowItem) {
      await removeItemsFromCart(purchasedItemIds);
    }
    setAppliedPromos([]);
  };

  const handlePlaceOrder = async () => {
    if (!user || !selectedAddressId || !shippingInfo.name || !selectedBranch) {
      toast.error(
        "Vui lòng điền đầy đủ thông tin giao hàng và chọn chi nhánh."
      );
      return;
    }
    setIsProcessing(true);

    try {
      if (paymentMethod === "STRIPE_CARD") {
        if (!stripe || !elements) throw new Error("Stripe chưa sẵn sàng.");

        // 1. Gọi API backend để tạo Payment Intent
        const res = await fetch("/api/create-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: finalTotal }),
        });
        const { clientSecret, error: backendError } = await res.json();
        if (backendError) throw new Error(backendError.message);

        // 2. Xác nhận thanh toán trên client
        const cardElement = elements.getElement(CardElement);
        const paymentResult = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: { name: shippingInfo.name },
          },
        });
        if (paymentResult.error) throw new Error(paymentResult.error.message);

        // 3. Nếu thành công, tạo đơn hàng trên Firestore
        if (paymentResult.paymentIntent.status === "succeeded") {
          await createOrderInFirestore(paymentResult.paymentIntent.id);
          toast.success("Thanh toán và đặt hàng thành công!");
          navigate("/profile", { replace: true });
        }
      } else {
        await createOrderInFirestore();
        toast.success("Đặt hàng thành công!");
        navigate("/profile", { replace: true });
      }
    } catch (error) {
      console.error("Lỗi khi đặt hàng:", error);
      toast.error(`Đặt hàng thất bại: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <SEO
        title="Thanh toán"
        description="Hoàn tất đơn hàng của bạn một cách an toàn và nhanh chóng."
      />
      <div className="page-container">
        {showPromoModal && (
          <PromoCodeModal
            availablePromos={availablePromos}
            appliedPromoIds={appliedPromos.map((p) => p.id)}
            onApply={handleApplyPromo}
            onClose={() => setShowPromoModal(false)}
          />
        )}
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white mr-4"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-3xl font-bold">Thanh toán</h1>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 page-section">
            <h2 className="text-xl font-bold mb-4">Chọn địa chỉ giao hàng</h2>
            <div className="space-y-3">
              {addresses.map((addr) => (
                <label
                  key={addr.id}
                  className="flex items-center p-3 border rounded-md cursor-pointer dark:border-gray-700"
                >
                  <input
                    type="radio"
                    name="address"
                    value={addr.id}
                    checked={selectedAddressId === addr.id}
                    onChange={(e) => setSelectedAddressId(e.target.value)}
                    className="mr-3 h-4 w-4 text-green-600 focus:ring-green-500"
                  />
                  <div>
                    <p className="font-semibold">
                      {addr.name} - {addr.phone}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {addr.address}
                    </p>
                  </div>
                </label>
              ))}
            </div>
            <button
              onClick={() => setShowAddressForm(true)}
              className="mt-4 flex items-center text-green-600 hover:underline"
            >
              <PlusCircle size={18} className="mr-1" /> Thêm địa chỉ mới
            </button>
            {showAddressForm && (
              <AddressForm
                onSave={handleSaveAddress}
                onCancel={() => setShowAddressForm(false)}
              />
            )}

            <h2 className="text-xl font-bold mt-8 mb-4">
              Phương thức thanh toán
            </h2>
            <div className="space-y-2">
              <label className="flex items-center p-3 border rounded-md cursor-pointer dark:border-gray-700">
                <input
                  type="radio"
                  name="payment"
                  value="COD"
                  checked={paymentMethod === "COD"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mr-3 h-4 w-4 text-green-600 focus:ring-green-500"
                />
                Thanh toán khi nhận hàng (COD)
              </label>
              <label className="flex items-center p-3 border rounded-md cursor-pointer dark:border-gray-700">
                <input
                  type="radio"
                  name="payment"
                  value="QR"
                  checked={paymentMethod === "QR"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mr-3 h-4 w-4 text-green-600 focus:ring-green-500"
                />
                Chuyển khoản qua mã QR
              </label>
              <label className="flex items-center p-3 border rounded-md cursor-pointer dark:border-gray-700">
                <input
                  type="radio"
                  name="payment"
                  value="STRIPE_CARD"
                  checked={paymentMethod === "STRIPE_CARD"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mr-3 h-4 w-4 text-green-600 focus:ring-green-500"
                />
                Thanh toán qua thẻ (Visa, Mastercard)
              </label>
              {paymentMethod === "STRIPE_CARD" && (
                <div className="p-4 border dark:border-gray-700 rounded-md mt-2 animate-fade-in">
                  <CardElement
                    options={{
                      style: {
                        base: {
                          fontSize: "16px",
                          color: theme === "dark" ? "#FFF" : "#424770",
                          "::placeholder": { color: "#aab7c4" },
                        },
                        invalid: { color: "#9e2146" },
                      },
                    }}
                  />
                </div>
              )}
            </div>
            {paymentMethod === "QR" && qrCodeUrl && (
              <div className="mt-6 p-4 border rounded-lg flex flex-col items-center animate-fade-in">
                <h3 className="text-lg font-semibold mb-2">
                  Quét mã VietQR để thanh toán
                </h3>
                <img
                  src={qrCodeUrl}
                  alt="Mã QR thanh toán"
                  className="w-64 h-64"
                />
                <p className="font-bold text-green-600 text-xl mt-1">
                  {formatCurrency(finalTotal)}
                </p>
              </div>
            )}
          </div>
          <div className="cart-summary">
            <h2 className="cart-summary-title">Tóm tắt đơn hàng</h2>
            <div className="mt-4">
              <button
                onClick={() => setShowPromoModal(true)}
                className="w-full text-blue-600 font-semibold border-2 border-dashed dark:border-gray-600 p-2 rounded-md hover:bg-blue-50 dark:hover:bg-gray-700"
              >
                Chọn hoặc nhập mã khuyến mãi
              </button>
              {appliedPromos.length > 0 && (
                <div className="mt-3 space-y-1">
                  <p className="font-semibold text-sm mb-2">Mã đã áp dụng:</p>
                  {appliedPromos.map((promo) => (
                    <div
                      key={promo.id}
                      className="flex justify-between items-center text-sm text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 p-2 rounded-md"
                    >
                      <span>
                        <Tag size={14} className="inline mr-1" />
                        {promo.code}
                      </span>
                      <button
                        onClick={() => handleRemovePromoCode(promo.id)}
                        className="font-bold hover:text-red-600"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-between mt-4">
              <span>Tạm tính</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between mt-2 text-red-500">
              <span>Giảm giá</span>
              <span>- {formatCurrency(totalDiscount)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg mt-4 border-t dark:border-gray-700 pt-4">
              <span>Tổng cộng</span>
              <span>{formatCurrency(finalTotal)}</span>
            </div>
            <button
              onClick={handlePlaceOrder}
              disabled={isProcessing}
              className="cart-checkout-button flex justify-center items-center"
            >
              {isProcessing ? <Spinner size="sm" /> : "Hoàn tất đơn hàng"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CheckoutPage;
