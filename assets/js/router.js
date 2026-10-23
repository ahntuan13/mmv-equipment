/* ============================================================
   KHUNG ỨNG DỤNG — đăng ký module, menu, điều hướng theo #hash
   Thêm module mới:
     registerModule({ key:"equipment", label:"Thiết bị", group:"Thiết bị & bảo trì",
                      order:10, render(el, ctx){ ... return cleanupFn } })
   rồi thêm key vào PERMISSIONS (roles.js) và firestore.rules.
   ============================================================ */
import { $, $$, esc, icon, initials, ls, closeOverlay } from "./core.js";
import { can, level, roleLabel, ROLES } from "./roles.js";
import { backend } from "./backend.js";
import { APP } from "./config.js";

const modules = [];
const GROUPS = ["Tổng quan", "Thiết bị & bảo trì", "Báo cáo", "Dữ liệu nền", "Hệ thống"];
let cleanup = null;

export function registerModule(m) { modules.push({ order: 50, group: "Tổng quan", ...m }); }
const visible = () => modules.filter(m => can.view(backend.user?.role, m.perm || m.key))
  .sort((a, b) => GROUPS.indexOf(a.group) - GROUPS.indexOf(b.group) || a.order - b.order);
const current = () => (location.hash.replace(/^#\/?/, "").split("?")[0]) || "";
export const navigate = key => { location.hash = "#/" + key; };

export function mountShell() {
  const u = backend.user;
  $("#root").innerHTML = `<div class="app">
    <aside class="nav" aria-label="Menu chính">
      <div class="brand"><div class="mark">${esc(APP.short)}</div><div><h1>${esc(APP.name)}</h1><small>${esc(APP.plant)}</small></div></div>
      <nav class="links" id="navlinks"></nav>
      <div class="foot">v${esc(APP.version)} · ${backend.mode === "live" ? "Firebase" : "Demo"}</div>
    </aside>
    <main>
      <div class="topbar">
        <span class="crumb" id="crumb"></span><span class="sp"></span>
        <span class="mode ${backend.mode === "live" ? "live" : "demo"}" title="${backend.mode === "live" ? "Đang dùng Firebase" : "Dữ liệu lưu trong trình duyệt này"}">${backend.mode === "live" ? "● Trực tuyến" : "Chế độ demo"}</span>
        <button class="iconbtn" id="themeBtn" aria-label="Đổi giao diện sáng/tối">${icon(isDark() ? "sun" : "moon")}</button>
        <button class="userchip" id="userBtn" aria-label="Tài khoản">
          <span class="avatar">${u.photo ? `<img src="${esc(u.photo)}" alt="" referrerpolicy="no-referrer">` : esc(initials(u.name))}</span>
          <div><b>${esc(u.name)}</b><small>${esc(roleLabel(u.role))}</small></div>
        </button>
        <button class="iconbtn" id="outBtn" aria-label="Đăng xuất" title="Đăng xuất">${icon("out")}</button>
      </div>
      <div id="view"></div>
    </main></div>`;
  $("#themeBtn").onclick = toggleTheme;
  $("#outBtn").onclick = () => backend.signOut();
  $("#userBtn").onclick = () => navigate("profile");
  renderNav();
  route();
}

function renderNav() {
  const cur = current();
  let html = "", lastG = "";
  for (const m of visible().filter(m => !m.hiddenInNav)) {
    if (m.group !== lastG) { html += `<div class="grp">${esc(m.group)}</div>`; lastG = m.group; }
    html += `<button data-go="${m.key}"${m.key === cur ? ' aria-current="page"' : ""}>${esc(m.label)}${m.pending ? '<span class="tag wait">chờ</span>' : ""}</button>`;
  }
  $("#navlinks").innerHTML = html;
  $$("#navlinks [data-go]").forEach(b => b.onclick = () => navigate(b.dataset.go));
}

export function route() {
  if (!$("#view")) return;
  closeOverlay();
  const vis = visible();
  let m = vis.find(x => x.key === current()) || modules.find(x => x.key === current() && x.always);
  if (!m) { m = vis[0]; if (m && current() !== m.key) { history.replaceState(null, "", "#/" + m.key); } }
  try { cleanup?.(); } catch {}
  cleanup = null;
  renderNav();
  const view = $("#view");
  if (!m) { view.innerHTML = `<div class="empty">Không có mục nào bạn được phép xem.</div>`; return; }
  $("#crumb").textContent = `${m.group} / ${m.label}`;
  document.title = `${m.label} · ${APP.name} ${APP.short}`;
  const role = backend.user.role, key = m.perm || m.key;
  const ctx = { user: backend.user, role, level: level(role, key), canEdit: can.edit(role, key), canDelete: can.delete(role, key), backend, navigate };
  view.innerHTML = "";
  try { cleanup = m.render(view, ctx) || null; }
  catch (e) { console.error(e); view.innerHTML = `<div class="callout bad">Lỗi khi mở ${esc(m.label)}: ${esc(e.message)}</div>`; }
  window.scrollTo(0, 0);
}

/* ---------- Giao diện sáng/tối ---------- */
function isDark() {
  const t = document.documentElement.dataset.theme;
  return t ? t === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
}
function toggleTheme() {
  const next = isDark() ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem("mmv.theme", next); } catch {}
  $("#themeBtn").innerHTML = icon(next === "dark" ? "sun" : "moon");
}

/* Tiêu đề chuẩn cho mỗi màn hình */
export function viewHead(title, desc = "", actions = "") {
  return `<div class="vhead"><div><h2>${esc(title)}</h2>${desc ? `<p>${desc}</p>` : ""}</div>${actions ? `<div class="act">${actions}</div>` : ""}</div>`;
}
export const roleTone = r => ROLES[r]?.tone || "mut";
