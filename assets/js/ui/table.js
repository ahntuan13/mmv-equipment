/* ============================================================
   BẢNG DỮ LIỆU CHUẨN (danh sách + tìm kiếm + lọc + sắp xếp + phân trang
   + thêm/sửa/xóa qua ngăn kéo + xuất/nhập Excel), cập nhật trực tiếp.
   Mọi danh sách nghiệp vụ sau này (thiết bị, phiếu bảo trì, vật tư…) dùng chung.

   crudTable(el, ctx, {
     col: "equipment",                       // tên collection
     columns: [{ key, label, render?(row), num?, sort?:false, export?(row) }],
     fields:  [ ...khai báo biểu mẫu, xem renderFields() trong core.js ],
     query?:  { where:[["field","==",v]], orderBy:["code","asc"] },
     filters?: [{ key, label, options:[{value,label}] | ()=>[] }],
     searchKeys?: ["code","name"],
     defaults?: {...}, entity?: "thiết bị",
     beforeSave?(data, existing, rows) → data | throw Error("thông báo"),
     exportName?, importable?: true, toolbar?: "HTML thêm", empty?: "…"
   }) → hàm dọn dẹp
   ============================================================ */
import { $, $$, esc, norm, icon, toast, errMsg, drawer, closeOverlay, confirmBox, renderFields, readFields, exportXlsx, importXlsx, pickFile, fmtDateTime, today } from "../core.js";

export function crudTable(el, ctx, cfg) {
  const { backend } = ctx;
  const entity = cfg.entity || "bản ghi";
  const pageSize = cfg.pageSize || 50;
  const st = { rows: [], q: "", sort: cfg.sort || null, dir: 1, page: 0, f: {}, loading: true, err: null };
  const optsOf = f => typeof f.options === "function" ? f.options() : (f.options || []);

  el.innerHTML = `<div class="toolbar">
      <input type="search" placeholder="Tìm ${esc(entity)}…" aria-label="Tìm kiếm" data-q>
      ${(cfg.filters || []).map(f => `<select data-filter="${f.key}" aria-label="${esc(f.label)}"><option value="">${esc(f.label)}: tất cả</option></select>`).join("")}
      ${cfg.toolbar || ""}
      <span style="flex:1"></span>
      <button class="btn" data-export>${icon("down", 14)} Excel</button>
      ${ctx.canEdit && cfg.importable !== false ? `<button class="btn" data-import>${icon("up", 14)} Nhập</button>` : ""}
      ${ctx.canEdit && cfg.fields && !cfg.noAdd ? `<button class="btn primary" data-add>${icon("plus", 14)} Thêm ${esc(entity)}</button>` : ""}
    </div>
    <div class="panel"><div class="scroll"><table><thead></thead><tbody></tbody></table></div><div class="tfoot"></div></div>`;

  const fillFilters = () => (cfg.filters || []).forEach(f => {
    const sel = el.querySelector(`[data-filter="${f.key}"]`); const v = sel.value;
    sel.innerHTML = `<option value="">${esc(f.label)}: tất cả</option>` + optsOf(f).map(o => `<option value="${esc(o.value)}">${esc(o.label)}</option>`).join("");
    sel.value = v;
  });

  function filtered() {
    const q = norm(st.q);
    const keys = cfg.searchKeys || cfg.columns.map(c => c.key);
    let r = st.rows.filter(row => Object.entries(st.f).every(([k, v]) => !v || String(row[k] ?? "") === v));
    if (q) r = r.filter(row => keys.some(k => norm(row[k]).includes(q)));
    if (st.sort) r = [...r].sort((a, b) => {
      const x = a[st.sort] ?? "", y = b[st.sort] ?? "";
      return (typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), "vi", { numeric: true })) * st.dir;
    });
    return r;
  }

  function draw() {
    el.querySelector("thead").innerHTML = `<tr>${cfg.columns.map(c => `<th class="${c.num ? "num " : ""}${c.sort === false ? "" : "sort"}" data-sort="${c.key}" ${st.sort === c.key ? `aria-sort="${st.dir > 0 ? "ascending" : "descending"}"` : ""}>${esc(c.label)}${st.sort === c.key ? (st.dir > 0 ? " ▲" : " ▼") : ""}</th>`).join("")}</tr>`;
    const tb = el.querySelector("tbody");
    if (st.err) { tb.innerHTML = `<tr><td colspan="${cfg.columns.length}"><div class="callout bad">${esc(errMsg(st.err))}</div></td></tr>`; el.querySelector(".tfoot").innerHTML = ""; return; }
    if (st.loading) { tb.innerHTML = `<tr><td colspan="${cfg.columns.length}" class="empty">Đang tải…</td></tr>`; return; }
    const all = filtered();
    const pages = Math.max(1, Math.ceil(all.length / pageSize));
    st.page = Math.min(st.page, pages - 1);
    const rows = all.slice(st.page * pageSize, (st.page + 1) * pageSize);
    tb.innerHTML = rows.length ? rows.map(r => `<tr class="click" data-id="${esc(r.id)}" tabindex="0">${cfg.columns.map(c => `<td class="${c.num ? "num" : ""}">${c.render ? c.render(r) : esc(r[c.key])}</td>`).join("")}</tr>`).join("")
      : `<tr><td colspan="${cfg.columns.length}" class="empty">${st.rows.length ? "Không có kết quả phù hợp." : esc(cfg.empty || `Chưa có ${entity} nào.`)}</td></tr>`;
    el.querySelector(".tfoot").innerHTML = `<span>${all.length.toLocaleString("vi-VN")} ${esc(entity)}${all.length !== st.rows.length ? ` (lọc từ ${st.rows.length})` : ""}</span>
      ${pages > 1 ? `<span><button class="btn sm" data-pg="-1" ${st.page === 0 ? "disabled" : ""}>‹</button> Trang ${st.page + 1}/${pages} <button class="btn sm" data-pg="1" ${st.page >= pages - 1 ? "disabled" : ""}>›</button></span>` : ""}`;
  }

  /* ---------- Thêm / sửa ---------- */
  function openForm(row = null) {
    const isNew = !row;
    const data = row || { ...(cfg.defaults || {}) };
    const canEdit = ctx.canEdit;
    const fields = canEdit ? cfg.fields : cfg.fields.map(f => ({ ...f, readonly: true }));
    const d = drawer({
      title: isNew ? `Thêm ${entity}` : (cfg.titleOf ? cfg.titleOf(row) : `Chi tiết ${entity}`),
      body: `${renderFields(fields, data)}<div data-err></div>
        ${row ? `<div class="sub">Tạo ${esc(fmtDateTime(row.createdAt))} bởi ${esc(row.createdBy || "—")} · Sửa ${esc(fmtDateTime(row.updatedAt))} bởi ${esc(row.updatedBy || "—")}</div>` : ""}`,
      footer: `${row && ctx.canDelete && !cfg.noDelete ? `<button class="btn danger left" data-del>${icon("trash", 14)} Xóa</button>` : ""}
        <button class="btn" data-close>${canEdit ? "Hủy" : "Đóng"}</button>
        ${canEdit ? `<button class="btn primary" data-save>${isNew ? "Thêm" : "Lưu"}</button>` : ""}`
    });
    d.querySelector("[data-save]")?.addEventListener("click", async e => {
      const { ok, data: v, errors } = readFields(d, cfg.fields);
      const errBox = d.querySelector("[data-err]");
      if (!ok) { errBox.innerHTML = `<div class="callout bad">${errors.map(esc).join("<br>")}</div>`; return; }
      try {
        const out = cfg.beforeSave ? await cfg.beforeSave(v, row, st.rows) : v;
        e.target.disabled = true;
        if (isNew) await backend.add(cfg.col, out); else await backend.update(cfg.col, row.id, out);
        closeOverlay(); toast(isNew ? `Đã thêm ${entity}` : "Đã lưu thay đổi");
      } catch (err) { e.target.disabled = false; errBox.innerHTML = `<div class="callout bad">${esc(errMsg(err))}</div>`; }
    });
    d.querySelector("[data-del]")?.addEventListener("click", async () => {
      const label = cfg.titleOf ? cfg.titleOf(row) : (row.name || row.code || "");
      if (cfg.beforeDelete) { const why = await cfg.beforeDelete(row); if (why) { toast(why, "bad"); return; } }
      if (!await confirmBox(`Xóa ${entity} "${label}"? Thao tác không hoàn tác được.`, { ok: "Xóa", danger: true })) return;
      try { await backend.remove(cfg.col, row.id, label); toast(`Đã xóa ${entity}`); }
      catch (err) { toast(errMsg(err), "bad"); }
    });
  }

  /* ---------- Sự kiện ---------- */
  el.querySelector("[data-q]").addEventListener("input", e => { st.q = e.target.value; st.page = 0; draw(); });
  $$("[data-filter]", el).forEach(s => s.addEventListener("change", () => { st.f[s.dataset.filter] = s.value; st.page = 0; draw(); }));
  el.querySelector("thead").addEventListener("click", e => {
    const th = e.target.closest("th.sort"); if (!th) return;
    const k = th.dataset.sort; st.dir = st.sort === k ? -st.dir : 1; st.sort = k; draw();
  });
  el.querySelector("tbody").addEventListener("click", e => {
    const tr = e.target.closest("tr[data-id]"); if (!tr || e.target.closest("button,a,input")) return;
    const row = st.rows.find(r => r.id === tr.dataset.id);
    if (row) cfg.onRow ? cfg.onRow(row) : (cfg.fields && openForm(row));
  });
  el.querySelector("tbody").addEventListener("keydown", e => { if (e.key === "Enter" && e.target.matches("tr[data-id]")) e.target.click(); });
  el.querySelector(".tfoot").addEventListener("click", e => { const b = e.target.closest("[data-pg]"); if (b) { st.page += +b.dataset.pg; draw(); } });
  el.querySelector("[data-add]")?.addEventListener("click", () => openForm());

  const exportCols = cfg.exportColumns || (cfg.fields || cfg.columns).map(f => ({ key: f.key, label: f.label, export: f.export }));
  el.querySelector("[data-export]").addEventListener("click", () => {
    const rows = filtered();
    if (!rows.length) { toast("Không có dữ liệu để xuất"); return; }
    exportXlsx(`${cfg.exportName || cfg.col}_${today()}`, rows, exportCols);
  });
  el.querySelector("[data-import]")?.addEventListener("click", async () => {
    const file = await pickFile(); if (!file) return;
    try {
      let rows = await importXlsx(file, exportCols);
      if (!rows.length) { toast("File không có dòng nào khớp tiêu đề cột. Xuất Excel trước để lấy mẫu.", "bad"); return; }
      if (cfg.beforeImport) rows = await cfg.beforeImport(rows, st.rows);
      if (!await confirmBox(`Nhập ${rows.length} ${entity} từ "${file.name}"?`, { ok: "Nhập" })) return;
      await backend.bulkAdd(cfg.col, rows.map(r => ({ ...(cfg.defaults || {}), ...r })));
      toast(`Đã nhập ${rows.length} ${entity}`);
    } catch (err) { toast(errMsg(err), "bad"); }
  });

  const unsub = backend.watch(cfg.col, rows => {
    st.rows = cfg.filter ? rows.filter(cfg.filter) : rows; st.loading = false; st.err = null; fillFilters(); draw();
  }, cfg.query, err => { st.err = err; st.loading = false; draw(); });
  draw();

  return Object.assign(() => unsub?.(), { openForm, refresh: () => { fillFilters(); draw(); } });
}
