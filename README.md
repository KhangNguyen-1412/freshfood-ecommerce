# Tên Dự Án: Website Bán Hàng FreshFood

Đây là một dự án website thương mại điện tử hoàn chỉnh, cho phép người dùng xem, tìm kiếm, đặt hàng và thanh toán sản phẩm. Hệ thống cũng bao gồm một trang quản trị (Admin Dashboard) mạnh mẽ để quản lý toàn bộ hoạt động của cửa hàng.

**Link Demo:** [quanlybanhang.vercel.app](https://quanlybanhang.vercel.app)

---

## Mục lục
- [Tính Năng Chính](#tính-năng-chính)
- [Công Nghệ Sử Dụng](#công-nghệ-sử-dụng)
- [Hướng Dẫn Cài Đặt](#hướng-dẫn-cài-đặt)
- [Cấu Trúc Thư Mục](#cấu-trúc-thư-mục)
- [Các Sơ Đồ Thiết Kế](#các-sơ-đồ-thiết-kế)

---

## Tính Năng Chính

### 👤 Dành cho Người Dùng (Khách hàng)
- **Đăng ký/Đăng nhập:** Xác thực người dùng qua Email/Mật khẩu.
- **Duyệt sản phẩm:** Xem sản phẩm theo danh mục, tìm kiếm, lọc và sắp xếp.
- **Giỏ hàng:** Thêm, xóa, cập nhật số lượng sản phẩm.
- **Thanh toán:**
    - Điền thông tin giao hàng, áp dụng mã giảm giá.
    - Hỗ trợ thanh toán khi nhận hàng (COD).
    - Tích hợp cổng thanh toán trực tuyến **VNPay**.
- **Quản lý tài khoản:** Xem lịch sử đơn hàng, quản lý địa chỉ, cập nhật thông tin cá nhân.
- **Đánh giá sản phẩm:** Để lại bình luận và xếp hạng cho các sản phẩm đã mua.

### 👑 Dành cho Quản Trị Viên (Admin)
- **Dashboard tổng quan:** Thống kê doanh thu, đơn hàng, khách hàng mới.
- **Quản lý Sản phẩm:** Thêm, sửa, xóa sản phẩm.
- **Quản lý Đơn hàng:** Cập nhật trạng thái đơn hàng (đang xử lý, đang giao, đã giao, đã hủy).
- **Quản lý Khách hàng:** Xem thông tin và lịch sử mua hàng của khách.
- **Quản lý Danh mục & Nhãn hiệu:** Tạo và quản lý các danh mục, nhãn hiệu sản phẩm.
- **Quản lý Khuyến mãi:** Tạo và quản lý các mã giảm giá.

---

## Công Nghệ Sử Dụng

### Frontend (Giao diện người dùng)
- **ReactJS:** Thư viện JavaScript để xây dựng giao diện.
- **Tailwind CSS:** Framework CSS để thiết kế giao diện nhanh chóng.
- **React Router:** Quản lý việc điều hướng giữa các trang.

### Backend (Máy chủ & Logic)
- **Node.js & ExpressJS:** Nền tảng và framework để xây dựng API.
- **Firebase:**
    - **Firestore:** Cơ sở dữ liệu NoSQL để lưu trữ dữ liệu.
    - **Authentication:** Dịch vụ xác thực người dùng.
    - **Storage:** Lưu trữ hình ảnh sản phẩm.

### Cổng thanh toán
- **VNPay:** Tích hợp thanh toán trực tuyến.

---

## Hướng Dẫn Cài Đặt

1.  **Clone repository:**
    ```bash
    git clone [https://github.com/KhangNguyen-1412/Quanlybanhang.git](https://github.com/KhangNguyen-1412/Quanlybanhang.git)
    ```
2.  **Cài đặt cho Frontend:**
    ```bash
    cd web-ban-hang
    npm install
    ```
3.  **Cài đặt cho Backend:**
    ```bash
    cd src/backend 
    npm install
    ```
4.  **Thiết lập biến môi trường:**
    - Tạo file `.env` trong thư mục `web-ban-hang` và điền các khóa `REACT_APP_*` từ Firebase.
    - Tạo file `.env` trong thư mục `src/backend` và điền các khóa của VNPay.
5.  **Khởi chạy dự án:**
    - Chạy Backend: `npm start` (trong thư mục `src/backend`)
    - Chạy Frontend: `npm start` (trong thư mục `web-ban-hang`)

---

## Cấu Trúc Thư Mục

Dự án được chia thành hai phần chính:
- `/web-ban-hang`: Chứa toàn bộ code của frontend (React).
- `/src/backend`: Chứa code của backend (Node.js/Express) để xử lý logic API, bao gồm cả việc tạo URL thanh toán VNPay.

---

## Các Sơ Đồ Thiết Kế

Dự án bao gồm các sơ đồ chi tiết để phân tích và thiết kế hệ thống:
- Sơ đồ Usecase (UCD)
- Sơ đồ Quan hệ Thực thể (ERD)
- Sơ đồ Lớp (Class Diagram)
- Các sơ đồ Tuần tự và Hoạt động cho những quy trình chính.
