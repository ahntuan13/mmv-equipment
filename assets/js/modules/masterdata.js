/* Dữ liệu nền: cơ cấu nhà máy (cây vị trí), phòng ban, danh mục theo nhóm */
import { registerModule, viewHead } from "../router.js";
import { crudTable } from "../ui/table.js";
import { lookups, CATEGORY_GROUPS, LOCATION_LEVELS } from "../lookups.js";
import { esc, icon, drawer, closeOverlay, confirmBox, renderFields, readFields, toast, errMsg } from "../core.js";

/* Mã không trùng trong cùng phạm vi */
const uniqueCode = (scope = () => true) => (data, existing, rows) => {
  if (data.code) {
    const dup = rows.find(r => r.id !== existing?.id && scope(r) && String(r.code || "").toLowerCase() === String(data.code).toLowerCase());
    if (dup) throw new Error(`Mã "${data.code}" đã dùng cho "${dup.name}".`);
  }
  return data;
};

registerModule({
  key: "masterdata", label: "Danh mục", group: "Dữ liệu nền", order: 10,
  render(el, ctx) {
    const tabs = [["locations", "Cơ cấu nhà máy"], ["departments", "Phòng ban"], ...CATEGORY_GROUPS.map(g => ["cat:" + g.key, g.label])];
    let tab = sessionStorage.getItem("mmv.md.tab") || "locations";
    if (!tabs.some(t => t[0] === tab)) tab = "locations";
    let sub = null;

    el.innerHTML = viewHead("Danh mục", "Dữ liệu nền dùng chung cho mọi phân hệ. Nên khai báo đủ trước khi nhập thiết bị.")
      + `<div class="seg" role="tablist" style="margin-bottom:14px">${tabs.map(([k, l]) => `<button role="tab" data-tab="${k}" aria-pressed="${k === tab}">${esc(l)}</button>`).join("")}</div><div data-body></div>`;
    const body = el.querySelector("[data-body]");

    const open = k => {
      tab = k; try { sessionStorage.setItem("mmv.md.tab", k); } catch {}
      el.querySelectorAll("[data-tab]").forEach(b => b.setAttribute("aria-pressed", b.dataset.tab === k));
      sub?.(); sub = null; body.innerHTML = "";
      if (k === "locations") sub = locationTree(body, ctx);
      else if (k === "departments") sub = crudTable(body, ctx, {
        col: "departments", entity: "phòng ban", sort: "code", exportName: "phong_ban",
        columns: [{ key: "code", label: "Mã" }, { key: "name", label: "Tên phòng ban" }, { key: "note", label: "Ghi chú" }],
        fields: [{ key: "code", label: "Mã", required: true }, { key: "name", label: "Tên phòng ban", required: true }, { key: "note", label: "Ghi chú", type: "textarea" }],
        beforeSave: uniqueCode(),
        beforeDelete: r => lookups.users.some(u => u.dept === r.id) ? "Còn người dùng thuộc phòng ban này, chuyển họ sang phòng khác trước." : ""
      });
      else {
        const g = CATEGORY_GROUPS.find(x => "cat:" + x.key === k);
        sub = crudTable(body, ctx, {
          col: "categories", entity: g.label.toLowerCase(), sort: "code", exportName: "danh_muc_" + g.key,
          filter: r => r.group === g.key, defaults: { group: g.key },
          columns: [{ key: "code", label: "Mã" }, { key: "name", label: "Tên" }, { key: "note", label: "Ghi chú" }],
          fields: [{ key: "code", label: "Mã" }, { key: "name", label: "Tên", required: true }, { key: "note", label: "Ghi chú", type: "textarea" }],
          beforeSave: (d, ex, rows) => uniqueCode()({ ...d, group: g.key }, ex, rows),
          beforeImport: rows => rows.map(r => ({ ...r, group: g.key }))
        });
      }
    };
    el.querySelectorAll("[data-tab]").forEach(b => b.onclick = () => open(b.dataset.tab));
    open(tab);
    return () => sub?.();
  }
});

/* ---------- Cây cơ cấu nhà máy ---------- */
function locationTree(el, ctx) {
  const { backend } = ctx;
  const fields = (self) => [
    { key: "code", label: "Mã", required: true },
    { key: "name", label: "Tên", required: true },
    { key: "level", label: "Cấp", type: "select", required: true, options: LOCATION_LEVELS.map(l => ({ value: l.key, label: l.label })) },
    { key: "parentId", label: "Thuộc", type: "select", options: () => lookups.locationOptions().filter(o => o.value !== self?.id && !isDescendant(o.value, self?.id)), hint: "Để trống nếu là cấp cao nhất (nhà máy)" },
    { key: "note", label: "Ghi chú", type: "textarea" }
  ];
  const isDescendant = (id, ancestor) => {
    if (!ancestor) return false; let cur = lookups.locations.find(l => l.id === id); let g = 0;
    while (cur && g++ < 10) { if (cur.parentId === ancestor) return true; cur = lookups.locations.find(l => l.id === cur.parentId); }
    return false;
  };
  const lvlLabel = k => LOCATION_LEVELS.find(l => l.key === k)?.label || k;
  const nextLevel = k => ({ factory: "area", area: "line" }[k] || "line");

  function form(row, preset = {}) {
    const isNew = !row; const f = fields(row);
    const d = drawer({
      title: isNew ? "Thêm vị trí" : `${row.code} · ${row.name}`,
      body: renderFields(ctx.canEdit ? f : f.map(x => ({ ...x, readonly: true })), row || preset) + `<div data-err></div>`,
      footer: `${row && ctx.canDelete ? `<button class="btn danger left" data-del>${icon("trash", 14)} Xóa</button>` : ""}<button class="btn" data-close>Đóng</button>${ctx.canEdit ? `<button class="btn primary" data-save>${isNew ? "Thêm" : "Lưu"}</button>` : ""}`
    });
    d.querySelector("[data-save]")?.addEventListener("click", async () => {
      const { ok, data, errors } = readFields(d, f);
      const box = d.querySelector("[data-err]");
      if (!ok) { box.innerHTML = `<div class="callout bad">${errors.map(esc).join("<br>")}</div>`; return; }
      const dup = lookups.locations.find(l => l.id !== row?.id && String(l.code).toLowerCase() === data.code.toLowerCase());
      if (dup) { box.innerHTML = `<div class="callout bad">Mã "${esc(data.code)}" đã dùng cho "${esc(dup.name)}".</div>`; return; }
      try { isNew ? await backend.add("locations", data) : await backend.update("locations", row.id, data); closeOverlay(); toast(isNew ? "Đã thêm vị trí" : "Đã lưu"); }
      catch (e) { box.innerHTML = `<div class="callout bad">${esc(errMsg(e))}</div>`; }
    });
    d.querySelector("[data-del]")?.addEventListener("click", async () => {
      if (lookups.locations.some(l => l.parentId === row.id)) { toast("Vị trí còn cấp con, xóa hoặc chuyển cấp con trước.", "bad"); return; }
      if (!await confirmBox(`Xóa vị trí "${row.name}"?`, { ok: "Xóa", danger: true })) return;
      try { await backend.remove("locations", row.id, `${row.code} · ${row.name}`); toast("Đã xóa"); } catch (e) { toast(errMsg(e), "bad"); }
    });
  }

  function draw() {
    const kids = pid => lookups.locations.filter(l => (l.parentId || "") === pid).sort((a, b) => String(a.code).localeCompare(String(b.code), "vi", { numeric: true }));
    const node = l => `<li><div class="node"><span class="lvl">${esc(lvlLabel(l.level))}</span><span class="mono">${esc(l.code)}</span><b style="font-weight:600">${esc(l.name)}</b>
        <span class="acts">${ctx.canEdit && l.level !== "line" ? `<button class="btn sm" data-addc="${l.id}" title="Thêm cấp con">${icon("plus", 13)}</button>` : ""}<button class="btn sm" data-edit="${l.id}" title="${ctx.canEdit ? "Sửa" : "Xem"}">${icon("edit", 13)}</button></span></div>
        ${kids(l.id).length ? `<ul>${kids(l.id).map(node).join("")}</ul>` : ""}</li>`;
    const roots = kids("");
    el.innerHTML = `<div class="toolbar"><span class="sub">Nhà máy › Khu vực/Xưởng › Dây chuyền/Vị trí. Thiết bị sẽ gắn vào một vị trí trong cây này.</span><span style="flex:1"></span>
        ${ctx.canEdit ? `<button class="btn primary" data-addroot>${icon("plus", 14)} Thêm vị trí</button>` : ""}</div>
      <div class="card">${roots.length ? `<ul class="tree">${roots.map(node).join("")}</ul>` : `<div class="empty">Chưa có vị trí nào. Bắt đầu bằng cấp Nhà máy.</div>`}</div>`;
    el.querySelector("[data-addroot]")?.addEventListener("click", () => form(null, { level: lookups.locations.length ? "area" : "factory", parentId: lookups.locations.find(l => l.level === "factory")?.id || "" }));
    el.querySelectorAll("[data-addc]").forEach(b => b.onclick = () => { const p = lookups.locations.find(l => l.id === b.dataset.addc); form(null, { parentId: p.id, level: nextLevel(p.level) }); });
    el.querySelectorAll("[data-edit]").forEach(b => b.onclick = () => form(lookups.locations.find(l => l.id === b.dataset.edit)));
  }
  draw();
  return lookups.onChange(c => { if (c === "locations") draw(); });
}
