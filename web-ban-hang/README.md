# FreshFood - Hệ thống Web Bán Hàng Thực Phẩm

Đây là dự án website thương mại điện tử hoàn chỉnh dành cho việc kinh doanh thực phẩm tươi sạch, được xây dựng bằng React và Firebase. Hệ thống bao gồm trang bán hàng cho khách hàng và một trang quản trị (admin panel) mạnh mẽ để quản lý toàn bộ hoạt động.

## Tính năng chính

### A. Trang bán hàng (Customer-facing)

- **Giao diện hiện đại**: Dark/Light mode, responsive design.
- **Xác thực người dùng**: Đăng ký, đăng nhập, quên mật khẩu (sử dụng Firebase Authentication).
- **Quản lý chi nhánh**: Cho phép khách hàng chọn chi nhánh và quận/huyện để xem sản phẩm và tồn kho tương ứng.
- **Trang chủ động**: Hiển thị sản phẩm nổi bật, danh mục, nhãn hiệu đối tác.
- **Chi tiết sản phẩm**:
  - Hỗ trợ **biến thể sản phẩm** (ví dụ: chai, lốc, thùng) với giá, hình ảnh và tồn kho riêng.
  - Thư viện ảnh, mô tả chi tiết.
  - Hệ thống **Đánh giá & Bình luận** (sao và nhận xét).
  - Hệ thống **Hỏi & Đáp (Q&A)** cho sản phẩm.
- **Giỏ hàng & Thanh toán**:
  - Giỏ hàng đồng bộ real-time với Firestore.
  - Quy trình thanh toán (checkout) an toàn.
  - Hỗ trợ nhiều phương thức thanh toán (COD, Stripe, VNPay).
  - Áp dụng mã khuyến mãi.
- **Tài khoản người dùng**:
  - Quản lý thông tin cá nhân, địa chỉ.
  - Lịch sử đơn hàng.
  - Danh sách sản phẩm yêu thích (Wishlist).
  - Lịch sử điểm tích lũy.
  - Xem lại các câu hỏi đã đặt.
- **Trung tâm thông báo**: Nhận thông báo real-time về đơn hàng, câu trả lời...
- **Trang nội dung tĩnh**: Dễ dàng tạo các trang như "Chính sách", "FAQ", "Blog" từ trang quản trị.
- **Tối ưu SEO**: Sử dụng `react-helmet-async` để tối ưu thẻ meta cho từng trang.

### B. Trang Quản trị (Admin Panel)

- **Dashboard tổng quan**: Thống kê doanh thu, đơn hàng, khách hàng mới theo thời gian.
- **Quản lý sản phẩm**:
  - Thêm, sửa, xóa sản phẩm.
  - Quản lý **biến thể sản phẩm** và **tồn kho theo từng chi nhánh**.
  - Chỉnh sửa giá, bật/tắt khuyến mãi nhanh.
  - Gán nhãn hiệu, danh mục hàng loạt.
- **Quản lý đơn hàng**: Xem danh sách, cập nhật trạng thái đơn hàng.
- **Quản lý nội dung**: Tạo và chỉnh sửa các trang tĩnh (chính sách, blog...).
- **Quản lý khách hàng**: Xem danh sách, lịch sử mua hàng, phân quyền (admin, staff, customer).
- **Quản lý tương tác**:
  - Quản lý và phản hồi các **bình luận/đánh giá**.
  - Quản lý và trả lời các **câu hỏi (Q&A)**.
- **Quản lý Marketing**:
  - Tạo và quản lý mã khuyến mãi.
  - Gửi email marketing (bản tin) đến danh sách người đăng ký (tích hợp Brevo qua Vercel Serverless Function).
- **Quản lý hệ thống**: Quản lý danh mục, nhãn hiệu, chi nhánh.
- **Báo cáo & Thống kê**: Xem báo cáo doanh thu, chi phí, lợi nhuận theo tháng/năm và top sản phẩm bán chạy.

## Công nghệ sử dụng

- **Frontend**: React, React Router, Tailwind CSS, Framer Motion (hiệu ứng).
- **Backend & Database**: Firebase (Firestore, Authentication, Storage).
- **Serverless Functions**: Vercel Serverless Functions (dùng cho API gửi email).
- **Dịch vụ bên thứ ba**:
  - **Brevo (Sendinblue)**: Gửi email giao dịch và marketing.
  - **Cloudinary**: Lưu trữ và quản lý ảnh (avatar, ảnh sản phẩm tải lên).
  - **Stripe / VNPay**: Cổng thanh toán.
- **Thư viện khác**: `react-toastify`, `exceljs`, `recharts`.

## Cài đặt và Chạy dự án

### 1. Yêu cầu

- Node.js (v16 trở lên)
- npm hoặc yarn
- Firebase CLI (`npm install -g firebase-tools`)
- Vercel CLI (`npm install -g vercel`)

### 2. Cấu hình Firebase

1.  Tạo một dự án mới trên Firebase Console.
2.  Kích hoạt **Authentication** (với phương thức Email/Password, Google).
3.  Kích hoạt **Firestore Database**.
4.  Vào Project Settings > Service accounts, tạo một private key mới và tải file `serviceAccountKey.json` về, đặt vào thư mục gốc của dự án.
5.  Trong Project Settings, tạo một Web App và sao chép cấu hình Firebase.

### 3. Cấu hình biến môi trường

Tạo một file `.env` trong thư mục `web-ban-hang` với nội dung sau:

```
# Firebase (lấy từ Project Settings)
REACT_APP_FIREBASE_API_KEY=...
REACT_APP_FIREBASE_AUTH_DOMAIN=...
REACT_APP_FIREBASE_PROJECT_ID=...
REACT_APP_FIREBASE_STORAGE_BUCKET=...
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=...
REACT_APP_FIREBASE_APP_ID=...

# Stripe
REACT_APP_STRIPE_PUBLISHABLE_KEY=...

# Vercel Serverless Functions (dùng cho Brevo)
REACT_APP_API_URL=http://localhost:3001 # Hoặc URL khi deploy
```

### 4. Cài đặt và Chạy

```bash
# Cài đặt các gói phụ thuộc
npm install

# Để chạy trên môi trường phát triển (khuyến khích)
# Lệnh này sẽ chạy cả React app và các serverless function trong /api
vercel dev

# Hoặc chỉ chạy React app (các API call sẽ lỗi 404)
npm start
```

### 5. Deploy

Dự án được tối ưu để deploy lên Vercel. Chỉ cần kết nối repository của bạn với Vercel, nó sẽ tự động nhận diện và build dự án. Đừng quên thiết lập các biến môi trường trên Vercel dashboard.

---

Cảm ơn bạn đã xem qua dự án!
