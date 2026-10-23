/* Nhật ký thao tác — ghi tự động mỗi lần thêm/sửa/xóa/nhập (xem backend.js) */
import { registerModule, viewHead } from "../router.js";
import { crudTable } from "../ui/table.js";
import { esc, fmtDateTime, toDate } from "../core.js";

const ACTIONS = { create: ["Thêm", "ok"], update: ["Sửa", "info"], delete: ["Xóa", "bad"], import: ["Nhập Excel", "ink"] };
const COLS = { users: "Người dùng", locations: "Cơ cấu nhà máy", departments: "Phòng ban", categories: "Danh mục", settings: "Cài đặt",
  equipment: "Thiết bị", maintenance: "Bảo trì", incidents: "Sự cố", spareparts: "Vật tư" };

registerModule({
  key: "audit", label: "Nhật ký", group: "Hệ thống", order: 20,
  render(el, ctx) {
    el.innerHTML = viewHead("Nhật ký thao tác", "500 thao tác gần nhất. Nhật ký không sửa, không xóa được từ ứng dụng.") + `<div data-t></div>`;
    return crudTable(el.querySelector("[data-t]"), { ...ctx, canEdit: false, canDelete: false }, {
      col: "auditLogs", entity: "thao tác", query: { orderBy: ["at", "desc"], limit: 500 }, exportName: "nhat_ky",
      searchKeys: ["label", "byName", "by", "col"],
      columns: [
        { key: "at", label: "Thời điểm", render: r => `<span class="mono">${esc(fmtDateTime(r.at))}</span>` },
        { key: "byName", label: "Người thực hiện", render: r => `${esc(r.byName || "")}<div class="sub">${esc(r.by)}</div>` },
        { key: "action", label: "Thao tác", render: r => { const [l, t] = ACTIONS[r.action] || [r.action, "mut"]; return `<span class="pill ${t}">${esc(l)}</span>`; } },
        { key: "col", label: "Dữ liệu", render: r => esc(COLS[r.col] || r.col) },
        { key: "label", label: "Nội dung", render: r => esc(r.label) }
      ],
      filters: [
        { key: "action", label: "Thao tác", options: Object.entries(ACTIONS).map(([k, v]) => ({ value: k, label: v[0] })) },
        { key: "col", label: "Dữ liệu", options: Object.entries(COLS).map(([k, v]) => ({ value: k, label: v })) }
      ],
      exportColumns: [
        { key: "at", label: "Thời điểm", export: r => fmtDateTime(r.at) }, { key: "byName", label: "Người thực hiện" }, { key: "by", label: "Email" },
        { key: "action", label: "Thao tác", export: r => ACTIONS[r.action]?.[0] || r.action }, { key: "col", label: "Dữ liệu", export: r => COLS[r.col] || r.col },
        { key: "label", label: "Nội dung" }
      ]
    });
  }
});
