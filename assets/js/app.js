/* ============================================================
   KHỞI ĐỘNG ỨNG DỤNG
   ============================================================ */
import { $, esc, toast, errMsg } from "./core.js";
import { backend } from "./backend.js";
import { lookups } from "./lookups.js";
import { mountShell, route } from "./router.js";
import { APP } from "./config.js";
import { ROLES, ASSIGNABLE } from "./roles.js";

/* Thứ tự import = thứ tự đăng ký module. Module mới: thêm 1 dòng import. */
import "./modules/dashboard.js";
import "./modules/placeholders.js";
import "./modules/masterdata.js";
import "./modules/users.js";
import "./modules/audit.js";
import "./modules/settings.js";
import "./modules/profile.js";

let shownKey = "";

function onUser(u) {
  const key = u ? `${u.uid}|${u.role}` : "";
  if (u && key === shownKey) {               // chỉ đổi tên/ảnh → cập nhật nhẹ
    const b = $("#userBtn b"); if (b) b.textContent = u.name;
    return;
  }
  shownKey = key;
  if (!u) { lookups.stop(); renderLogin(); return; }
  if (u.role === "cho") { lookups.stop(); renderPending(u); return; }
  lookups.start();
  mountShell();
}

/* ---------- Màn đăng nhập ---------- */
function hero() {
  return `<section class="hero" role="img" aria-label="Murata — Innovator in Electronics">
    <div class="cap"><h1>${esc(APP.name)} ${esc(APP.short)}</h1><p>${esc(APP.company)} · ${esc(APP.plant)}</p>
      <ul><li>Hồ sơ thiết bị</li><li>Bảo trì định kỳ</li><li>Sự cố &amp; phụ tùng</li><li>Phân quyền, nhật ký</li></ul></div></section>`;
}
const formLogo = () => `<div class="logo brand"><div class="mark">${esc(APP.short)}</div><div class="t"><h1>${esc(APP.name)}</h1><small>v${esc(APP.version)}</small></div></div>`;

function renderLogin() {
  if (backend.mode === "demo") return renderDemoLogin();
  let mode = "login"; // login | register | reset
  const draw = () => {
    $("#root").innerHTML = `<div class="auth">${hero()}<section class="form">${formLogo()}
      <h2>${mode === "register" ? "Tạo tài khoản" : mode === "reset" ? "Quên mật khẩu" : "Đăng nhập"}</h2>
      ${APP.signIn.google && mode === "login" ? `<button class="btn block" data-google><svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg> Đăng nhập bằng Google</button>
        ${APP.signIn.emailPassword ? '<div class="or">hoặc</div>' : ""}` : ""}
      ${APP.signIn.emailPassword ? `<form data-form style="display:flex;flex-direction:column;gap:12px" novalidate>
        ${mode === "register" ? `<div class="field"><label for="nm">Họ tên</label><input id="nm" autocomplete="name" required></div>` : ""}
        <div class="field"><label for="em">Email</label><input id="em" type="email" autocomplete="email" required></div>
        ${mode !== "reset" ? `<div class="field"><label for="pw">Mật khẩu</label><input id="pw" type="password" autocomplete="${mode === "register" ? "new-password" : "current-password"}" required minlength="6"></div>` : ""}
        <div data-err></div>
        <button class="btn primary block" type="submit">${mode === "register" ? "Tạo tài khoản" : mode === "reset" ? "Gửi email đặt lại mật khẩu" : "Đăng nhập"}</button>
      </form>
      <div class="sub" style="display:flex;gap:14px;flex-wrap:wrap">
        ${mode !== "login" ? '<a href="#" data-m="login">Quay lại đăng nhập</a>' : '<a href="#" data-m="register">Tạo tài khoản mới</a><a href="#" data-m="reset">Quên mật khẩu?</a>'}
      </div>` : ""}
      <p class="sub" style="margin:0">Tài khoản mới cần Quản trị duyệt trước khi sử dụng.</p>
    </section></div>`;
    $("[data-google]")?.addEventListener("click", async () => { try { await backend.signInGoogle(); } catch (e) { showErr(e); } });
    document.querySelectorAll("[data-m]").forEach(a => a.onclick = e => { e.preventDefault(); mode = a.dataset.m; draw(); });
    $("[data-form]")?.addEventListener("submit", async e => {
      e.preventDefault();
      const em = $("#em").value.trim(), pw = $("#pw")?.value || "", nm = $("#nm")?.value.trim() || "";
      const btn = e.target.querySelector("[type=submit]"); btn.disabled = true;
      try {
        if (mode === "login") await backend.signInEmail(em, pw);
        else if (mode === "register") await backend.register(em, pw, nm);
        else { await backend.resetPassword(em); toast("Đã gửi email đặt lại mật khẩu"); mode = "login"; draw(); return; }
      } catch (err) { showErr(err); btn.disabled = false; }
    });
    setTimeout(() => $("#em")?.focus(), 30);
  };
  const showErr = e => { const b = $("[data-err]"); if (b) b.innerHTML = `<div class="callout bad">${esc(errMsg(e))}</div>`; else toast(errMsg(e), "bad"); };
  draw();
}

function renderDemoLogin() {
  $("#root").innerHTML = `<div class="auth">${hero()}<section class="form">${formLogo()}
    <h2>Đăng nhập demo</h2>
    <div class="callout warn">Chưa cấu hình Firebase. Dữ liệu lưu trong trình duyệt này; chọn vai trò để xem app dưới góc nhìn từng người dùng.</div>
    <div class="field"><label for="nm">Tên hiển thị</label><input id="nm" value="Người dùng demo"></div>
    <div class="rolepick" role="radiogroup" aria-label="Vai trò">${ASSIGNABLE.map((r, i) => `<label><input type="radio" name="role" value="${r}" ${i === 0 ? "checked" : ""}><div><b>${esc(ROLES[r].label)}</b><span>${esc(ROLES[r].desc)}</span></div></label>`).join("")}</div>
    <button class="btn primary block" data-go>Vào ứng dụng</button>
  </section></div>`;
  $("[data-go]").onclick = () => backend.signInDemo($("#nm").value.trim(), document.querySelector("[name=role]:checked").value);
}

function renderPending(u) {
  $("#root").innerHTML = `<div class="auth">${hero()}<section class="form">${formLogo()}
    <h2>Tài khoản đang chờ duyệt</h2>
    <p style="margin:0">Xin chào <b>${esc(u.name)}</b> (<span class="mono">${esc(u.email)}</span>).</p>
    <div class="callout info">${u.active === false ? "Tài khoản đã bị khóa. Liên hệ Quản trị để được mở lại." : "Quản trị cần gán vai trò cho bạn trước khi sử dụng. Trang sẽ tự vào ứng dụng khi được duyệt."}</div>
    <button class="btn block" data-out>Đăng xuất</button></section></div>`;
  $("[data-out]").onclick = () => backend.signOut();
}

/* ---------- Chạy ---------- */
window.addEventListener("hashchange", () => { if (backend.user && backend.user.role !== "cho") route(); });
backend.onUser(onUser);
backend.init().catch(e => {
  console.error(e);
  $("#root").innerHTML = `<div class="boot"><div class="callout bad" style="max-width:520px">Không khởi động được: ${esc(errMsg(e))}<br><span class="sub">Kiểm tra FIREBASE_CONFIG trong assets/js/config.js và kết nối mạng.</span></div></div>`;
});
