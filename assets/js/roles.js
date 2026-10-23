/* ============================================================
   VAI TRÒ & QUYỀN
   Mức quyền: 0 = ẩn · 1 = xem · 2 = thêm/sửa · 3 = toàn quyền (gồm xóa)
   Khi đổi bảng này, đổi tương ứng hàm canWrite()/canDelete() trong firestore.rules.
   ============================================================ */

export const ROLES = {
  admin:   { label: "Quản trị",       desc: "Toàn quyền, gồm Cài đặt và phân quyền người dùng", tone: "ink"  },
  quanly:  { label: "Quản lý",        desc: "Xem toàn bộ, thêm/sửa, duyệt; không vào Cài đặt hệ thống", tone: "info" },
  kythuat: { label: "Kỹ thuật viên",  desc: "Cập nhật thiết bị, bảo trì, sự cố được giao",       tone: "ok"   },
  xem:     { label: "Chỉ xem",        desc: "Xem dữ liệu, không chỉnh sửa",                      tone: "mut"  },
  cho:     { label: "Chờ duyệt",      desc: "Tài khoản mới, chưa được cấp quyền",                tone: "warn" }
};

/* Vai trò có thể gán cho người dùng (không gồm "cho") */
export const ASSIGNABLE = ["admin", "quanly", "kythuat", "xem"];

export const LEVEL = { NONE: 0, VIEW: 1, EDIT: 2, FULL: 3 };
export const LEVEL_LABEL = ["—", "Xem", "Sửa", "Toàn quyền"];

/* Quyền theo module. Module mới: thêm 1 dòng ở đây, key trùng key trong registerModule(). */
export const PERMISSIONS = {
  //                admin quanly kythuat xem
  dashboard:     [   3,    1,     1,     1 ],
  equipment:     [   3,    3,     2,     1 ],
  maintenance:   [   3,    3,     2,     1 ],
  incidents:     [   3,    3,     2,     1 ],
  spareparts:    [   3,    3,     2,     1 ],
  reports:       [   3,    1,     1,     1 ],
  masterdata:    [   3,    2,     1,     1 ],
  users:         [   3,    1,     0,     0 ],
  settings:      [   3,    0,     0,     0 ],
  audit:         [   3,    1,     0,     0 ]
};
const ORDER = ["admin", "quanly", "kythuat", "xem"];

export function level(role, moduleKey) {
  const row = PERMISSIONS[moduleKey];
  const i = ORDER.indexOf(role);
  if (!row || i < 0) return LEVEL.NONE;
  return row[i];
}
export const can = {
  view:   (role, m) => level(role, m) >= LEVEL.VIEW,
  edit:   (role, m) => level(role, m) >= LEVEL.EDIT,
  delete: (role, m) => level(role, m) >= LEVEL.FULL
};
export const roleLabel = r => ROLES[r]?.label || r || "—";
export const roleOrder = ORDER;
