/* ============================================================
   TIỆN ÍCH DÙNG CHUNG — DOM, định dạng, thông báo, ngăn kéo, hộp thoại,
   biểu mẫu theo khai báo (schema), xuất/nhập Excel
   ============================================================ */

export const $  = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const fmtNum = n => (n === "" || n == null || isNaN(n)) ? "" : Number(n).toLocaleString("vi-VN");
export const dmy = d => { if (!d) return ""; const s = String(d).slice(0, 10).split("-"); return s.length === 3 ? `${s[2]}/${s[1]}/${s[0]}` : String(d); };
export const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
export const initials = s => String(s || "?").trim().split(/\s+/).slice(-2).map(w => w[0]).join("").toUpperCase();
export const sleep = ms => new Promise(r => setTimeout(r, ms));
export const norm = s => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();

/* Hiển thị thời điểm (Date | Firestore Timestamp | ISO | ms) */
export function toDate(v) {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (typeof v.toDate === "function") return v.toDate();
  if (typeof v === "object" && "seconds" in v) return new Date(v.seconds * 1000);
  const d = new Date(v); return isNaN(d) ? null : d;
}
export function fmtDateTime(v) {
  const d = toDate(v); if (!d) return "";
  return d.toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/* localStorage an toàn (có thể bị chặn trong một số trình duyệt) */
export const ls = {
  get(k, def = null) { try { const v = localStorage.getItem(k); return v == null ? def : JSON.parse(v); } catch { return def; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } },
  del(k) { try { localStorage.removeItem(k); } catch {} }
};

/* ---------- Biểu tượng (SVG nét) ---------- */
const P = {
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  out: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  down: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
  up: '<path d="M12 21V9M7 14l5-5 5 5M5 3h14"/>',
  edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>',
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5"/>'
};
export const icon = (n, s = 16) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || ""}</svg>`;

/* ---------- Thông báo ---------- */
export function toast(msg, kind = "") {
  $$(".toast").forEach(t => t.remove());
  const t = document.createElement("div");
  t.className = "toast " + kind; t.textContent = msg; t.setAttribute("role", "status");
  document.body.appendChild(t);
  setTimeout(() => t.remove(), kind === "bad" ? 5000 : 3000);
}
export function errMsg(e) {
  const code = e?.code || "";
  const map = {
    "permission-denied": "Bạn không có quyền thực hiện thao tác này.",
    "auth/invalid-credential": "Email hoặc mật khẩu không đúng.",
    "auth/wrong-password": "Email hoặc mật khẩu không đúng.",
    "auth/user-not-found": "Không tìm thấy tài khoản.",
    "auth/email-already-in-use": "Email này đã có tài khoản.",
    "auth/weak-password": "Mật khẩu cần ít nhất 6 ký tự.",
    "auth/popup-closed-by-user": "Đã đóng cửa sổ đăng nhập.",
    "auth/unauthorized-domain": "Tên miền này chưa được thêm vào Authorized domains của Firebase.",
    "auth/network-request-failed": "Mất kết nối mạng.",
    "unavailable": "Mất kết nối tới máy chủ, thử lại sau."
  };
  return map[code] || e?.message || String(e);
}

/* ---------- Lớp phủ ---------- */
const overlay = () => $("#overlay");
let lastFocus = null;
export function closeOverlay() { overlay().innerHTML = ""; document.removeEventListener("keydown", escClose); lastFocus?.focus?.(); }
function escClose(e) { if (e.key === "Escape") closeOverlay(); }
function mountOverlay(html) {
  lastFocus = document.activeElement;
  overlay().innerHTML = html;
  document.addEventListener("keydown", escClose);
  overlay().querySelectorAll("[data-close]").forEach(b => b.addEventListener("click", closeOverlay));
  setTimeout(() => overlay().querySelector("input:not([type=hidden]),select,textarea,button.primary")?.focus(), 30);
  return overlay();
}

/* Ngăn kéo bên phải. footer: HTML các nút. Trả về phần tử gốc. */
export function drawer({ title, body, footer = "" }) {
  return mountOverlay(`<div class="scrim" data-close></div>
    <aside class="drawer" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <header><h2>${esc(title)}</h2><button class="x" data-close aria-label="Đóng">×</button></header>
      <div class="body">${body}</div>
      ${footer ? `<footer>${footer}</footer>` : ""}
    </aside>`);
}
export function modal({ title, body, footer = "" }) {
  return mountOverlay(`<div class="modal"><div class="box" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <header><h2>${esc(title)}</h2><button class="x" data-close aria-label="Đóng">×</button></header>
      <div class="body">${body}</div>${footer ? `<footer>${footer}</footer>` : ""}</div></div>`);
}
export function confirmBox(message, { title = "Xác nhận", ok = "Đồng ý", danger = false } = {}) {
  return new Promise(res => {
    const el = modal({ title, body: `<p style="margin:0">${esc(message)}</p>`,
      footer: `<button class="btn" data-close>Hủy</button><button class="btn ${danger ? "accent" : "primary"}" data-ok>${esc(ok)}</button>` });
    let done = false;
    el.querySelector("[data-ok]").onclick = () => { done = true; closeOverlay(); res(true); };
    el.querySelectorAll("[data-close]").forEach(b => b.addEventListener("click", () => { if (!done) res(false); }));
  });
}

/* ---------- Biểu mẫu theo khai báo ----------
   field = { key, label, type: text|number|date|select|textarea|email|checkbox,
             options: [{value,label}] | () => [...], required, hint, span: 2, placeholder, readonly } */
export function renderFields(fields, data = {}) {
  return `<div class="grid2">${fields.filter(f => !f.hidden).map(f => {
    const v = data[f.key] ?? f.default ?? "";
    const id = "f_" + f.key;
    const req = f.required ? ' <span class="req">*</span>' : "";
    const ro = f.readonly ? " disabled" : "";
    let input;
    if (f.type === "select") {
      const opts = typeof f.options === "function" ? f.options(data) : (f.options || []);
      input = `<select id="${id}" name="${f.key}"${ro}><option value="">— Chọn —</option>${opts.map(o => `<option value="${esc(o.value)}"${String(o.value) === String(v) ? " selected" : ""}>${esc(o.label)}</option>`).join("")}</select>`;
    } else if (f.type === "textarea") {
      input = `<textarea id="${id}" name="${f.key}" placeholder="${esc(f.placeholder || "")}"${ro}>${esc(v)}</textarea>`;
    } else if (f.type === "checkbox") {
      input = `<label style="display:flex;gap:8px;align-items:center;text-transform:none;letter-spacing:0;font-size:13px;color:var(--fg);font-weight:400"><input type="checkbox" id="${id}" name="${f.key}"${v ? " checked" : ""}${ro}> ${esc(f.checkLabel || "Có")}</label>`;
    } else {
      input = `<input id="${id}" name="${f.key}" type="${f.type || "text"}" value="${esc(v)}" placeholder="${esc(f.placeholder || "")}"${f.type === "number" ? ' inputmode="decimal" step="any"' : ""}${ro}>`;
    }
    return `<div class="field${f.span === 2 || f.type === "textarea" ? " span2" : ""}" data-field="${f.key}">
      <label for="${id}">${esc(f.label)}${req}</label>${input}${f.hint ? `<span class="hint">${esc(f.hint)}</span>` : ""}</div>`;
  }).join("")}</div>`;
}
/* Đọc & kiểm tra. Trả về {ok, data, errors} */
export function readFields(root, fields) {
  const data = {}; const errors = [];
  for (const f of fields.filter(f => !f.hidden && !f.readonly)) {
    const el = root.querySelector(`[name="${f.key}"]`); if (!el) continue;
    let v = f.type === "checkbox" ? el.checked : el.value.trim();
    if (f.type === "number" && v !== "") v = Number(String(v).replace(",", "."));
    const wrap = el.closest(".field");
    const bad = f.required && (v === "" || v == null) || (f.type === "number" && v !== "" && isNaN(v)) || (f.validate && f.validate(v) !== true);
    wrap?.classList.toggle("invalid", !!bad);
    if (bad) errors.push(typeof f.validate === "function" && f.validate(v) !== true ? f.validate(v) : `${f.label}: bắt buộc nhập`);
    data[f.key] = v;
  }
  return { ok: !errors.length, data, errors };
}

/* ---------- Excel (SheetJS nạp từ cdnjs) ---------- */
export function exportXlsx(filename, rows, columns, sheet = "Data") {
  if (!window.XLSX) { toast("Thư viện Excel chưa tải xong, thử lại sau giây lát.", "bad"); return; }
  const aoa = [columns.map(c => c.label), ...rows.map(r => columns.map(c => c.export ? c.export(r) : (r[c.key] ?? "")))];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = columns.map(c => ({ wch: Math.max(10, Math.min(40, (c.label || "").length + 4)) }));
  const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, sheet.slice(0, 31));
  XLSX.writeFile(wb, filename.endsWith(".xlsx") ? filename : filename + ".xlsx");
}
/* Đọc file Excel → mảng object theo tiêu đề cột (khớp label hoặc key, không phân biệt dấu) */
export async function importXlsx(file, columns) {
  if (!window.XLSX) throw new Error("Thư viện Excel chưa tải xong");
  const wb = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
  const raw = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });
  const keyOf = {}; columns.forEach(c => { keyOf[norm(c.label)] = c.key; keyOf[norm(c.key)] = c.key; });
  return raw.map(r => {
    const o = {};
    for (const [h, v] of Object.entries(r)) { const k = keyOf[norm(h)]; if (k) o[k] = v instanceof Date ? v.toISOString().slice(0, 10) : (typeof v === "string" ? v.trim() : v); }
    return o;
  }).filter(o => Object.values(o).some(v => v !== "" && v != null));
}
export function pickFile(accept = ".xlsx,.xls,.csv") {
  return new Promise(res => {
    const i = document.createElement("input"); i.type = "file"; i.accept = accept;
    i.onchange = () => res(i.files[0] || null); i.click();
  });
}
