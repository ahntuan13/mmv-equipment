# Quản lý Thiết bị — Nhà máy MMV Đà Nẵng

Web app quản lý thiết bị nhà máy. **Bản nền v0.1.0**: hạ tầng, đăng nhập, phân quyền, dữ liệu nền, nhật ký. Nội dung nghiệp vụ (Thiết bị, Bảo trì, Sự cố, Vật tư, Báo cáo) đã có chỗ trong menu, quyền và rules — chờ yêu cầu chi tiết.

- Không cần build: HTML + CSS + JavaScript (ES modules), mở là chạy.
- Hạ tầng: **Firebase** (Authentication + Cloud Firestore, tùy chọn Storage/Hosting) · **GitHub** (mã nguồn + GitHub Pages tự đăng).
- Chưa điền Firebase config → app chạy **chế độ demo** (dữ liệu lưu trong trình duyệt, chọn vai trò khi đăng nhập).

## Đã có trong bản nền

| Phần | Nội dung |
|---|---|
| Đăng nhập | Google, email/mật khẩu, quên mật khẩu. Tài khoản mới ở trạng thái *Chờ duyệt* |
| Phân quyền | 4 vai trò: Quản trị · Quản lý · Kỹ thuật viên · Chỉ xem. Mức quyền theo từng phân hệ, kiểm tra cả ở giao diện lẫn Firestore rules |
| Người dùng | Duyệt tài khoản, gán vai trò, phòng ban, khóa/mở |
| Danh mục | Cơ cấu nhà máy dạng cây (Nhà máy › Khu vực/Xưởng › Dây chuyền), Phòng ban, Loại thiết bị, Trạng thái, Hãng sản xuất, Nhà cung cấp, Đơn vị tính |
| Bảng dữ liệu chuẩn | Tìm (không dấu), lọc, sắp xếp, phân trang, thêm/sửa/xóa qua ngăn kéo, xuất/nhập Excel, cập nhật thời gian thực |
| Nhật ký | Tự ghi mọi thao tác thêm/sửa/xóa/nhập; không sửa xóa được |
| Cài đặt | Thông tin nhà máy, ma trận quyền, trạng thái hạ tầng, sao lưu toàn bộ ra Excel |
| Khác | Giao diện sáng/tối, dùng tốt trên điện thoại, Firestore cache offline (Wi-Fi xưởng chập chờn vẫn xem được) |

## Cấu trúc

```
index.html
assets/
  app.css                 Giao diện chung
  js/
    config.js             ← FILE CẦN SỬA: Firebase config, email Quản trị, tên app
    roles.js              Vai trò + ma trận quyền (khớp firestore.rules)
    backend.js            Lớp dữ liệu: Firebase hoặc demo (module không gọi thẳng Firebase)
    lookups.js            Danh mục dùng chung, nhóm danh mục
    router.js             Menu, điều hướng, đăng ký module
    core.js               Tiện ích: biểu mẫu, ngăn kéo, hộp thoại, Excel
    ui/table.js           Bảng dữ liệu chuẩn (crudTable)
    seed.js               Dữ liệu mẫu cho chế độ demo
    modules/              Mỗi phân hệ một file
firestore.rules           Bảo mật dữ liệu theo vai trò
storage.rules             File đính kèm (dùng sau)
firebase.json, .firebaserc
.github/workflows/
  deploy-pages.yml        Tự đăng GitHub Pages khi push main
  deploy-firebase.yml     (Tùy chọn) đăng Firebase Hosting + rules, chạy tay
```

## Triển khai lần đầu

### 1. Firebase

1. [console.firebase.google.com](https://console.firebase.google.com) → **Add project** (ví dụ `mmv-thietbi`). Không cần Google Analytics.
2. **Build → Authentication → Get started** → bật **Google** và **Email/Password**.
3. **Build → Firestore Database → Create database** → chọn vùng `asia-southeast1` (Singapore) → *Production mode*.
4. **Firestore → Rules** → dán toàn bộ `firestore.rules` → **Publish**.
   Trước khi dán, sửa danh sách email trong `isBootstrapAdmin()` thành email Quản trị.
5. **Project settings → General → Your apps → Web (`</>`)** → đăng ký app → copy khối `firebaseConfig`.

### 2. Cấu hình app

Mở `assets/js/config.js`:

```js
export const FIREBASE_CONFIG = { apiKey: "...", authDomain: "...", projectId: "...", ... };
export const APP = { ..., adminEmails: ["email-quan-tri@..."] };
```

`adminEmails` phải trùng danh sách trong `firestore.rules`. Quản trị khởi tạo nên **đăng nhập bằng Google** lần đầu (rules yêu cầu email đã xác minh).

### 3. GitHub

1. Tạo repo mới (ví dụ `mmv-equipment`), đẩy toàn bộ thư mục lên nhánh `main`.
2. Repo → **Settings → Pages → Source: GitHub Actions**.
3. Mỗi lần push `main`, workflow *Deploy GitHub Pages* tự đăng → `https://<user>.github.io/mmv-equipment/`.
4. Quay lại Firebase → **Authentication → Settings → Authorized domains** → thêm `<user>.github.io` (và tên miền riêng nếu có, ví dụ Cloudflare).

### 4. Sau khi lên mạng

1. Quản trị đăng nhập → vào **Cài đặt** điền thông tin nhà máy.
2. **Danh mục**: khai báo cơ cấu nhà máy, phòng ban, loại thiết bị, trạng thái…
3. Gửi link cho mọi người đăng nhập → **Người dùng**: duyệt và gán vai trò.

## Thêm một phân hệ (khi có nội dung)

1. Tạo `assets/js/modules/equipment.js`:

```js
import { registerModule, viewHead } from "../router.js";
import { crudTable } from "../ui/table.js";
import { lookups } from "../lookups.js";

registerModule({
  key: "equipment", label: "Thiết bị", group: "Thiết bị & bảo trì", order: 10,
  render(el, ctx) {
    el.innerHTML = viewHead("Thiết bị") + "<div data-t></div>";
    return crudTable(el.querySelector("[data-t]"), ctx, {
      col: "equipment", entity: "thiết bị",
      columns: [{ key: "code", label: "Mã" }, { key: "name", label: "Tên" }],
      fields:  [{ key: "code", label: "Mã", required: true },
                { key: "name", label: "Tên", required: true },
                { key: "location", label: "Vị trí", type: "select", options: () => lookups.locationOptions() }]
    });
  }
});
```

2. Xóa dòng `equipment` trong `modules/placeholders.js`, thêm `import "./modules/equipment.js";` trong `app.js`.
3. Quyền đã có sẵn trong `roles.js` và `firestore.rules` (collection `equipment`). Phân hệ có tên mới thì thêm vào cả hai.

## Ghi chú

- Firebase config web **không phải bí mật** — bảo mật nằm ở Authentication + Firestore rules. Không đưa khóa service account vào repo.
- Gói Spark (miễn phí) đủ cho Firestore + Auth ở quy mô một nhà máy. Cloud Storage (ảnh, tài liệu) với dự án mới cần gói Blaze.
- Chế độ demo: xóa dữ liệu bằng **Cài đặt → Khôi phục dữ liệu demo**.
