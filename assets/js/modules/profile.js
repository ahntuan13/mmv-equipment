/* Tài khoản của tôi (mở từ nút tên người dùng ở góc trên) */
import { registerModule, viewHead, roleTone } from "../router.js";
import { lookups } from "../lookups.js";
import { esc, toast, errMsg, initials } from "../core.js";
import { roleLabel, ROLES } from "../roles.js";

registerModule({
  key: "profile", label: "Tài khoản", group: "Hệ thống", order: 99, always: true, hiddenInNav: true, perm: "dashboard",
  render(el, ctx) {
    const u = ctx.user;
    el.innerHTML = viewHead("Tài khoản của tôi") + `
      <div class="card" style="max-width:560px">
        <div style="display:flex;gap:14px;align-items:center;margin-bottom:14px">
          <span class="avatar" style="width:52px;height:52px;font-size:18px">${u.photo ? `<img src="${esc(u.photo)}" alt="" referrerpolicy="no-referrer">` : esc(initials(u.name))}</span>
          <div><b style="font-size:16px">${esc(u.name)}</b><div class="sub mono">${esc(u.email)}</div></div>
        </div>
        <table><tbody>
          <tr><td class="sub">Vai trò</td><td><span class="pill ${roleTone(u.role)}">${esc(roleLabel(u.role))}</span> <span class="sub">${esc(ROLES[u.role]?.desc || "")}</span></td></tr>
          <tr><td class="sub">Phòng ban</td><td>${esc(lookups.deptName(u.dept) || "—")}</td></tr>
        </tbody></table>
        <div class="field" style="margin-top:14px"><label for="pn">Tên hiển thị</label><input id="pn" value="${esc(u.name)}"></div>
        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px">
          <button class="btn" data-out>Đăng xuất</button><button class="btn primary" data-save>Lưu tên</button></div>
      </div>`;
    el.querySelector("[data-save]").onclick = async () => {
      const name = el.querySelector("#pn").value.trim(); if (!name) return;
      try { await ctx.backend.update("users", u.uid, { name }); toast("Đã lưu"); } catch (e) { toast(errMsg(e), "bad"); }
    };
    el.querySelector("[data-out]").onclick = () => ctx.backend.signOut();
  }
});
