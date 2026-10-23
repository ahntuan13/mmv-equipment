/* ============================================================
   CẤU HÌNH — file duy nhất cần sửa khi triển khai
   ============================================================ */

/* 1) Firebase web config
   Firebase Console → Project settings → General → Your apps → Web app → SDK setup (Config).
   Để trống apiKey  ⇒ app chạy CHẾ ĐỘ DEMO (dữ liệu lưu trong trình duyệt, chọn vai trò khi đăng nhập). */
export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDh0fb4CTy8ytMrIlNYtJg36neIOi8tO3Q",
  authDomain: "mmv-thietbi.firebaseapp.com",
  projectId: "mmv-thietbi",
  storageBucket: "mmv-thietbi.firebasestorage.app",
  messagingSenderId: "502179696710",
  appId: "1:502179696710:web:e0e9465af44f49e2f4ba47"
};

/* 2) Thông tin ứng dụng */
export const APP = {
  name: "Quản lý Thiết bị",
  short: "MMV",
  plant: "Nhà máy MMV · KCN Hòa Khánh, Đà Nẵng",
  company: "Murata Manufacturing Vietnam",
  version: "0.1.0",
  /* Email được tự động cấp quyền Quản trị ở lần đăng nhập đầu tiên.
     PHẢI khớp với danh sách isBootstrapAdmin() trong firestore.rules. */
  adminEmails: [
    "ahntuan13@gmail.com"
  ],
  /* Cách đăng nhập bật trên Firebase Authentication */
  signIn: { google: true, emailPassword: true },
  /* Người mới đăng nhập: chờ Quản trị duyệt (true) hay vào luôn với vai trò "xem" (false) */
  requireApproval: true
};

/* Phiên bản Firebase JS SDK (tải từ gstatic, không cần build) */
export const FIREBASE_SDK = "10.12.2";
