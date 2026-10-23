/* ============================================================
   CẤU HÌNH — file duy nhất cần sửa khi triển khai
   ============================================================ */

/* 1) Firebase web config
   Firebase Console → Project settings → General → Your apps → Web app → SDK setup (Config).
   Để trống apiKey  ⇒ app chạy CHẾ ĐỘ DEMO (dữ liệu lưu trong trình duyệt, chọn vai trò khi đăng nhập). */
export const FIREBASE_CONFIG = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

/* 2) Thông tin ứng dụng */
export const APP = {
  name: "Quản lý Thiết bị",
  short: "MMV",
  plant: "Nhà máy MMV Đà Nẵng",
  company: "Taikisha Vietnam Engineering",
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
