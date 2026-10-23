/* Người dùng & phân quyền. Tài khoản tự tạo khi người dùng đăng nhập lần đầu;
   Quản trị duyệt, gán vai trò, phòng ban, hoặc khóa tài khoản. */
import { registerModule, viewHead, roleTone } from "../router.js";
import { crudTable } from "../ui/table.js";
import { lookups } from "../lookups.js";
import { esc, fmtDateTime } from "../core.js";
import { ROLES, ASSIGNABLE, roleLabel } from "../roles.js";

registerModule({
  key: "users", label: "Người dùng", group: "Hệ thống", order: 10,
  render(el, ctx) {
    el.innerHTML = viewHead("Người dùng", "Người dùng tự đăng nhập bằng Google hoặc email; tài khoản mới ở trạng thái <b>Chờ duyệt</b> cho đến khi Quản trị gán vai trò.") + `<div data-t></div>`;
    const me = ctx.user.uid;
    return crudTable(el.querySelector("[data-t]"), ctx, {
      col: "users", entity: "người dùng", noAdd: true, noDelete: true, importable: false, exportName: "nguoi_dung",
      sort: "name",
      columns: [
        { key: "name", label: "Họ tên", render: r => `<b style="font-weight:600">${esc(r.name)}</b>${r.id === me ? ' <span class="pill mut">Bạn</span>' : ""}` },
        { key: "email", label: "Email", render: r => `<span class="mono">${esc(r.email)}</span>` },
        { key: "dept", label: "Phòng ban", render: r => esc(lookups.deptName(r.dept)) },
        { key: "role", label: "Vai trò", render: r => `<span class="pill ${roleTone(r.role)}">${esc(roleLabel(r.role))}</span>` },
        { key: "active", label: "Trạng thái", render: r => r.active === false ? '<span class="pill bad">Đã khóa</span>' : '<span class="pill ok">Hoạt động</span>' },
        { key: "lastLogin", label: "Đăng nhập gần nhất", render: r => `<span class="sub">${esc(fmtDateTime(r.lastLogin))}</span>` }
      ],
      filters: [
        { key: "role", label: "Vai trò", options: Object.entries(ROLES).map(([k, v]) => ({ value: k, label: v.label })) },
        { key: "dept", label: "Phòng ban", options: () => lookups.deptOptions() }
      ],
      fields: [
        { key: "name", label: "Họ tên", required: true },
        { key: "email", label: "Email", readonly: true },
        { key: "role", label: "Vai trò", type: "select", required: true, options: [...ASSIGNABLE, "cho"].map(k => ({ value: k, label: `${ROLES[k].label} — ${ROLES[k].desc}` })), span: 2 },
        { key: "dept", label: "Phòng ban", type: "select", options: () => lookups.deptOptions() },
        { key: "active", label: "Cho phép đăng nhập", type: "checkbox", checkLabel: "Hoạt động", default: true }
      ],
      exportColumns: [
        { key: "name", label: "Họ tên" }, { key: "email", label: "Email" },
        { key: "dept", label: "Phòng ban", export: r => lookups.deptName(r.dept) },
        { key: "role", label: "Vai trò", export: r => roleLabel(r.role) },
        { key: "active", label: "Hoạt động", export: r => r.active === false ? "Không" : "Có" }
      ],
      titleOf: r => r.name || r.email,
      beforeSave(data, ex, rows) {
        if (ex?.id === me && (data.role !== "admin" || data.active === false)) throw new Error("Không thể tự hạ quyền hoặc khóa tài khoản của chính mình.");
        if (ex?.role === "admin" && data.role !== "admin" && rows.filter(r => r.role === "admin" && r.active !== false).length <= 1)
          throw new Error("Phải còn ít nhất một Quản trị.");
        return data;
      }
    });
  }
});
