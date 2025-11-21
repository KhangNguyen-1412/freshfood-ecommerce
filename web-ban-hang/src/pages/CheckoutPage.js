import React, { useState, useEffect, useMemo } from "react";
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
import PaymentMethods from "../components/checkout/PaymentMethods";
import AddressSelection from "../components/checkout/AddressSelection";
import CartSummary from "../components/checkout/CartSummary";
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
  const [shippingInfo, setShippingInfo] = useState({
    name: "",
    phone: "",
    address: "",
  });
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("COD");
  const [isProcessing, setIsProcessing] = useState(false);
  const [allActivePromos, setAllActivePromos] = useState([]); // State mới để lưu tất cả promo đang hoạt động
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

  // Tối ưu hóa 1: Chỉ fetch khuyến mãi một lần khi component mount
  useEffect(() => {
    const q = query(
      collection(db, "promotions"),
      where("expiresAt", ">", new Date())
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const promosData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAllActivePromos(promosData);
    });
    return () => unsubscribe();
  }, []); // Mảng phụ thuộc rỗng để chỉ chạy một lần

  // Sử dụng useMemo để tính toán lại danh sách promo hợp lệ khi subtotal thay đổi, không cần fetch lại
  const availablePromos = useMemo(() => {
    return allActivePromos.filter(
      (promo) => subtotal >= (promo.minimumPurchaseAmount || 0)
    );
  }, [allActivePromos, subtotal]);

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
  }, [user]); // Tối ưu hóa 2: Bỏ selectedAddressId khỏi dependency array

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
  };

  // Hàm mới: Chỉ tạo đơn hàng với trạng thái chờ thanh toán
  const createPendingOrder = async () => {
    const newOrderRef = doc(collection(db, "orders"));
    const orderData = {
      userId: user.uid,
      items: itemsToCheckout,
      shippingInfo,
      paymentMethod: selectedPaymentMethod,
      status: "Chờ thanh toán", // Trạng thái mới
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
    await runTransaction(db, async (transaction) => {
      // Chỉ tạo đơn hàng, không trừ kho ở bước này
      transaction.set(newOrderRef, orderData);
    });
    return newOrderRef.id; // Trả về ID của đơn hàng mới
  };

  const createOrderInFirestore = async (paymentIntentId = null) => {
    await runTransaction(db, async (transaction) => {
      // 1. READ PHASE: Check inventory for all items
      const inventoryChecks = [];
      
      for (const item of itemsToCheckout) {
        // Fallback: If productId is missing, assume it's the same as item.id (simple product)
        const productId = item.productId || item.id;
        
        if (!productId || !item.id || !selectedBranch?.id) {
          throw new Error("Dữ liệu sản phẩm hoặc chi nhánh không hợp lệ.");
        }

        const inventoryRef = doc(
          db,
          "products",
          productId,
          "variants",
          item.id,
          "inventory",
          selectedBranch.id
        );
        const productRef = doc(db, "products", productId);

        // Queue the reads
        const inventoryDoc = await transaction.get(inventoryRef);
        let productDoc = null;
        let useGlobal = false;

        if (!inventoryDoc.exists()) {
           // If branch inventory missing, check global product doc
           productDoc = await transaction.get(productRef);
           useGlobal = true;
        }

        inventoryChecks.push({
           item,
           inventoryRef,
           productRef,
           inventoryDoc,
           productDoc,
           useGlobal
        });
      }

      // 2. VALIDATION PHASE: Check stock availability based on reads
      for (const check of inventoryChecks) {
         const { item, inventoryDoc, productDoc, useGlobal } = check;
         
         if (useGlobal) {
            if (!productDoc.exists()) {
               throw new Error(`Sản phẩm "${item.name}" không tồn tại.`);
            }
            const globalStock = productDoc.data().stock;
            if (typeof globalStock !== 'number' || globalStock < item.quantity) {
               const currentStock = typeof globalStock === 'number' ? globalStock : "N/A";
               throw new Error(`Sản phẩm "${item.name}" không đủ số lượng (Kho tổng: ${currentStock}, Yêu cầu: ${item.quantity})`);
            }
         } else {
            if (inventoryDoc.data().stock < item.quantity) {
               const currentStock = inventoryDoc.data().stock;
               throw new Error(`Sản phẩm "${item.name}" không đủ số lượng tại chi nhánh này. (Kho: ${currentStock}, Yêu cầu: ${item.quantity})`);
            }
         }
      }

      // 3. WRITE PHASE: Create order and update inventory
      const newOrderRef = doc(collection(db, "orders"));
      const orderData = {
        userId: user.uid,
        items: itemsToCheckout,
        shippingInfo,
        paymentMethod: selectedPaymentMethod,
        paymentIntentId, // Dành cho Stripe
        status: "Đang xử lý", // COD mặc định là đang xử lý
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
      
      for (const check of inventoryChecks) {
        const { item, inventoryRef, productRef, useGlobal } = check;
        
        if (useGlobal) {
           transaction.update(productRef, { 
             stock: increment(-item.quantity),
             purchaseCount: increment(item.quantity)
           });
        } else {
           transaction.update(inventoryRef, { stock: increment(-item.quantity) });
           transaction.update(productRef, {
             purchaseCount: increment(item.quantity),
           });
        }
      }
    });
    
    const purchasedItemIds = itemsToCheckout.map((item) => item.id);
    if (!location.state?.buyNowItem) {
      await removeItemsFromCart(purchasedItemIds);
    }
    setAppliedPromos([]);
  };

  // --- Logic xử lý cho từng phương thức thanh toán ---

  // Xử lý cho COD
  const handleCOD = async () => {
    await createOrderInFirestore();
    toast.success("Đặt hàng (COD) thành công!");
    navigate("/profile", { replace: true });
  };

  // Xử lý cho Chuyển khoản ngân hàng
  const handleBankTransfer = async () => {
    const orderId = await createPendingOrder();
    toast.success(
      `Đã tạo đơn hàng #${orderId.substring(
        0,
        8
      )}. Vui lòng thực hiện chuyển khoản.`
    );
    navigate(`/payment-success?orderId=${orderId}&paymentMethod=BANK_TRANSFER`);
  };

  // Xử lý cho Stripe
  const handleStripePayment = async () => {
    if (!stripe || !elements) throw new Error("Stripe chưa sẵn sàng.");

    const apiUrl = process.env.REACT_APP_API_URL;
    if (!apiUrl) throw new Error("API URL chưa được cấu hình.");

    // Đây là ví dụ, bạn nên tạo API endpoint riêng cho việc này
    const res = await fetch(apiUrl + "/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: Math.round(finalTotal) }), // Stripe yêu cầu số nguyên
    });

    // Kiểm tra xem response có phải là JSON hợp lệ không
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Lỗi từ server: ${res.status} - ${errorText}`);
    }

    const { clientSecret, error: backendError } = await res.json();
    if (backendError) throw new Error(backendError.message);

    const cardElement = elements.getElement(CardElement);
    const paymentResult = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: { name: shippingInfo.name },
      },
    });

    if (paymentResult.error) throw new Error(paymentResult.error.message);

    if (paymentResult.paymentIntent.status === "succeeded") {
      await createOrderInFirestore(paymentResult.paymentIntent.id);
      toast.success("Thanh toán và đặt hàng thành công!");
      navigate("/profile", { replace: true });
    }
  };

  // Xử lý cho PayPal
  const handlePayPalApprove = async (data, actions) => {
    try {
      const details = await actions.order.capture();
      console.log("PayPal Transaction Details:", details);

      if (details.status === "COMPLETED") {
        await createOrderInFirestore(details.id);
        toast.success(`Thanh toán PayPal thành công!`);
        navigate("/profile", { replace: true });
      }
    } catch (error) {
      console.error("Lỗi PayPal:", error);
      toast.error("Thanh toán PayPal thất bại: " + error.message);
    }
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
      // Sử dụng switch-case để gọi hàm xử lý tương ứng
      switch (selectedPaymentMethod) {
        case "COD":
          await handleCOD();
          break;
        case "BANK_TRANSFER":
          await handleBankTransfer();
          break;
        case "STRIPE_CARD":
          await handleStripePayment();
          break;
        case "PAYPAL":
          toast.info("Vui lòng sử dụng các nút PayPal để hoàn tất thanh toán.");
          break;
        default:
          throw new Error("Phương thức thanh toán không hợp lệ.");
      }
    } catch (error) {
      console.error("Lỗi khi đặt hàng:", error);
      toast.error(`Đặt hàng thất bại: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const validateOrder = () => {
    if (!user || !selectedAddressId || !shippingInfo.name || !selectedBranch) {
      toast.error("Vui lòng điền đầy đủ thông tin giao hàng và chọn chi nhánh.");
      return false;
    }
    return true;
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
          <div className="lg:col-span-2 page-section space-y-8">
            <AddressSelection
              addresses={addresses}
              selectedAddressId={selectedAddressId}
              onSelectAddress={setSelectedAddressId}
              onSaveAddress={handleSaveAddress}
            />
            <PaymentMethods
              selectedPaymentMethod={selectedPaymentMethod}
              setSelectedPaymentMethod={setSelectedPaymentMethod}
              isProcessing={isProcessing}
              finalTotal={finalTotal}
              theme={theme}
              onPayPalApprove={handlePayPalApprove}
              validateOrder={validateOrder}
            />
          </div>
          <CartSummary
            subtotal={subtotal}
            totalDiscount={totalDiscount}
            finalTotal={finalTotal}
            appliedPromos={appliedPromos}
            onShowPromoModal={() => setShowPromoModal(true)}
            onRemovePromo={handleRemovePromoCode}
            onPlaceOrder={handlePlaceOrder}
            isProcessing={isProcessing}
            selectedPaymentMethod={selectedPaymentMethod}
          />
        </div>
      </div>
    </>
  );
};

export default CheckoutPage;
