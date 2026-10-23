/* ============================================================
   DANH MỤC DÙNG CHUNG (nạp một lần sau đăng nhập, tự cập nhật)
   Dùng cho ô chọn ở mọi module: lookups.options("status"), lookups.locationPath(id)…
   ============================================================ */
import { backend } from "./backend.js";

/* Nhóm danh mục — thêm nhóm mới ở đây là có ngay trong màn Danh mục */
export const CATEGORY_GROUPS = [
  { key: "equipment_type", label: "Loại thiết bị" },
  { key: "status",         label: "Trạng thái thiết bị" },
  { key: "manufacturer",   label: "Hãng sản xuất" },
  { key: "supplier",       label: "Nhà cung cấp" },
  { key: "unit",           label: "Đơn vị tính" }
];
export const LOCATION_LEVELS = [
  { key: "factory", label: "Nhà máy" },
  { key: "area",    label: "Khu vực / Xưởng" },
  { key: "line",    label: "Dây chuyền / Vị trí" }
];

const data = { categories: [], locations: [], departments: [], users: [], settings: [] };
const subs = new Set();
let unsubs = [];

export const lookups = {
  start() {
    this.stop();
    for (const col of Object.keys(data)) {
      unsubs.push(backend.watch(col, rows => { data[col] = rows; subs.forEach(f => f(col)); }, undefined, () => {}));
    }
  },
  stop() { unsubs.forEach(u => u?.()); unsubs = []; Object.keys(data).forEach(k => data[k] = []); },
  onChange(fn) { subs.add(fn); return () => subs.delete(fn); },

  get categories() { return data.categories; },
  get locations() { return data.locations; },
  get departments() { return data.departments; },
  get users() { return data.users; },
  get settings() { return data.settings.find(s => s.id === "app") || {}; },

  /* Danh mục theo nhóm → [{value,label}] */
  options(group) {
    return data.categories.filter(c => c.group === group)
      .sort((a, b) => String(a.code || a.name).localeCompare(String(b.code || b.name), "vi", { numeric: true }))
      .map(c => ({ value: c.id, label: c.code ? `${c.code} · ${c.name}` : c.name }));
  },
  categoryName(id) { const c = data.categories.find(x => x.id === id); return c ? c.name : ""; },
  deptOptions() { return data.departments.map(d => ({ value: d.id, label: d.code ? `${d.code} · ${d.name}` : d.name })); },
  deptName(id) { const d = data.departments.find(x => x.id === id); return d ? (d.code || d.name) : ""; },
  locationPath(id) {
    const out = []; let cur = data.locations.find(l => l.id === id); let guard = 0;
    while (cur && guard++ < 10) { out.unshift(cur.name); cur = data.locations.find(l => l.id === cur.parentId); }
    return out.join(" › ");
  },
  /* Vị trí dạng cây, thụt lề theo cấp */
  locationOptions(filterLevel) {
    const res = [];
    const walk = (pid, depth) => data.locations.filter(l => (l.parentId || "") === pid)
      .sort((a, b) => String(a.code).localeCompare(String(b.code), "vi", { numeric: true }))
      .forEach(l => { if (!filterLevel || filterLevel.includes(l.level)) res.push({ value: l.id, label: "  ".repeat(depth) + (l.code ? `${l.code} · ` : "") + l.name }); walk(l.id, depth + 1); });
    walk("", 0);
    return res;
  }
};
