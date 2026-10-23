/* Tổng quan — khung trang chủ. Số liệu nghiệp vụ (thiết bị, bảo trì…) sẽ gắn vào khi có nội dung. */
import { registerModule, viewHead } from "../router.js";
import { lookups } from "../lookups.js";
import { esc } from "../core.js";
import { can } from "../roles.js";
import { PENDING_MODULES } from "./placeholders.js";

registerModule({
  key: "dashboard", label: "Tổng quan", group: "Tổng quan", order: 1,
  render(el, ctx) {
    const draw = () => {
      const pendingUsers = lookups.users.filter(u => u.role === "cho").length;
      const s = lookups.settings;
      const isAdmin = ctx.role === "admin";
      const steps = [
        ["Điền thông tin nhà máy", !!s.address || !!s.contact, "settings"],
        ["Khai báo cơ cấu: khu vực, dây chuyền", lookups.locations.filter(l => l.level !== "factory").length > 0, "masterdata"],
        ["Khai báo phòng ban", lookups.departments.length > 0, "masterdata"],
        ["Khai báo danh mục: loại thiết bị, trạng thái, hãng…", lookups.categories.length > 0, "masterdata"],
        ["Mời người dùng và gán vai trò", lookups.users.filter(u => u.role !== "cho").length > 1, "users"]
      ];
      el.innerHTML = viewHead(`Xin chào, ${ctx.user.name}`, `${esc(s.plantName || "Nhà máy")} · hệ thống quản lý thiết bị (bản nền)`)
        + `<div class="stats">
            <div class="stat"><div class="n">${lookups.locations.length}</div><div class="l">Vị trí trong cơ cấu</div></div>
            <div class="stat"><div class="n">${lookups.categories.length}</div><div class="l">Mục danh mục</div></div>
            <div class="stat"><div class="n">${lookups.users.filter(u => u.role !== "cho").length}</div><div class="l">Người dùng hoạt động</div></div>
            <div class="stat"><div class="n" style="color:${pendingUsers ? "var(--warn)" : "inherit"}">${pendingUsers}</div><div class="l">Tài khoản chờ duyệt</div></div>
          </div>
          <div class="cols">
            <div class="stack">
              <div class="card"><h3>Phân hệ nghiệp vụ</h3><p class="lead">Khung đã sẵn sàng: danh sách, biểu mẫu, phân quyền, nhật ký, xuất/nhập Excel. Nội dung từng phân hệ sẽ gắn vào khi có yêu cầu chi tiết.</p>
                <div class="cards">${PENDING_MODULES.filter(m => can.view(ctx.role, m.key)).map(m => `<button class="card" style="text-align:left;cursor:pointer" data-go="${m.key}"><span class="pill warn">Chờ nội dung</span><h3 style="margin-top:8px">${esc(m.label)}</h3><p class="sub" style="margin:0">${esc(m.desc)}</p></button>`).join("")}</div>
              </div>
            </div>
            <div class="stack">
              ${isAdmin ? `<div class="card"><h3>Thiết lập ban đầu</h3><p class="lead">Dữ liệu nền cần có trước khi nhập thiết bị.</p>
                ${steps.map(([t, done, go]) => `<div style="display:flex;gap:10px;align-items:center;padding:7px 0;border-top:1px solid var(--line)"><span class="pill ${done ? "ok" : "mut"}">${done ? "Xong" : "Chưa"}</span><span style="flex:1">${esc(t)}</span><button class="btn sm" data-go="${go}">Mở</button></div>`).join("")}</div>` : ""}
              ${pendingUsers && can.edit(ctx.role, "users") ? `<div class="callout warn">Có ${pendingUsers} tài khoản đang chờ duyệt. <a href="#/users" style="color:inherit;font-weight:600">Duyệt ngay</a></div>` : ""}
              ${ctx.backend.mode === "demo" ? `<div class="callout info">Đang chạy chế độ demo: dữ liệu chỉ nằm trong trình duyệt này. Điền Firebase config trong <span class="mono">assets/js/config.js</span> để chạy thật.</div>` : ""}
            </div>
          </div>`;
      el.querySelectorAll("[data-go]").forEach(b => b.onclick = () => ctx.navigate(b.dataset.go));
    };
    draw();
    return lookups.onChange(draw);
  }
});
