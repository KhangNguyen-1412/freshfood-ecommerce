usecaseDiagram
    actor Khách hàng
    actor "Nhà cung cấp" as Vendor
    actor Admin

    rectangle "Hệ thống FreshFood" {
        usecase "Đăng ký / Đăng nhập" as UC1
        usecase "Xem & Tìm kiếm Sản phẩm" as UC2
        usecase "Quản lý Giỏ hàng & Thanh toán" as UC3
        usecase "Quản lý Tài khoản Cá nhân" as UC4
        usecase "Viết & Quản lý Đánh giá" as UC5
        usecase "Quản lý Điểm thưởng" as UC6
        
        usecase "Đăng ký & Quản lý Cửa hàng" as UCV1
        usecase "Quản lý Sản phẩm (của Cửa hàng)" as UCV2
        usecase "Quản lý Đơn hàng (của Cửa hàng)" as UCV3
        usecase "Nhập kho từ Excel (cho Cửa hàng)" as UCV4

        usecase "Quản lý Toàn bộ Người dùng & Cửa hàng" as UCA1
        usecase "Quản lý Toàn bộ Sản phẩm & Đơn hàng" as UCA2
        usecase "Quản lý Dữ liệu Hệ thống (Danh mục, Brand, Chi nhánh)" as UCA3
        usecase "Xem Báo cáo Toàn diện" as UCA4
    }
    
    Khách hàng -- (UC1)
    Khách hàng -- (UC2)
    Khách hàng -- (UC3)
    Khách hàng -- (UC4)
    Khách hàng -- (UC5)
    Khách hàng -- (UC6)

    Vendor -- (UCV1)
    Vendor -- (UCV2)
    Vendor -- (UCV3)
    Vendor -- (UCV4)
    
    Admin -- (UCA1)
    Admin -- (UCA2)
    Admin -- (UCA3)
    Admin -- (UCA4)
    
    Admin --|> Vendor
    Vendor --|> Khách hàng