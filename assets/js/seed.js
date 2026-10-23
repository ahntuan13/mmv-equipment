/* Dữ liệu mẫu cho CHẾ ĐỘ DEMO (không dùng khi chạy Firebase).
   Chỉ là khung để thử giao diện — thay bằng dữ liệu thật trong Cài đặt. */
export function seedDemo() {
  const t = new Date().toISOString();
  const meta = { createdAt: t, updatedAt: t, createdBy: "seed", updatedBy: "seed" };
  const rows = arr => Object.fromEntries(arr.map(([id, d]) => [id, { ...d, ...meta }]));

  return {
    users: rows([
      ["demo-admin",   { email: "admin@demo.local",   name: "Quản trị Demo", role: "admin",   active: true, dept: "d-ad" }],
      ["demo-quanly",  { email: "quanly@demo.local",  name: "Quản lý Demo",  role: "quanly",  active: true, dept: "d-me" }],
      ["demo-kythuat", { email: "kythuat@demo.local", name: "Kỹ thuật Demo", role: "kythuat", active: true, dept: "d-me" }],
      ["u-new",        { email: "nhanvien.moi@demo.local", name: "Nhân viên mới", role: "cho", active: true, dept: "" }]
    ]),
    departments: rows([
      ["d-ad", { code: "AD",  name: "Hành chính", note: "" }],
      ["d-me", { code: "ME",  name: "Bảo trì cơ điện", note: "" }],
      ["d-pd", { code: "PD",  name: "Sản xuất", note: "" }],
      ["d-qc", { code: "QC",  name: "Quản lý chất lượng", note: "" }]
    ]),
    locations: rows([
      ["l-f",  { code: "MMV-DN", name: "Nhà máy MMV Đà Nẵng", level: "factory", parentId: "", note: "" }],
      ["l-a1", { code: "XA",     name: "Xưởng A", level: "area", parentId: "l-f", note: "" }],
      ["l-a2", { code: "UT",     name: "Khu tiện ích (Utility)", level: "area", parentId: "l-f", note: "" }],
      ["l-a3", { code: "KHO",    name: "Kho", level: "area", parentId: "l-f", note: "" }],
      ["l-l1", { code: "XA-L1",  name: "Dây chuyền 1", level: "line", parentId: "l-a1", note: "" }],
      ["l-l2", { code: "XA-L2",  name: "Dây chuyền 2", level: "line", parentId: "l-a1", note: "" }]
    ]),
    categories: rows([
      ["c1", { group: "equipment_type", code: "MAY",  name: "Máy sản xuất" }],
      ["c2", { group: "equipment_type", code: "DIEN", name: "Thiết bị điện" }],
      ["c3", { group: "equipment_type", code: "HVAC", name: "Điều hòa - thông gió" }],
      ["c4", { group: "equipment_type", code: "DO",   name: "Dụng cụ đo" }],
      ["c5", { group: "status", code: "HD",   name: "Đang hoạt động" }],
      ["c6", { group: "status", code: "BT",   name: "Đang bảo trì" }],
      ["c7", { group: "status", code: "HONG", name: "Hỏng - chờ sửa" }],
      ["c8", { group: "status", code: "TL",   name: "Thanh lý" }],
      ["c9", { group: "unit", code: "CAI", name: "Cái" }],
      ["c10",{ group: "unit", code: "BO",  name: "Bộ" }],
      ["c11",{ group: "manufacturer", code: "", name: "(nhập hãng sản xuất)" }]
    ]),
    settings: rows([
      ["app", { plantName: "Nhà máy MMV Đà Nẵng", plantCode: "MMV-DN", address: "", contact: "", codePrefix: "TB", fiscalStart: "01" }]
    ]),
    auditLogs: {}
  };
}
