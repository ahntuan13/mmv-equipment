/* Phân hệ nghiệp vụ — giữ chỗ, chờ nội dung chi tiết.
   Khi làm thật: tạo file modules/<key>.js riêng (theo mẫu modules/masterdata.js dùng crudTable),
   xóa dòng tương ứng ở đây, import file mới trong app.js. */
import { registerModule, viewHead } from "../router.js";
import { esc } from "../core.js";
import { LEVEL_LABEL } from "../roles.js";

export const PENDING_MODULES = [
  { key: "equipment",   label: "Thiết bị",          group: "Thiết bị & bảo trì", order: 10, col: "equipment",   desc: "Hồ sơ thiết bị, mã, vị trí, thông số, tài liệu, QR." },
  { key: "maintenance", label: "Bảo trì",           group: "Thiết bị & bảo trì", order: 20, col: "maintenance", desc: "Kế hoạch bảo trì định kỳ, phiếu công việc, lịch sử." },
  { key: "incidents",   label: "Sự cố",             group: "Thiết bị & bảo trì", order: 30, col: "incidents",   desc: "Báo hỏng, xử lý, thời gian dừng máy." },
  { key: "spareparts",  label: "Vật tư, phụ tùng",  group: "Thiết bị & bảo trì", order: 40, col: "spareparts",  desc: "Tồn kho phụ tùng, nhập/xuất cho bảo trì." },
  { key: "reports",     label: "Báo cáo",           group: "Báo cáo",            order: 10, col: "",            desc: "Báo cáo tổng hợp, xuất Excel/PDF." }
];

for (const m of PENDING_MODULES) {
  registerModule({
    ...m, pending: true,
    render(el, ctx) {
      el.innerHTML = viewHead(m.label, esc(m.desc)) + `
        <div class="card" style="max-width:720px">
          <span class="pill warn">Chờ nội dung</span>
          <h3 style="margin-top:10px">Phân hệ đã có chỗ trong hệ thống</h3>
          <p class="lead">Menu, phân quyền và quy tắc bảo mật dữ liệu cho phân hệ này đã được khai báo. Khi có yêu cầu chi tiết (trường dữ liệu, quy trình, mẫu biểu), nội dung sẽ được dựng trên bảng dữ liệu chuẩn có sẵn.</p>
          <table style="margin-top:6px"><tbody>
            <tr><td class="sub">Mã phân hệ</td><td class="mono">${esc(m.key)}</td></tr>
            ${m.col ? `<tr><td class="sub">Collection Firestore</td><td class="mono">${esc(m.col)}</td></tr>` : ""}
            <tr><td class="sub">Quyền của bạn</td><td>${esc(LEVEL_LABEL[ctx.level])}</td></tr>
          </tbody></table>
        </div>`;
    }
  });
}
