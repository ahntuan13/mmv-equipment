/* Cài đặt hệ thống (chỉ Quản trị): thông tin nhà máy, ma trận quyền, trạng thái hạ tầng, sao lưu */
import { registerModule, viewHead } from "../router.js";
import { lookups } from "../lookups.js";
import { esc, renderFields, readFields, toast, errMsg, confirmBox, today, icon } from "../core.js";
import { PERMISSIONS, ROLES, roleOrder, LEVEL_LABEL } from "../roles.js";
import { FIREBASE_CONFIG, FIREBASE_SDK, APP } from "../config.js";

const MODULE_NAMES = {
  dashboard: "Tổng quan", equipment: "Thiết bị", maintenance: "Bảo trì", incidents: "Sự cố", spareparts: "Vật tư, phụ tùng",
  reports: "Báo cáo", masterdata: "Danh mục", users: "Người dùng", settings: "Cài đặt", audit: "Nhật ký"
};
const BACKUP_COLS = ["settings", "locations", "departments", "categories", "users", "equipment", "maintenance", "incidents", "spareparts"];

const FIELDS = [
  { key: "plantName", label: "Tên nhà máy", required: true },
  { key: "plantCode", label: "Mã nhà máy" },
  { key: "address", label: "Địa chỉ", span: 2 },
  { key: "contact", label: "Đầu mối liên hệ" },
  { key: "codePrefix", label: "Tiền tố mã thiết bị", hint: "Ví dụ TB → TB-0001 (dùng khi làm phân hệ Thiết bị)" }
];

registerModule({
  key: "settings", label: "Cài đặt", group: "Hệ thống", order: 30,
  render(el, ctx) {
    const live = ctx.backend.mode === "live";
    const draw = () => {
      el.innerHTML = viewHead("Cài đặt", "Thông tin chung, phân quyền và hạ tầng.") + `
      <div class="cols">
        <div class="stack">
          <div class="card"><h3>Thông tin nhà máy</h3><p class="lead">Hiển thị trên trang chủ và các mẫu in/xuất.</p>
            <div data-f>${renderFields(FIELDS, lookups.settings)}</div>
            <div style="display:flex;justify-content:flex-end;margin-top:12px"><button class="btn primary" data-save>Lưu</button></div></div>

          <div class="card"><h3>Ma trận quyền</h3><p class="lead">Khai báo trong <span class="mono">assets/js/roles.js</span> và khớp với <span class="mono">firestore.rules</span> (bảo vệ ở phía máy chủ).</p>
            <div class="scroll"><table class="matrix"><thead><tr><th>Phân hệ</th>${roleOrder.map(r => `<th>${esc(ROLES[r].label)}</th>`).join("")}</tr></thead>
            <tbody>${Object.entries(PERMISSIONS).map(([k, row]) => `<tr><td>${esc(MODULE_NAMES[k] || k)}</td>${row.map(v => `<td>${v ? `<span class="${v >= 2 ? "tick" : ""}">${LEVEL_LABEL[v]}</span>` : '<span class="dash">—</span>'}</td>`).join("")}</tr>`).join("")}</tbody></table></div></div>
        </div>
        <div class="stack">
          <div class="card"><h3>Hạ tầng</h3>
            <table><tbody>
              <tr><td class="sub">Chế độ</td><td>${live ? '<span class="pill ok">Firebase</span>' : '<span class="pill warn">Demo (trình duyệt)</span>'}</td></tr>
              <tr><td class="sub">Firebase project</td><td class="mono">${esc(FIREBASE_CONFIG.projectId || "—")}</td></tr>
              <tr><td class="sub">Firebase SDK</td><td class="mono">${esc(FIREBASE_SDK)}</td></tr>
              <tr><td class="sub">Tên miền hiện tại</td><td class="mono">${esc(location.host || "file://")}</td></tr>
              <tr><td class="sub">Phiên bản app</td><td class="mono">${esc(APP.version)}</td></tr>
            </tbody></table>
            ${live ? `<div class="callout info" style="margin-top:10px">Mỗi tên miền chạy app (github.io, tên miền riêng) phải có trong Firebase → Authentication → Settings → Authorized domains.</div>` : `<div class="callout warn" style="margin-top:10px">Dữ liệu demo chỉ lưu trong trình duyệt này. Điền FIREBASE_CONFIG trong <span class="mono">assets/js/config.js</span> để chạy thật.</div>`}
          </div>
          <div class="card"><h3>Sao lưu</h3><p class="lead">Xuất toàn bộ dữ liệu ra một file Excel, mỗi collection một sheet.</p>
            <button class="btn" data-backup>${icon("down", 14)} Tải bản sao lưu</button>
            ${!live ? `<hr style="border:0;border-top:1px solid var(--line);margin:14px 0"><button class="btn danger" data-reset>${icon("refresh", 14)} Khôi phục dữ liệu demo</button>` : ""}
          </div>
        </div>
      </div>`;
      el.querySelector("[data-save]").onclick = async () => {
        const { ok, data, errors } = readFields(el.querySelector("[data-f]"), FIELDS);
        if (!ok) { toast(errors[0], "bad"); return; }
        try { await ctx.backend.set("settings", "app", { ...data, name: "Thông tin nhà máy" }); toast("Đã lưu thông tin nhà máy"); }
        catch (e) { toast(errMsg(e), "bad"); }
      };
      el.querySelector("[data-backup]").onclick = async () => {
        if (!window.XLSX) { toast("Thư viện Excel chưa tải xong", "bad"); return; }
        try {
          const wb = XLSX.utils.book_new();
          for (const col of BACKUP_COLS) {
            const rows = (await ctx.backend.list(col)).map(r => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, v && typeof v === "object" ? (v.toDate ? v.toDate().toISOString() : JSON.stringify(v)) : v])));
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows.length ? rows : [{ id: "" }]), col);
          }
          XLSX.writeFile(wb, `saoluu_thietbi_${today()}.xlsx`); toast("Đã tạo bản sao lưu");
        } catch (e) { toast(errMsg(e), "bad"); }
      };
      el.querySelector("[data-reset]")?.addEventListener("click", async () => {
        if (await confirmBox("Xóa toàn bộ dữ liệu demo trong trình duyệt này và nạp lại dữ liệu mẫu?", { ok: "Khôi phục", danger: true })) ctx.backend.resetDemo();
      });
    };
    draw();
    return lookups.onChange(c => { if (c === "settings" && !el.contains(document.activeElement)) draw(); });
  }
});
