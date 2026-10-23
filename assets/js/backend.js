/* ============================================================
   LỚP DỮ LIỆU & ĐĂNG NHẬP
   Một giao diện chung, hai cách chạy:
   - "live": Firebase Auth + Cloud Firestore (khi FIREBASE_CONFIG có apiKey)
   - "demo": lưu trong trình duyệt (localStorage), đăng nhập bằng cách chọn vai trò
   Module nghiệp vụ chỉ gọi backend.list/watch/get/add/update/set/remove,
   không gọi thẳng Firebase — đổi hạ tầng sau này không phải sửa module.
   ============================================================ */
import { FIREBASE_CONFIG, FIREBASE_SDK, APP } from "./config.js";
import { ls, uid as newId } from "./core.js";
import { seedDemo } from "./seed.js";

const LIVE = !!FIREBASE_CONFIG.apiKey;
const NO_AUDIT = new Set(["auditLogs"]);
const userListeners = new Set();
let current = null;            // hồ sơ người dùng đang đăng nhập {uid,email,name,role,...}
const emitUser = () => userListeners.forEach(f => f(current));

/* ------------------------------------------------------------ */
/*  CHẾ ĐỘ LIVE — Firebase                                       */
/* ------------------------------------------------------------ */
function liveBackend() {
  const base = `https://www.gstatic.com/firebasejs/${FIREBASE_SDK}`;
  let A, F, auth, db, unsubProfile = null;

  async function init() {
    const [app, a, f] = await Promise.all([
      import(`${base}/firebase-app.js`), import(`${base}/firebase-auth.js`), import(`${base}/firebase-firestore.js`)
    ]);
    A = a; F = f;
    const fb = app.initializeApp(FIREBASE_CONFIG);
    auth = A.getAuth(fb);
    auth.languageCode = "vi";
    try {
      db = F.initializeFirestore(fb, { localCache: F.persistentLocalCache({ tabManager: F.persistentMultipleTabManager() }) });
    } catch { db = F.getFirestore(fb); }

    await new Promise(resolve => {
      let first = true;
      A.onAuthStateChanged(auth, async u => {
        unsubProfile?.(); unsubProfile = null;
        if (!u) { current = null; emitUser(); if (first) { first = false; resolve(); } return; }
        try { await ensureProfile(u); } catch (e) { console.error(e); }
        unsubProfile = F.onSnapshot(F.doc(db, "users", u.uid), snap => {
          const d = snap.data() || {};
          current = { uid: u.uid, email: u.email, name: d.name || u.displayName || u.email, photo: u.photoURL || "", ...d, role: d.active === false ? "cho" : (d.role || "cho") };
          emitUser();
          if (first) { first = false; resolve(); }
        }, err => { console.error(err); current = { uid: u.uid, email: u.email, name: u.displayName || u.email, role: "cho" }; emitUser(); if (first) { first = false; resolve(); } });
      });
    });
  }

  /* Lần đăng nhập đầu tạo hồ sơ users/{uid} */
  async function ensureProfile(u) {
    const ref = F.doc(db, "users", u.uid);
    const snap = await F.getDoc(ref);
    if (snap.exists()) { F.updateDoc(ref, { lastLogin: F.serverTimestamp() }).catch(() => {}); return; }
    const isAdmin = APP.adminEmails.map(e => e.toLowerCase()).includes((u.email || "").toLowerCase());
    await F.setDoc(ref, {
      email: u.email || "", name: u.displayName || (u.email || "").split("@")[0], photo: u.photoURL || "",
      role: isAdmin ? "admin" : (APP.requireApproval ? "cho" : "xem"),
      active: true, dept: "", createdAt: F.serverTimestamp(), lastLogin: F.serverTimestamp()
    });
  }

  const stamp = (data, isNew) => ({
    ...data,
    ...(isNew ? { createdAt: F.serverTimestamp(), createdBy: current?.email || "" } : {}),
    updatedAt: F.serverTimestamp(), updatedBy: current?.email || ""
  });
  const toObj = s => ({ id: s.id, ...s.data() });
  function buildQuery(col, { where = [], orderBy = null, limit = 0 } = {}) {
    const parts = where.map(([k, op, v]) => F.where(k, op, v));
    if (orderBy) parts.push(F.orderBy(orderBy[0], orderBy[1] || "asc"));
    if (limit) parts.push(F.limit(limit));
    return F.query(F.collection(db, col), ...parts);
  }

  return {
    mode: "live", init,
    async signInGoogle() { await A.signInWithPopup(auth, new A.GoogleAuthProvider()); },
    async signInEmail(email, pw) { await A.signInWithEmailAndPassword(auth, email, pw); },
    async register(email, pw, name) {
      const c = await A.createUserWithEmailAndPassword(auth, email, pw);
      if (!name) return;
      await A.updateProfile(c.user, { displayName: name });
      /* Hồ sơ users/{uid} do ensureProfile() tạo song song — chờ có rồi mới ghi tên */
      const ref = F.doc(db, "users", c.user.uid);
      for (let i = 0; i < 5; i++) {
        try { await F.updateDoc(ref, { name }); break; } catch { await new Promise(r => setTimeout(r, 800)); }
      }
    },
    async resetPassword(email) { await A.sendPasswordResetEmail(auth, email); },
    async signOut() { await A.signOut(auth); },

    async list(col, opts) { return (await F.getDocs(buildQuery(col, opts))).docs.map(toObj); },
    watch(col, cb, opts, onErr) { return F.onSnapshot(buildQuery(col, opts), s => cb(s.docs.map(toObj)), e => { console.error(e); onErr?.(e); }); },
    async get(col, id) { const s = await F.getDoc(F.doc(db, col, id)); return s.exists() ? toObj(s) : null; },
    async add(col, data) { const r = await F.addDoc(F.collection(db, col), stamp(data, true)); return r.id; },
    async set(col, id, data, merge = true) { await F.setDoc(F.doc(db, col, id), stamp(data, false), { merge }); return id; },
    async update(col, id, data) { await F.updateDoc(F.doc(db, col, id), stamp(data, false)); },
    async remove(col, id) { await F.deleteDoc(F.doc(db, col, id)); },
    async bulkAdd(col, rows) {
      for (let i = 0; i < rows.length; i += 400) {
        const b = F.writeBatch(db);
        rows.slice(i, i + 400).forEach(r => b.set(F.doc(F.collection(db, col)), stamp(r, true)));
        await b.commit();
      }
    },
    async log(entry) { await F.addDoc(F.collection(db, "auditLogs"), { ...entry, at: F.serverTimestamp(), by: current?.email || "", byName: current?.name || "" }); }
  };
}

/* ------------------------------------------------------------ */
/*  CHẾ ĐỘ DEMO — localStorage                                   */
/* ------------------------------------------------------------ */
function demoBackend() {
  const KEY = "mmv.db.v1", UKEY = "mmv.demoUser";
  let store = ls.get(KEY);
  if (!store) { store = seedDemo(); ls.set(KEY, store); }
  const subs = {};   // col -> Set(fn)
  const save = col => { ls.set(KEY, store); (subs[col] || new Set()).forEach(f => f()); };
  const tbl = col => (store[col] ||= {});
  const now = () => new Date().toISOString();

  function query(col, { where = [], orderBy = null, limit = 0 } = {}) {
    let rows = Object.entries(tbl(col)).map(([id, d]) => ({ id, ...d }));
    for (const [k, op, v] of where) rows = rows.filter(r => {
      const x = r[k];
      switch (op) { case "==": return x == v; case "!=": return x != v; case ">": return x > v; case ">=": return x >= v;
        case "<": return x < v; case "<=": return x <= v; case "in": return v.includes(x); case "array-contains": return (x || []).includes(v); default: return true; }
    });
    if (orderBy) { const [k, dir] = orderBy; rows.sort((a, b) => (a[k] > b[k] ? 1 : a[k] < b[k] ? -1 : 0) * (dir === "desc" ? -1 : 1)); }
    return limit ? rows.slice(0, limit) : rows;
  }
  const stamp = (data, isNew) => ({ ...data, ...(isNew ? { createdAt: now(), createdBy: current?.email || "" } : {}), updatedAt: now(), updatedBy: current?.email || "" });

  return {
    mode: "demo",
    async init() {
      const u = ls.get(UKEY);
      if (u) { const p = tbl("users")[u.uid]; current = p ? { uid: u.uid, ...p } : null; }
      emitUser();
    },
    async signInDemo(name, role) {
      const id = "demo-" + role;
      tbl("users")[id] = { ...(tbl("users")[id] || {}), email: `${role}@demo.local`, name: name || "Người dùng demo", role, active: true, dept: tbl("users")[id]?.dept || "", lastLogin: now() };
      save("users"); ls.set(UKEY, { uid: id });
      current = { uid: id, ...tbl("users")[id] }; emitUser();
    },
    async signOut() { ls.del(UKEY); current = null; emitUser(); },
    resetDemo() { ls.del(KEY); ls.del(UKEY); location.reload(); },

    async list(col, opts) { return query(col, opts); },
    watch(col, cb, opts) {
      const fn = () => cb(query(col, opts));
      (subs[col] ||= new Set()).add(fn); setTimeout(fn, 0);
      return () => subs[col].delete(fn);
    },
    async get(col, id) { const d = tbl(col)[id]; return d ? { id, ...d } : null; },
    async add(col, data) { const id = newId(); tbl(col)[id] = stamp(data, true); save(col); return id; },
    async set(col, id, data, merge = true) { tbl(col)[id] = stamp(merge ? { ...(tbl(col)[id] || {}), ...data } : data, !tbl(col)[id]); save(col); return id; },
    async update(col, id, data) { if (!tbl(col)[id]) throw Object.assign(new Error("Không tìm thấy bản ghi"), { code: "not-found" }); tbl(col)[id] = stamp({ ...tbl(col)[id], ...data }, false); save(col); },
    async remove(col, id) { delete tbl(col)[id]; save(col); },
    async bulkAdd(col, rows) { rows.forEach(r => { tbl(col)[newId()] = stamp(r, true); }); save(col); },
    async log(entry) { tbl("auditLogs")[newId()] = { ...entry, at: now(), by: current?.email || "", byName: current?.name || "" }; save("auditLogs"); }
  };
}

/* ------------------------------------------------------------ */
/*  Lớp bọc chung: tự ghi nhật ký thao tác                       */
/* ------------------------------------------------------------ */
const impl = LIVE ? liveBackend() : demoBackend();
const audit = (action, col, id, label) => { if (!NO_AUDIT.has(col)) impl.log({ action, col, docId: id || "", label: label || "" }).catch(e => console.warn("audit", e)); };
const labelOf = d => d?.code ? `${d.code}${d.name ? " · " + d.name : ""}` : (d?.name || d?.email || "");

export const backend = {
  mode: impl.mode,
  get user() { return current; },
  onUser(fn) { userListeners.add(fn); return () => userListeners.delete(fn); },
  init: () => impl.init(),
  signInGoogle: (...a) => impl.signInGoogle(...a),
  signInEmail: (...a) => impl.signInEmail(...a),
  register: (...a) => impl.register(...a),
  resetPassword: (...a) => impl.resetPassword(...a),
  signInDemo: (...a) => impl.signInDemo(...a),
  signOut: () => impl.signOut(),
  resetDemo: () => impl.resetDemo?.(),

  list: (col, opts) => impl.list(col, opts),
  watch: (col, cb, opts, onErr) => impl.watch(col, cb, opts, onErr),
  get: (col, id) => impl.get(col, id),
  async add(col, data) { const id = await impl.add(col, data); audit("create", col, id, labelOf(data)); return id; },
  async set(col, id, data, merge) { await impl.set(col, id, data, merge); audit("update", col, id, labelOf(data)); return id; },
  async update(col, id, data) { await impl.update(col, id, data); audit("update", col, id, labelOf(data)); },
  async remove(col, id, label = "") { await impl.remove(col, id); audit("delete", col, id, label); },
  async bulkAdd(col, rows) { await impl.bulkAdd(col, rows); audit("import", col, "", `${rows.length} dòng`); }
};
