import { useState, useMemo, useEffect, useRef } from "react";

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwt4sizpnUxQqAuPrbRL1cj5V2cEbPWuHoWVi-FHM8TfsAh2hg4YPZpLz-nrnysGq9J/exec';

const db = {
  async get(table, filters = {}) {
    try {
      const params = new URLSearchParams({ table, ...filters });
      const r = await fetch(`${SCRIPT_URL}?${params}`);
      const text = await r.text();
      const data = JSON.parse(text);
      return Array.isArray(data) ? data : [];
    } catch { return []; }
  },
  async upsert(table, data) {
    const rows = Array.isArray(data) ? data : [data];
    try {
      const params = new URLSearchParams({ action: 'upsert', table, rows: JSON.stringify(rows) });
      const r = await fetch(`${SCRIPT_URL}?${params}`);
      const text = await r.text();
      const result = JSON.parse(text);
      return Array.isArray(result) ? result : rows;
    } catch { return rows; }
  },
  async update(table, id, idField = 'id', data) {
    try {
      const params = new URLSearchParams({ action: 'update', table, id: String(id), idField, data: JSON.stringify(data) });
      const r = await fetch(`${SCRIPT_URL}?${params}`);
      const text = await r.text();
      return JSON.parse(text);
    } catch { return [data]; }
  },
  async delete(table, id, idField = 'id') {
    try {
      const params = new URLSearchParams({ action: 'delete', table, id: String(id), idField });
      await fetch(`${SCRIPT_URL}?${params}`);
    } catch {}
  },
};

// ── Constants ─────────────────────────────────────────────────────────────────
const INCOME = 6054;
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DEFAULT_ITEMS = [
  {id:1,category:"Rent",budgeted:1776,icon:"🏠",group_name:"housing",due_date:"1st",spent:0},
  {id:2,category:"Groceries",budgeted:750,icon:"🛒",group_name:"food",due_date:"–",spent:0},
  {id:3,category:"Daycare",budgeted:608,icon:"👶",group_name:"family",due_date:"Bi-Fr",spent:0},
  {id:4,category:"Subaru Loan",budgeted:439.98,icon:"🚗",group_name:"transport",due_date:"10th",spent:0},
  {id:5,category:"Credit Card 1325",budgeted:250,icon:"💳",group_name:"debt",due_date:"15th",spent:0},
  {id:6,category:"SRP Electric",budgeted:200,icon:"⚡",group_name:"housing",due_date:"–",spent:0},
  {id:7,category:"Gas",budgeted:200,icon:"⛽",group_name:"transport",due_date:"–",spent:0},
  {id:8,category:"Fun / Dining",budgeted:200,icon:"🍽️",group_name:"food",due_date:"–",spent:0},
  {id:9,category:"Geico Insurance",budgeted:161.59,icon:"🛡️",group_name:"transport",due_date:"7th",spent:0},
  {id:10,category:"Apple Card",budgeted:160,icon:"💳",group_name:"debt",due_date:"31st",spent:0},
  {id:11,category:"AT&T",budgeted:150,icon:"📱",group_name:"subs",due_date:"14th",spent:0},
  {id:12,category:"Water Bill",budgeted:102,icon:"💧",group_name:"housing",due_date:"31st",spent:0},
  {id:13,category:"Cox Internet",budgeted:85,icon:"📡",group_name:"subs",due_date:"30th",spent:0},
  {id:14,category:"Affirm Tires",budgeted:78,icon:"🔩",group_name:"debt",due_date:"4th",spent:0},
  {id:15,category:"Trash",budgeted:0,icon:"🗑️",group_name:"housing",due_date:"Qtly",spent:0},
  {id:16,category:"EOS Gym",budgeted:53,icon:"💪",group_name:"family",due_date:"10th",spent:0},
  {id:17,category:"Personal Care",budgeted:50,icon:"🧴",group_name:"family",due_date:"–",spent:0},
  {id:18,category:"Mission / Church",budgeted:50,icon:"⛪",group_name:"family",due_date:"5th",spent:0},
  {id:19,category:"College Debt",budgeted:50,icon:"🎓",group_name:"debt",due_date:"–",spent:0},
  {id:20,category:"Birthdays",budgeted:50,icon:"🎁",group_name:"family",due_date:"10th",spent:0},
  {id:21,category:"Credit Card 9728",budgeted:30.91,icon:"💳",group_name:"debt",due_date:"28th",spent:0},
  {id:22,category:"Coffee",budgeted:30,icon:"☕",group_name:"food",due_date:"–",spent:0},
  {id:23,category:"Spotify",budgeted:20.57,icon:"🎵",group_name:"subs",due_date:"16th",spent:0},
  {id:24,category:"Amazon",budgeted:16.23,icon:"📦",group_name:"subs",due_date:"6th",spent:0},
  {id:25,category:"Guitar Center",budgeted:120,icon:"🎸",group_name:"debt",due_date:"–",spent:0},
  {id:26,category:"Other",budgeted:15,icon:"•••",group_name:"family",due_date:"–",spent:0},
  {id:27,category:"Savings",budgeted:165,icon:"🏦",group_name:"family",due_date:"1st",spent:0},
];
const DEFAULT_DEBTS = [
  {id:"d1",name:"Care Credit (Sync)",total:2533.51,paid:0,collections:true,apr:29.99},
  {id:"d2",name:"Emergency - Jono 1",total:338.22,paid:0,collections:true,apr:0},
  {id:"d3",name:"Serenity Health",total:911.47,paid:0,collections:true,apr:0},
  {id:"d4",name:"Malia DH Emergency",total:1053,paid:0,collections:true,apr:0},
  {id:"d5",name:"CareCredit (Yulissa)",total:5329,paid:0,collections:true,apr:26.99},
  {id:"d6",name:"Sonora Quest (Yulissa)",total:751,paid:0,collections:true,apr:0},
  {id:"d7",name:"Marcus Loan",total:5600,paid:0,collections:true,apr:0},
  {id:"d8",name:"Affirm - Discount Tire",total:700,paid:390,collections:true,apr:0},
  {id:"d9",name:"Credit Card 1325",total:13645,paid:0,collections:false,apr:24.99},
  {id:"d10",name:"College Debt",total:2510,paid:111.34,collections:false,apr:5.5},
  {id:"d11",name:"Apple Credit Card",total:955.80,paid:0,collections:false,apr:19.99},
  {id:"d12",name:"Credit Card 9728",total:990,paid:0,collections:false,apr:22.99},
  {id:"d13",name:"Verizon",total:764.16,paid:0,collections:false,apr:0},
  {id:"d14",name:"Money Lion - Jono",total:534,paid:0,collections:false,apr:0},
  {id:"d15",name:"Money Lion - Yulissa",total:400,paid:0,collections:false,apr:0},
  {id:"d16",name:"Korayme",total:344,paid:344,collections:false,apr:0},
];
const DEFAULT_SAVINGS = [
  {id:"s1",name:"Emergency Fund",icon:"🛡️",target:1000,saved:0,monthly_goal:50,due_date:"",color:"#22c55e",fund_type:"emergency",notes:"Starter fund — 1st priority"},
  {id:"s2",name:"Christmas Gifts",icon:"🎁",target:600,saved:0,monthly_goal:50,due_date:"2025-12-01",color:"#f59e0b",fund_type:"sinking",notes:"Dec gifts"},
  {id:"s3",name:"Car Registration",icon:"🚗",target:300,saved:0,monthly_goal:25,due_date:"",color:"#60a5fa",fund_type:"sinking",notes:"Annual registration"},
  {id:"s4",name:"Medical Copays",icon:"💊",target:500,saved:0,monthly_goal:40,due_date:"",color:"#f472b6",fund_type:"sinking",notes:"Unexpected medical buffer"},
];
const EMOJI_OPTIONS=["🏠","🛒","👶","🚗","💳","⚡","⛽","🍽️","🛡️","📱","💧","📡","🔩","🗑️","💪","🧴","⛪","🎓","🎁","☕","🎵","📦","🎸","💊","✈️","🐾","🎮","🏫","👔","🛍️","•••"];
const GROUPS=["housing","food","transport","debt","subs","family","other"];
const FUND_COLORS=["#22c55e","#f59e0b","#ef4444","#60a5fa","#8b5cf6","#f472b6","#14b8a6","#fb923c"];
const FUND_ICONS=["🏦","🛡️","🎁","🚗","💊","✈️","🏠","🎓","🐾","💒","🏖️","🔧","💻","👶","🌱"];
const FUND_TYPES=["emergency","sinking","investment","other"];
const USERS = [{ name: "Jono", pin: "1728" }, { name: "Yulissa", pin: "5130" }];

const fmt = n => "$" + Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtK = n => { const a = Math.abs(n); return a >= 1000 ? "$" + (a / 1000).toFixed(1) + "k" : fmt(n); };
const today = new Date();
const CUR = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
const monthLabel = k => { const [y, m] = k.split("-"); return `${MONTHS[parseInt(m) - 1]} ${y}`; };
const todayISO = () => today.toISOString().split("T")[0];

// ── CSV helpers ───────────────────────────────────────────────────────────────
function parseCSVRow(line) {
  const result = [];
  let current = "", inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') inQuotes = !inQuotes;
    else if (line[i] === "," && !inQuotes) { result.push(current.trim()); current = ""; }
    else current += line[i];
  }
  result.push(current.trim());
  return result;
}

function parseCSVText(text, items) {
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = parseCSVRow(lines[0]).map(h => h.toLowerCase().replace(/[^a-z]/g, ""));
  const col = aliases => { for (const a of aliases) { const i = headers.findIndex(h => h === a || h.includes(a)); if (i >= 0) return i; } return -1; };
  const dateIdx = col(["date","transactiondate","txndate","posteddate"]);
  const catIdx  = col(["category","description","merchant","name","payee","memo"]);
  const amtIdx  = col(["amount","amt","cost","debit","charge","price"]);
  const noteIdx = col(["note","notes","memo","details","reference"]);
  const rows = [];
  lines.slice(1).forEach((line, i) => {
    if (!line.trim()) return;
    const vals = parseCSVRow(line);
    const rawAmt = amtIdx >= 0 ? (vals[amtIdx] || "") : "";
    const amount = Math.abs(parseFloat(rawAmt.replace(/[$,\s()]/g, "")));
    if (isNaN(amount) || amount <= 0) return;
    const rawCat  = catIdx  >= 0 ? (vals[catIdx]  || "") : "";
    const rawDate = dateIdx >= 0 ? (vals[dateIdx] || "") : "";
    const rawNote = noteIdx >= 0 ? (vals[noteIdx] || "") : "";
    let date = todayISO();
    if (rawDate) { const d = new Date(rawDate); if (!isNaN(d.getTime())) date = d.toISOString().split("T")[0]; }
    rows.push({ rawDate, rawCategory: rawCat, rawAmount: rawAmt, rawNote, date, amount, matchedItem: fuzzyMatchCategory(rawCat, items), rowIndex: i });
  });
  return rows;
}

function fuzzyMatchCategory(name, items) {
  if (!name || !items.length) return null;
  const n = name.toLowerCase().trim();
  return (
    items.find(b => b.category.toLowerCase() === n) ||
    items.find(b => b.category.toLowerCase().startsWith(n.substring(0, 4))) ||
    items.find(b => n.includes(b.category.toLowerCase().split(" ")[0]) && b.category.split(" ")[0].length > 3) ||
    null
  );
}

function downloadCSV(content, filename) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

function generateCSVTemplate() {
  return ["date,category,amount,note",
    `${todayISO()},Groceries,45.23,Fry's grocery run`,
    `${todayISO()},Gas,52.00,Shell on Main St`,
    `${todayISO()},Coffee,6.75,Dutch Bros`,
    `${todayISO()},Fun / Dining,38.50,Pizza night`,
  ].join("\n");
}

// ── Sub-components (defined OUTSIDE App so React sees stable references) ──────
function Bar({ pct, color = "#22c55e", h = 5 }) {
  const c = pct > 100 ? "#ef4444" : pct > 85 ? "#f59e0b" : color;
  return <div style={{ background: "rgba(128,128,128,.12)", borderRadius: 99, height: h, overflow: "hidden" }}><div style={{ width: `${Math.min(pct, 100)}%`, height: "100%", background: c, borderRadius: 99, transition: "width .6s" }} /></div>;
}

function Ring({ pct, size = 120, stroke = 11, color = "#22c55e", children }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, d = Math.min(pct / 100, 1) * c;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(128,128,128,.12)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={`${d} ${c-d}`} strokeLinecap="round" style={{ transition: "stroke-dasharray .8s" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>{children}</div>
    </div>
  );
}

function ModalWrap({ onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "flex-end", zIndex: 200 }} onClick={onClose}>
      <div style={{ width: "100%", background: "var(--color-background-primary)", borderRadius: "20px 20px 0 0", padding: "24px 20px 40px", maxHeight: "85dvh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>{children}</div>
    </div>
  );
}

const TAB_ICONS = {
  home: a => <svg width="22" height="22" viewBox="0 0 24 24" fill={a?"currentColor":"none"} stroke="currentColor" strokeWidth={a?0:2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 12L12 3l9 9"/><path d="M9 21V12h6v9"/><path d="M3 12v9h18V12"/></svg>,
  budget: a => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a?2.4:2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="9" x2="9" y2="20"/></svg>,
  debts: a => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a?2.4:2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 3"/></svg>,
  save: a => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a?2.4:2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
};
const TABS = [{k:"home",label:"Home"},{k:"budget",label:"Budget"},{k:"log",label:"Log"},{k:"debts",label:"Debts"},{k:"save",label:"Save"}];
const TAB_TITLES = {home:"Overview",budget:"Monthly Budget",log:"Log Expense",debts:"Debt Tracker",save:"Savings Goals"};

// ── PIN Screen ────────────────────────────────────────────────────────────────
function PinScreen({ onLogin }) {
  const [digits, setDigits] = useState([]);
  const [error, setError] = useState("");

  function press(k) {
    if (digits.length >= 4) return;
    const next = [...digits, String(k)];
    setDigits(next); setError("");
    if (next.length === 4) setTimeout(() => evaluate(next), 150);
  }
  function del_() { setDigits(d => d.slice(0,-1)); setError(""); }
  function evaluate(d) {
    const code = d.join("");
    const user = USERS.find(u => u.pin === code);
    if (user) { setDigits([]); onLogin(user.name); }
    else { setError("Incorrect PIN. Try again."); setDigits([]); }
  }

  return (
    <div style={{ position:"fixed",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,background:"var(--color-background-primary)",zIndex:500 }}>
      <div style={{ marginBottom:20 }}>
        <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
          <rect width="56" height="56" rx="16" fill="var(--color-background-secondary)"/>
          <line x1="18" y1="22" x2="38" y2="22" stroke="var(--color-text-primary)" strokeWidth="2" strokeLinecap="round"/>
          <line x1="18" y1="28" x2="32" y2="28" stroke="var(--color-text-secondary)" strokeWidth="2" strokeLinecap="round"/>
          <line x1="18" y1="34" x2="28" y2="34" stroke="var(--color-text-tertiary)" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>
      <div style={{ fontSize:22,fontWeight:600,marginBottom:4 }}>Brandon Family Budget</div>
      <div style={{ fontSize:14,color:"var(--color-text-secondary)",marginBottom:32 }}>Enter your PIN</div>
      <div style={{ display:"flex",gap:16,marginBottom:error?12:36 }}>
        {[0,1,2,3].map(i => <div key={i} style={{ width:16,height:16,borderRadius:"50%",border:`2px solid ${digits.length>i?"#22c55e":"var(--color-border-primary)"}`,background:digits.length>i?"#22c55e":"transparent",transition:"all .15s" }}/>)}
      </div>
      {error && <div style={{ fontSize:12,color:"#ef4444",marginBottom:20,textAlign:"center" }}>{error}</div>}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(3,72px)",gap:12 }}>
        {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((k,i) => (
          <button key={i} onClick={() => k==="⌫"?del_():k!==""?press(k):null}
            style={{ height:72,borderRadius:14,border:k===""?"none":"0.5px solid var(--color-border-secondary)",background:k===""?"transparent":"var(--color-background-primary)",fontSize:k==="⌫"?22:24,fontWeight:500,cursor:k===""?"default":"pointer",opacity:k===""?0:1,width:72,fontFamily:"inherit",color:"var(--color-text-primary)" }}>
            {k}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser]           = useState(null);
  const [tab, setTab]             = useState("home");
  const [viewMonth, setViewMonth] = useState(CUR);
  const [filterGroup, setFilterGroup] = useState("all");
  const [toast, setToast]         = useState(null);
  const [loading, setLoading]     = useState(true);
  const [syncing, setSyncing]     = useState(false);

  // Core data
  const [items, setItems]         = useState([]);
  const [debts, setDebts]         = useState([]);
  const [savings, setSavings]     = useState([]);
  const [savingsLog, setSavingsLog] = useState([]);
  const [expenseLog, setExpenseLog] = useState([]);
  const [allMonths, setAllMonths] = useState([CUR]);
  const income = INCOME;

  // Edit buffers
  const [editMode, setEditMode]           = useState(false);
  const [editBufs, setEditBufs]           = useState({});
  const [editDebtMode, setEditDebtMode]   = useState(false);
  const [editDebtBufs, setEditDebtBufs]   = useState({});
  const [editSavingsMode, setEditSavingsMode] = useState(false);
  const [editSavingsBufs, setEditSavingsBufs] = useState({});

  // Log form
  const [logCat, setLogCat]   = useState("");
  const [logAmt, setLogAmt]   = useState("");
  const [logNote, setLogNote] = useState("");
  const [logDate, setLogDate] = useState(todayISO());
  const [debtId, setDebtId]   = useState("");
  const [debtAmt, setDebtAmt] = useState("");
  const [logFundId, setLogFundId]       = useState("");
  const [logSavingsAmt, setLogSavingsAmt] = useState("");
  const [logSavingsNote, setLogSavingsNote] = useState("");

  // Modals
  const [addingMonth, setAddingMonth] = useState(false);
  const [newMonthKey, setNewMonthKey] = useState("");
  const [addingCat, setAddingCat]     = useState(false);
  const [newCat, setNewCat]           = useState({category:"",budgeted:"",icon:"•••",group_name:"other",due_date:"–"});
  const [addingFund, setAddingFund]   = useState(false);
  const [newFund, setNewFund]         = useState({name:"",icon:"🏦",target:"",saved:"",monthly_goal:"",due_date:"",color:"#22c55e",fund_type:"sinking",notes:""});

  // AI / calculators
  const [showAI, setShowAI]       = useState(false);
  const [showSvD, setShowSvD]     = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState("");
  const [aiQuestion, setAiQuestion] = useState("");
  const aiRef = useRef(null);

  // Import / export
  const [showImportModal, setShowImportModal] = useState(false);
  const [importRows, setImportRows]     = useState([]);
  const [importStep, setImportStep]     = useState("upload"); // upload | preview | done
  const [importMonth, setImportMonth]   = useState(CUR);
  const [importLoading, setImportLoading] = useState(false);
  const [importDoneCount, setImportDoneCount] = useState(0);
  const [importDoneTotal, setImportDoneTotal] = useState(0);

  // Expense log UI
  const [selectMode, setSelectMode]       = useState(false);
  const [selectedLogIds, setSelectedLogIds] = useState(new Set());
  const [expenseFilter, setExpenseFilter] = useState("all");

  const fileInputRef = useRef(null);
  const dropRef      = useRef(null);

  const showToast = (msg, type = "ok") => { setToast({msg, type}); setTimeout(() => setToast(null), 2800); };

  // ── Data loading ─────────────────────────────────────────────────────────────
  // NOTE: only one useEffect for loading — no deps-free version to avoid infinite loops
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    loadAll();
  }, [user, viewMonth]); // eslint-disable-line react-hooks/exhaustive-deps

  // Polling every 10s
  useEffect(() => {
    if (!user) return;
    const id = setInterval(() => {
      db.get("budget_items", {month_key: viewMonth}).then(r => { if (r?.length) setItems(r); });
      db.get("debts").then(r => { if (r?.length) setDebts(r); });
      db.get("savings_funds").then(r => { if (r?.length) setSavings(r); });
      db.get("expense_log", {month_key: viewMonth}).then(r => { if (r?.length) setExpenseLog(r); else setExpenseLog([]); }).catch(() => {});
    }, 10000);
    return () => clearInterval(id);
  }, [user, viewMonth]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (aiRef.current) aiRef.current.scrollTop = aiRef.current.scrollHeight; }, [aiResponse]);

  async function loadAll() {
    // db.get always returns [] on any error, so no try/catch needed per-call
    const [dbItems, dbDebts, dbSavings, dbLog] = await Promise.all([
      db.get("budget_items", {month_key: viewMonth}),
      db.get("debts"),
      db.get("savings_funds"),
      db.get("savings_log"),
    ]);

    if (dbItems.length) setItems(dbItems); else await seedItems();
    if (dbDebts.length) setDebts(dbDebts); else await seedDebts();
    if (dbSavings.length) setSavings(dbSavings); else await seedSavings();
    if (dbLog.length) setSavingsLog(dbLog);

    // Load all months for the month picker
    const allM = await db.get("budget_items"); // safe: always returns []
    const months = [...new Set(allM.map(x => x.month_key))].filter(Boolean).sort().reverse();
    if (months.length) setAllMonths(months);

    // Expense log separate — failure here never blocks the app
    const dbExpLog = await db.get("expense_log", {month_key: viewMonth});
    setExpenseLog(dbExpLog);

    setLoading(false);
  }

  async function seedItems() {
    const rows = DEFAULT_ITEMS.map(b => ({...b, month_key: CUR}));
    const res = await db.upsert("budget_items", rows);
    if (res.length) setItems(res);
  }
  async function seedDebts() {
    const res = await db.upsert("debts", DEFAULT_DEBTS);
    if (res.length) setDebts(res);
  }
  async function seedSavings() {
    const res = await db.upsert("savings_funds", DEFAULT_SAVINGS);
    if (res.length) setSavings(res);
  }

  // ── Computed ─────────────────────────────────────────────────────────────────
  const curItems       = items.filter(b => b.month_key === viewMonth);
  const totalSpent     = useMemo(() => curItems.reduce((s,b) => s+Number(b.spent), 0), [curItems]);
  const totalBudgeted  = useMemo(() => curItems.reduce((s,b) => s+Number(b.budgeted), 0), [curItems]);
  const remaining      = income - totalSpent;
  const totalDebt      = useMemo(() => debts.reduce((s,d) => s+Number(d.total), 0), [debts]);
  const totalPaid      = useMemo(() => debts.reduce((s,d) => s+Number(d.paid), 0), [debts]);
  const collectionsAmt = useMemo(() => debts.filter(d=>d.collections).reduce((s,d) => s+(Number(d.total)-Number(d.paid)), 0), [debts]);
  const totalSaved     = savings.reduce((s,f) => s+Number(f.saved), 0);
  const totalTarget    = savings.reduce((s,f) => s+Number(f.target), 0);
  const overBudget     = curItems.filter(b => Number(b.spent)>Number(b.budgeted) && Number(b.budgeted)>0);
  const pendingBills   = curItems.filter(b => Number(b.spent)===0 && Number(b.budgeted)>0);
  const filtered       = filterGroup==="all" ? curItems : curItems.filter(b => b.group_name===filterGroup);
  const prevCat        = curItems.find(b => b.id===+logCat);
  const projSpend      = prevCat ? Number(prevCat.spent)+(+logAmt||0) : 0;
  const willOver       = prevCat && projSpend>Number(prevCat.budgeted) && Number(prevCat.budgeted)>0;
  const highAPR        = [...debts].filter(d=>d.apr>0&&d.paid<d.total).sort((a,b)=>b.apr-a.apr)[0];
  const isCur          = viewMonth === CUR;
  const spentPct       = (totalSpent / income) * 100;
  const ringColor      = spentPct>90?"#ef4444":spentPct>75?"#f59e0b":"#22c55e";
  const monthlyCommitted = savings.reduce((s,f) => s+Number(f.monthly_goal), 0);

  // Expense log computed
  const logForMonth   = expenseLog.filter(e => e.month_key === viewMonth);
  const filteredLog   = expenseFilter==="all" ? logForMonth : logForMonth.filter(e => e.category===expenseFilter);
  const logCategories = [...new Set(logForMonth.map(e => e.category))].sort();
  const logTotal      = filteredLog.reduce((s,e) => s+Number(e.amount), 0);
  const logByDate     = filteredLog.reduce((acc, e) => { const k=e.date||"unknown"; if(!acc[k])acc[k]=[]; acc[k].push(e); return acc; }, {});
  const logDates      = Object.keys(logByDate).sort().reverse();

  // ── Actions ───────────────────────────────────────────────────────────────────
  async function logExpense() {
    if (!logCat||!logAmt||isNaN(+logAmt)||+logAmt<=0) return showToast("Fill in category & amount","err");
    const item = curItems.find(b => b.id===+logCat); if (!item) return;
    const newSpent = +(Number(item.spent)+(+logAmt)).toFixed(2);
    const entry = { id:"el"+Date.now()+Math.random().toString(36).slice(2,7), month_key:viewMonth, budget_item_id:item.id, category:item.category, amount:+(+logAmt).toFixed(2), note:logNote, date:logDate||todayISO(), logged_by:user };
    setSyncing(true);
    await db.update("budget_items", item.id, "id", {spent: newSpent});
    try { await db.upsert("expense_log", [entry]); } catch {}
    setItems(prev => prev.map(b => b.id===item.id ? {...b,spent:newSpent} : b));
    setExpenseLog(prev => [entry, ...prev]);
    setSyncing(false);
    showToast(`${fmt(+logAmt)} → ${item.category}`);
    setLogCat(""); setLogAmt(""); setLogNote(""); setLogDate(todayISO());
  }

  async function payDebt() {
    if (!debtId||!debtAmt||isNaN(+debtAmt)||+debtAmt<=0) return showToast("Fill debt & amount","err");
    const debt = debts.find(d => d.id===debtId); if (!debt) return;
    const newPaid = Math.min(+(Number(debt.paid)+(+debtAmt)).toFixed(2), Number(debt.total));
    setSyncing(true);
    await db.update("debts", debtId, "id", {paid: newPaid});
    setDebts(prev => prev.map(d => d.id===debtId ? {...d,paid:newPaid} : d));
    setSyncing(false);
    showToast(`Payment logged for ${debt.name}`);
    setDebtId(""); setDebtAmt("");
  }

  async function logSavingsTransfer() {
    if (!logFundId||!logSavingsAmt||isNaN(+logSavingsAmt)||+logSavingsAmt<=0) return showToast("Pick a fund and enter amount","err");
    const fund = savings.find(f => f.id===logFundId); if (!fund) return;
    const newSaved = +(Number(fund.saved)+(+logSavingsAmt)).toFixed(2);
    const savItem  = curItems.find(b => b.category==="Savings");
    setSyncing(true);
    await db.update("savings_funds", logFundId, "id", {saved: newSaved});
    if (savItem) await db.update("budget_items", savItem.id, "id", {spent: +(Number(savItem.spent)+(+logSavingsAmt)).toFixed(2)});
    const entry = {id:"sl"+Date.now(), fund_id:logFundId, fund_name:fund.name, amount:+logSavingsAmt, note:logSavingsNote, logged_by:user};
    await db.upsert("savings_log", [entry]);
    setSavings(prev => prev.map(f => f.id===logFundId ? {...f,saved:newSaved} : f));
    if (savItem) setItems(prev => prev.map(b => b.id===savItem.id ? {...b,spent:+(Number(b.spent)+(+logSavingsAmt)).toFixed(2)} : b));
    setSavingsLog(prev => [entry,...prev]);
    setSyncing(false);
    showToast(`${fmt(+logSavingsAmt)} added to ${fund.name}`);
    setLogFundId(""); setLogSavingsAmt(""); setLogSavingsNote("");
  }

  async function saveEditBudget() {
    const updates = curItems.map(b => ({...b, budgeted:+(parseFloat(editBufs[b.id]?.budgeted)||0).toFixed(2), category:editBufs[b.id]?.category||b.category, icon:editBufs[b.id]?.icon||b.icon, group_name:editBufs[b.id]?.group_name||b.group_name, due_date:editBufs[b.id]?.due_date||b.due_date||"–"}));
    setSyncing(true);
    await db.upsert("budget_items", updates);
    setItems(prev => prev.map(b => { const u=updates.find(x=>x.id===b.id); return u||b; }));
    setSyncing(false); setEditMode(false); showToast("Budget saved");
  }

  async function addCategory() {
    if (!newCat.category||!newCat.budgeted) return showToast("Name and amount required","err");
    const item = {...newCat, id:Date.now(), budgeted:+(parseFloat(newCat.budgeted)||0).toFixed(2), spent:0, month_key:CUR};
    setSyncing(true);
    await db.upsert("budget_items", [item]);
    setItems(prev => [...prev, item]);
    setSyncing(false); setAddingCat(false);
    setNewCat({category:"",budgeted:"",icon:"•••",group_name:"other",due_date:"–"});
    showToast(`${item.category} added`);
  }

  async function removeBudgetItem(id, name) {
    if (!confirm(`Remove "${name}"?`)) return;
    setSyncing(true);
    await db.delete("budget_items", id, "id");
    setItems(prev => prev.filter(b => b.id!==id));
    setSyncing(false); showToast(`${name} removed`);
  }

  async function saveEditDebts() {
    const updates = debts.map(d => { const e=editDebtBufs[d.id]; if(!e)return d; return {...d,name:e.name,total:+(parseFloat(e.total)||0).toFixed(2),paid:+(parseFloat(e.paid)||0).toFixed(2),collections:e.collections,apr:+(parseFloat(e.apr)||0).toFixed(2)}; });
    setSyncing(true);
    await db.upsert("debts", updates);
    setDebts(updates); setSyncing(false); setEditDebtMode(false); showToast("Debts updated");
  }

  async function addDebt() {
    const nd = {id:"d"+Date.now(),name:"New Debt",total:0,paid:0,collections:false,apr:0};
    setSyncing(true); await db.upsert("debts",[nd]); setDebts(prev=>[...prev,nd]); setSyncing(false);
    const m={}; [...debts,nd].forEach(d=>{m[d.id]={total:String(d.total),paid:String(d.paid),name:d.name,collections:d.collections,apr:String(d.apr||0)};});
    setEditDebtBufs(m); setEditDebtMode(true);
  }

  async function removeDebt(id, name) {
    if (!confirm(`Remove "${name}"?`)) return;
    setSyncing(true); await db.delete("debts",id,"id"); setDebts(prev=>prev.filter(d=>d.id!==id)); setSyncing(false); showToast(`${name} removed`);
  }

  async function saveEditSavings() {
    const updates = savings.map(f => { const e=editSavingsBufs[f.id]; if(!e)return f; return {...f,name:e.name,icon:e.icon,target:+(parseFloat(e.target)||0).toFixed(2),saved:+(parseFloat(e.saved)||0).toFixed(2),monthly_goal:+(parseFloat(e.monthly_goal)||0).toFixed(2),due_date:e.due_date,color:e.color,fund_type:e.fund_type,notes:e.notes}; });
    setSyncing(true); await db.upsert("savings_funds",updates); setSavings(updates); setSyncing(false); setEditSavingsMode(false); showToast("Savings updated");
  }

  async function addFund() {
    if (!newFund.name||!newFund.target) return showToast("Name and target required","err");
    const f = {...newFund, id:"s"+Date.now(), target:+(parseFloat(newFund.target)||0).toFixed(2), saved:+(parseFloat(newFund.saved)||0).toFixed(2), monthly_goal:+(parseFloat(newFund.monthly_goal)||0).toFixed(2)};
    setSyncing(true); await db.upsert("savings_funds",[f]); setSavings(prev=>[...prev,f]); setSyncing(false); setAddingFund(false); showToast(`${f.name} added`);
  }

  async function removeFund(id) {
    setSyncing(true); await db.delete("savings_funds",id,"id"); setSavings(prev=>prev.filter(f=>f.id!==id)); setSyncing(false); showToast("Fund removed");
  }

  async function addPastMonth() {
    if (!newMonthKey||allMonths.includes(newMonthKey)) return showToast("Month already exists","err");
    const rows = DEFAULT_ITEMS.map(b=>({...b,month_key:newMonthKey,spent:0}));
    setSyncing(true); await db.upsert("budget_items",rows);
    setAllMonths(prev=>[...prev,newMonthKey].sort().reverse());
    setSyncing(false); setViewMonth(newMonthKey); setAddingMonth(false);
    showToast(`${monthLabel(newMonthKey)} added`);
  }

  async function askAI(q2) {
    const q = q2||aiQuestion; if(!q.trim())return;
    setAiLoading(true); setAiResponse(""); setShowAI(true); setAiQuestion("");
    const ds = debts.map(d=>`- ${d.name}: $${(Number(d.total)-Number(d.paid)).toFixed(2)}${d.apr>0?`, ${d.apr}% APR`:""}${d.collections?" (collections)":""}`).join("\n");
    const sys = `You are a certified financial advisor for the Brandon family. Use Debt Avalanche, Snowball, and collection negotiation strategies. Be specific and empathetic, under 300 words. Reference CFPB, NerdWallet, Experian, Dave Ramsey.\n\nDebts:\n${ds}\nIncome: $${income}/mo\nSurplus: $${Math.max(income-totalSpent,0).toFixed(2)}/mo`;
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:sys,messages:[{role:"user",content:q}]})});
      const data = await r.json();
      setAiResponse(data.content?.map(c=>c.text||"").join("")||"Could not generate a response.");
    } catch(e) { setAiResponse("Network error: "+e.message); }
    setAiLoading(false);
  }

  // ── Expense log actions ───────────────────────────────────────────────────────
  async function deleteExpenseEntry(entry) {
    if (!confirm(`Delete ${fmt(entry.amount)} from ${entry.category}?`)) return;
    const item = items.find(b => b.id===entry.budget_item_id && b.month_key===entry.month_key);
    setSyncing(true);
    if (item) {
      const newSpent = Math.max(+(Number(item.spent)-Number(entry.amount)).toFixed(2),0);
      await db.update("budget_items", item.id, "id", {spent:newSpent});
      setItems(prev => prev.map(b => b.id===item.id ? {...b,spent:newSpent} : b));
    }
    try { await db.delete("expense_log", entry.id, "id"); } catch {}
    setExpenseLog(prev => prev.filter(e => e.id!==entry.id));
    setSyncing(false); showToast("Expense deleted");
  }

  async function massDeleteExpenses() {
    if (!selectedLogIds.size) return;
    if (!confirm(`Delete ${selectedLogIds.size} expense entries? This subtracts their amounts from category totals.`)) return;
    const toDelete = expenseLog.filter(e => selectedLogIds.has(e.id));
    const delta = {};
    toDelete.forEach(e => { const k=`${e.budget_item_id}|${e.month_key}`; delta[k]=(delta[k]||0)+Number(e.amount); });
    setSyncing(true);
    await Promise.all(Object.entries(delta).map(([key, amt]) => {
      const [id, mk] = key.split("|");
      const item = items.find(b => b.id===+id && b.month_key===mk);
      if (!item) return Promise.resolve();
      const newSpent = Math.max(+(Number(item.spent)-amt).toFixed(2),0);
      return db.update("budget_items",+id,"id",{spent:newSpent}).then(()=>setItems(prev=>prev.map(b=>b.id===+id?{...b,spent:newSpent}:b)));
    }));
    await Promise.all([...selectedLogIds].map(id => db.delete("expense_log",id,"id").catch(()=>{})));
    setExpenseLog(prev => prev.filter(e => !selectedLogIds.has(e.id)));
    setSelectedLogIds(new Set()); setSelectMode(false);
    setSyncing(false); showToast(`${toDelete.length} expenses deleted`);
  }

  function exportExpensesToCSV() {
    const rows = expenseLog.filter(e => e.month_key===viewMonth);
    if (!rows.length) return showToast("No expense log entries for this month","err");
    const sorted = [...rows].sort((a,b)=>(a.date||"").localeCompare(b.date||""));
    const csv = ["date,category,amount,note,logged_by", ...sorted.map(e=>[e.date||"",`"${(e.category||"").replace(/"/g,"'")}"`,e.amount||0,`"${(e.note||"").replace(/"/g,"'")}"`,e.logged_by||""].join(","))].join("\n");
    downloadCSV(csv, `expenses-${viewMonth}.csv`);
    showToast(`Exported ${sorted.length} entries`);
  }

  function openImportModal() {
    setImportRows([]); setImportStep("upload"); setImportMonth(viewMonth); setShowImportModal(true);
  }

  function handleFileRead(file) {
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target.result;
      const monthItems = items.filter(b => b.month_key===importMonth);
      const parsed = parseCSVText(text, monthItems);
      if (!parsed.length) { showToast("No valid rows found — check format","err"); return; }
      setImportRows(parsed); setImportStep("preview");
    };
    reader.readAsText(file);
  }

  function updateImportRowCategory(rowIndex, itemId) {
    const monthItems = items.filter(b => b.month_key===importMonth);
    const item = monthItems.find(b => String(b.id)===itemId) || null;
    setImportRows(prev => prev.map(r => r.rowIndex===rowIndex ? {...r,matchedItem:item} : r));
  }

  async function confirmImport() {
    const validRows = importRows.filter(r => r.matchedItem);
    if (!validRows.length) return showToast("No rows with matched categories","err");
    setImportLoading(true);
    const entries = validRows.map(r => ({
      id:"el"+Date.now()+Math.random().toString(36).slice(2,8),
      month_key:importMonth, budget_item_id:r.matchedItem.id,
      category:r.matchedItem.category, amount:+r.amount.toFixed(2),
      note:r.rawNote||r.rawCategory||"", date:r.date, logged_by:user,
    }));
    const spentDelta = {};
    entries.forEach(e => { spentDelta[e.budget_item_id]=(spentDelta[e.budget_item_id]||0)+e.amount; });
    await Promise.all(Object.entries(spentDelta).map(([id, delta]) => {
      const item = items.find(b => b.id===+id && b.month_key===importMonth);
      if (!item) return Promise.resolve();
      const newSpent = +(Number(item.spent)+delta).toFixed(2);
      return db.update("budget_items",+id,"id",{spent:newSpent}).then(()=>setItems(prev=>prev.map(b=>b.id===+id?{...b,spent:newSpent}:b)));
    }));
    try { await db.upsert("expense_log",entries); setExpenseLog(prev=>[...entries,...prev]); }
    catch { showToast("expense_log table not found — check Supabase setup","err"); }
    setImportDoneCount(validRows.length);
    setImportDoneTotal(validRows.reduce((s,r)=>s+r.amount,0));
    setImportLoading(false); setImportStep("done");
    showToast(`${validRows.length} expenses imported!`);
  }

  function toggleSelectLog(id) {
    setSelectedLogIds(prev => { const n=new Set(prev); n.has(id)?n.delete(id):n.add(id); return n; });
  }
  function toggleSelectAll() {
    setSelectedLogIds(selectedLogIds.size===filteredLog.length ? new Set() : new Set(filteredLog.map(e=>e.id)));
  }

  // ── Style helpers ─────────────────────────────────────────────────────────────
  const S = {
    card:     { background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:"var(--border-radius-lg)",padding:"14px 16px",marginBottom:10 },
    label:    { fontSize:11,fontWeight:500,letterSpacing:.8,textTransform:"uppercase",color:"var(--color-text-tertiary)",marginBottom:4,display:"block" },
    sm:       { fontSize:12,color:"var(--color-text-secondary)" },
    row:      { display:"flex",alignItems:"center",justifyContent:"space-between",gap:8 },
    chip:     c => ({ fontSize:10,fontWeight:500,padding:"2px 8px",borderRadius:99,background:c+"22",color:c,flexShrink:0 }),
    sect:     { fontSize:11,fontWeight:500,letterSpacing:1,textTransform:"uppercase",color:"var(--color-text-tertiary)",padding:"12px 0 6px" },
    inp:      { width:"100%",marginBottom:10 },
    tabBtn:   a => ({ flex:1,padding:"10px 4px 12px",background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:4,color:a?"var(--color-text-primary)":"var(--color-text-tertiary)",fontFamily:"inherit",fontSize:9,fontWeight:a?500:400,letterSpacing:.5,textTransform:"uppercase",borderTop:a?"2px solid var(--color-text-primary)":"2px solid transparent",transition:"all .15s" }),
    fieldRow: { display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8 },
    ii:       { fontSize:12,padding:"3px 7px",borderRadius:6,border:"0.5px solid var(--color-border-secondary)",background:"var(--color-background-secondary)",color:"var(--color-text-primary)",fontFamily:"inherit",width:"100%" },
  };

  // ── Guards ────────────────────────────────────────────────────────────────────
  if (!user)    return <PinScreen onLogin={n => { setUser(n); showToast(`Welcome, ${n}!`); }} />;
  if (loading)  return <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100vh",gap:12}}><div style={{fontSize:36}}>💰</div><div style={{fontSize:16,fontWeight:500}}>Loading your finances…</div><div style={{fontSize:12,color:"var(--color-text-tertiary)"}}>Connecting to database</div></div>;

  // ── Import modal (called as a function, NOT as <ImportModal /> ────────────────
  // Defining here so it can close over all state, but called as ImportModal() not <ImportModal />
  function ImportModal() {
    const monthItems = items.filter(b => b.month_key===importMonth);
    const matched  = importRows.filter(r => r.matchedItem).length;
    const unmatched= importRows.length - matched;
    const totalAmt = importRows.filter(r => r.matchedItem).reduce((s,r)=>s+r.amount,0);

    return (
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",display:"flex",alignItems:"flex-end",zIndex:300}} onClick={()=>setShowImportModal(false)}>
        <div style={{width:"100%",background:"var(--color-background-primary)",borderRadius:"20px 20px 0 0",padding:"0 0 40px",maxHeight:"92dvh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>

          {/* Header */}
          <div style={{padding:"20px 20px 0",position:"sticky",top:0,background:"var(--color-background-primary)",zIndex:10,borderBottom:importStep!=="upload"?"0.5px solid var(--color-border-tertiary)":"none",paddingBottom:importStep!=="upload"?14:0}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                {importStep!=="upload"&&importStep!=="done"&&<button onClick={()=>setImportStep("upload")} style={{background:"none",border:"none",cursor:"pointer",color:"var(--color-text-tertiary)",fontSize:20,lineHeight:1,padding:0,width:"auto"}}>←</button>}
                <div>
                  <div style={{fontSize:16,fontWeight:600}}>
                    {importStep==="upload"&&"📥 Import Expenses"}
                    {importStep==="preview"&&`Preview — ${importRows.length} rows`}
                    {importStep==="done"&&"✅ Import Complete"}
                  </div>
                  {importStep==="preview"&&<div style={{fontSize:11,color:"var(--color-text-tertiary)",marginTop:2}}>{matched} matched · {unmatched} unmatched · {fmt(totalAmt)} total</div>}
                </div>
              </div>
              <button onClick={()=>setShowImportModal(false)} style={{background:"none",border:"none",cursor:"pointer",color:"var(--color-text-tertiary)",fontSize:24,lineHeight:1,padding:0,width:"auto"}}>×</button>
            </div>
            {importStep!=="done"&&<div style={{display:"flex",gap:4,marginTop:10}}>{["upload","preview"].map((s,i)=><div key={s} style={{flex:1,height:3,borderRadius:99,background:(importStep==="preview"&&i===0)||importStep===s?"#22c55e":"rgba(128,128,128,.15)"}}/>)}</div>}
          </div>

          <div style={{padding:"16px 20px 0"}}>

            {/* Step 1: Upload */}
            {importStep==="upload"&&<>
              <div style={{marginBottom:14}}>
                <span style={S.label}>Import to month</span>
                <select value={importMonth} onChange={e=>setImportMonth(e.target.value)} style={{...S.ii,fontSize:14,padding:"9px 12px",borderRadius:8}}>
                  {allMonths.map(k=><option key={k} value={k}>{k===CUR?"This Month":monthLabel(k)}</option>)}
                </select>
              </div>
              <div ref={dropRef} onClick={()=>fileInputRef.current?.click()}
                onDragOver={e=>{e.preventDefault();if(dropRef.current)dropRef.current.style.borderColor="#22c55e";}}
                onDragLeave={()=>{if(dropRef.current)dropRef.current.style.borderColor="";}}
                onDrop={e=>{e.preventDefault();if(dropRef.current)dropRef.current.style.borderColor="";const f=e.dataTransfer.files[0];if(f)handleFileRead(f);}}
                style={{border:"1.5px dashed var(--color-border-secondary)",borderRadius:14,padding:"32px 20px",textAlign:"center",cursor:"pointer",marginBottom:14,transition:"border-color .2s"}}>
                <div style={{fontSize:32,marginBottom:10}}>📄</div>
                <div style={{fontSize:14,fontWeight:500,marginBottom:4}}>Drop CSV file here</div>
                <div style={{fontSize:12,color:"var(--color-text-tertiary)"}}>or tap to browse</div>
                <input ref={fileInputRef} type="file" accept=".csv,text/csv" style={{display:"none"}} onChange={e=>{const f=e.target.files?.[0];if(f)handleFileRead(f);}}/>
              </div>
              <div style={{...S.card,marginBottom:12}}>
                <div style={{fontSize:12,fontWeight:500,marginBottom:8}}>Expected CSV format</div>
                <div style={{fontFamily:"monospace",fontSize:11,color:"var(--color-text-secondary)",background:"var(--color-background-secondary)",padding:"10px 12px",borderRadius:8,lineHeight:1.8,overflowX:"auto",whiteSpace:"nowrap"}}>
                  date,category,amount,note<br/>
                  2025-05-01,Groceries,45.23,Fry's run<br/>
                  2025-05-03,Gas,52.00,Shell station
                </div>
                <div style={{fontSize:11,color:"var(--color-text-tertiary)",marginTop:8,lineHeight:1.6}}>
                  • <b>date</b> — YYYY-MM-DD&nbsp;&nbsp;• <b>category</b> — fuzzy-matched to budget<br/>
                  • <b>amount</b> — negatives converted automatically&nbsp;&nbsp;• <b>note</b> — optional
                </div>
              </div>
              <div style={{fontSize:11,color:"var(--color-text-tertiary)",marginBottom:14}}>Also accepts bank export headers: <i>Description, Merchant, Debit, Memo</i>, etc.</div>
              <button onClick={e=>{e.stopPropagation();downloadCSV(generateCSVTemplate(),"expense-template.csv");showToast("Template downloaded");}} style={{width:"100%",background:"transparent",border:"0.5px solid var(--color-border-secondary)",color:"var(--color-text-secondary)",fontSize:13}}>
                ⬇️ Download CSV Template
              </button>
            </>}

            {/* Step 2: Preview */}
            {importStep==="preview"&&<>
              {unmatched>0&&<div style={{...S.card,background:"rgba(245,158,11,.08)",borderColor:"rgba(245,158,11,.3)",marginBottom:12}}>
                <div style={{fontSize:12,fontWeight:500,color:"#f59e0b",marginBottom:2}}>⚠️ {unmatched} row{unmatched!==1?"s":""} need a category assigned</div>
                <div style={{fontSize:11,color:"var(--color-text-tertiary)"}}>Use the dropdown to assign. Unassigned rows are skipped.</div>
              </div>}
              <div style={{overflowX:"auto",marginBottom:14}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                  <thead>
                    <tr style={{borderBottom:"0.5px solid var(--color-border-tertiary)"}}>
                      {["Date","Category","Amount","Note"].map(h=><th key={h} style={{textAlign:"left",padding:"6px 8px 8px",fontSize:10,fontWeight:500,letterSpacing:.7,textTransform:"uppercase",color:"var(--color-text-tertiary)",whiteSpace:"nowrap"}}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {importRows.map(row=>{
                      const ok=!!row.matchedItem;
                      return <tr key={row.rowIndex} style={{borderBottom:"0.5px solid var(--color-border-tertiary)",background:ok?"transparent":"rgba(245,158,11,.04)"}}>
                        <td style={{padding:"8px 8px",whiteSpace:"nowrap",color:"var(--color-text-secondary)",fontSize:11}}>{row.date}</td>
                        <td style={{padding:"8px 8px",minWidth:140}}>
                          <select value={row.matchedItem?String(row.matchedItem.id):""} onChange={e=>updateImportRowCategory(row.rowIndex,e.target.value)}
                            style={{...S.ii,fontSize:11,padding:"3px 6px",borderColor:ok?"var(--color-border-secondary)":"#f59e0b"}}>
                            <option value="">— unassigned —</option>
                            {monthItems.map(b=><option key={b.id} value={String(b.id)}>{b.icon} {b.category}</option>)}
                          </select>
                        </td>
                        <td style={{padding:"8px 8px",whiteSpace:"nowrap",fontVariantNumeric:"tabular-nums",fontWeight:500,color:ok?"#22c55e":"var(--color-text-tertiary)"}}>{fmt(row.amount)}</td>
                        <td style={{padding:"8px 8px",color:"var(--color-text-tertiary)",fontSize:11,maxWidth:120,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{row.rawNote||row.rawCategory}</td>
                      </tr>;
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{...S.card,marginBottom:14,background:matched>0?"rgba(34,197,94,.06)":"transparent"}}>
                <div style={{...S.row,marginBottom:6}}><span style={S.sm}>Will import</span><span style={{fontSize:14,fontWeight:600,color:"#22c55e"}}>{matched} entries · {fmt(totalAmt)}</span></div>
                {unmatched>0&&<div style={S.row}><span style={S.sm}>Skipping (unassigned)</span><span style={{...S.sm,color:"#f59e0b"}}>{unmatched} entries</span></div>}
              </div>
              <button onClick={confirmImport} disabled={importLoading||matched===0}
                style={{width:"100%",background:matched>0?"var(--color-text-primary)":"var(--color-border-secondary)",color:matched>0?"var(--color-background-primary)":"var(--color-text-tertiary)",fontWeight:600,opacity:importLoading?.7:1}}>
                {importLoading?"Importing…":`Import ${matched} Expenses`}
              </button>
            </>}

            {/* Step 3: Done */}
            {importStep==="done"&&<div style={{textAlign:"center",padding:"24px 0 16px"}}>
              <div style={{fontSize:48,marginBottom:16}}>🎉</div>
              <div style={{fontSize:20,fontWeight:600,marginBottom:8}}>Import Complete!</div>
              <div style={{fontSize:14,color:"var(--color-text-secondary)",marginBottom:8}}><b style={{color:"var(--color-text-primary)"}}>{importDoneCount} expenses</b> totalling <b style={{color:"#22c55e"}}>{fmt(importDoneTotal)}</b></div>
              <div style={{fontSize:12,color:"var(--color-text-tertiary)",marginBottom:32}}>Added to <b>{monthLabel(importMonth)}</b> · Budget totals updated automatically</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <button onClick={openImportModal}>Import More</button>
                <button onClick={()=>setShowImportModal(false)} style={{background:"var(--color-text-primary)",color:"var(--color-background-primary)",fontWeight:600}}>Done</button>
              </div>
            </div>}

          </div>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div style={{fontFamily:"system-ui,-apple-system,sans-serif",color:"var(--color-text-primary)",paddingBottom:88}}>

      {syncing&&<div style={{position:"fixed",top:8,right:12,zIndex:200,fontSize:10,color:"var(--color-text-tertiary)",display:"flex",alignItems:"center",gap:4}}><div style={{width:6,height:6,borderRadius:"50%",background:"#22c55e",animation:"pulse 1s infinite"}}/>Syncing…</div>}

      {/* Header */}
      <div style={{padding:"48px 16px 10px",display:"flex",alignItems:"flex-start",justifyContent:"space-between"}}>
        <div>
          <div style={S.label}>Brandon Family · {user}</div>
          <div style={{fontSize:22,fontWeight:500,letterSpacing:"-.5px"}}>{TAB_TITLES[tab]||"Budget"}</div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={S.label}>Income</div>
          <div style={{fontSize:20,fontWeight:500,color:"#22c55e"}}>{fmt(income)}</div>
        </div>
      </div>

      {/* Month pills */}
      {(tab==="budget"||tab==="home")&&(
        <div style={{padding:"0 16px 4px",display:"flex",gap:6,overflowX:"auto",scrollbarWidth:"none"}}>
          {allMonths.map(k=><button key={k} onClick={()=>setViewMonth(k)} style={{flexShrink:0,padding:"5px 12px",borderRadius:99,border:"0.5px solid",borderColor:viewMonth===k?"var(--color-text-primary)":"var(--color-border-tertiary)",background:viewMonth===k?"var(--color-text-primary)":"transparent",color:viewMonth===k?"var(--color-background-primary)":"var(--color-text-secondary)",fontFamily:"inherit",fontSize:12,cursor:"pointer",fontWeight:viewMonth===k?500:400,whiteSpace:"nowrap"}}>{k===CUR?"This Month":monthLabel(k)}</button>)}
          <button onClick={()=>setAddingMonth(true)} style={{flexShrink:0,padding:"5px 12px",borderRadius:99,border:"0.5px dashed var(--color-border-secondary)",background:"transparent",color:"var(--color-text-tertiary)",fontFamily:"inherit",fontSize:12,cursor:"pointer",whiteSpace:"nowrap"}}>+ Month</button>
        </div>
      )}

      <div style={{padding:"10px 16px 0"}}>

      {/* ── HOME ── */}
      {tab==="home"&&(<>
        <div style={S.card}>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <Ring pct={spentPct} size={110} stroke={10} color={ringColor}>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:9,color:"var(--color-text-tertiary)",letterSpacing:.5,textTransform:"uppercase"}}>spent</div>
                <div style={{fontSize:16,fontWeight:500}}>{fmtK(totalSpent)}</div>
                <div style={{fontSize:9,color:"var(--color-text-tertiary)"}}>{Math.round(spentPct)}%</div>
              </div>
            </Ring>
            <div style={{flex:1}}>
              {[{l:"Budgeted",v:totalBudgeted,c:"var(--color-text-primary)"},{l:"Remaining",v:remaining,c:remaining>=0?"#22c55e":"#ef4444"}].map(r=>(
                <div key={r.l} style={{marginBottom:12}}>
                  <div style={S.label}>{r.l}</div>
                  <div style={{fontSize:22,fontWeight:500,color:r.c,letterSpacing:"-.5px"}}>{r.v>=0?fmt(r.v):"-"+fmt(-r.v)}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{marginTop:12}}>
            <div style={{...S.row,marginBottom:5}}><span style={S.sm}>Utilization</span><span style={{...S.sm,fontVariantNumeric:"tabular-nums"}}>{Math.round((totalSpent/totalBudgeted)*100)||0}%</span></div>
            <Bar pct={(totalSpent/totalBudgeted)*100} color={ringColor} h={6}/>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
          <div style={{...S.card,background:"var(--color-background-danger)",borderColor:"var(--color-border-danger)"}}><div style={S.label}>Total Debt</div><div style={{fontSize:20,fontWeight:500,color:"#ef4444",letterSpacing:"-.5px"}}>{fmtK(totalDebt)}</div><div style={S.sm}>{((totalPaid/totalDebt)*100||0).toFixed(0)}% paid</div></div>
          <div style={{...S.card,background:"var(--color-background-success)",borderColor:"var(--color-border-success)"}}><div style={S.label}>Total Saved</div><div style={{fontSize:20,fontWeight:500,color:"#22c55e",letterSpacing:"-.5px"}}>{fmtK(totalSaved)}</div><div style={S.sm}>of {fmt(totalTarget)} goal</div></div>
        </div>
        {overBudget.length>0&&<div style={{...S.card,borderLeft:"3px solid #ef4444"}}><div style={{...S.row,marginBottom:10}}><span style={{fontSize:13,fontWeight:500,color:"#ef4444"}}>Over budget</span><span style={S.chip("#ef4444")}>{overBudget.length} items</span></div>{overBudget.map(b=><div key={b.id} style={{...S.row,marginBottom:7}}><span style={{fontSize:13}}>{b.icon} {b.category}</span><span style={S.chip("#ef4444")}>+{fmt(Number(b.spent)-Number(b.budgeted))}</span></div>)}</div>}
        <div style={S.card}>
          <div style={{...S.row,marginBottom:12}}><span style={{fontSize:13,fontWeight:500}}>Unpaid Bills</span><span style={S.chip("#f59e0b")}>{pendingBills.length} due</span></div>
          {pendingBills.slice(0,6).map(b=><div key={b.id} style={{...S.row,marginBottom:10}}><div style={{display:"flex",alignItems:"center",gap:10}}><div style={{width:32,height:32,borderRadius:8,background:"var(--color-background-secondary)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}>{b.icon}</div><div><div style={{fontSize:13}}>{b.category}</div>{b.due_date&&b.due_date!=="–"&&<div style={{fontSize:10,color:"var(--color-text-tertiary)"}}>Due {b.due_date}</div>}</div></div><span style={{fontSize:13,fontWeight:500,fontVariantNumeric:"tabular-nums"}}>{fmt(Number(b.budgeted))}</span></div>)}
          {pendingBills.length>6&&<div style={{...S.sm,textAlign:"center",paddingTop:4}}>+{pendingBills.length-6} more</div>}
        </div>
        <div style={S.card}>
          <div style={{...S.row,marginBottom:8}}><span style={{fontSize:13,fontWeight:500}}>Debt payoff</span><span style={{...S.sm,fontVariantNumeric:"tabular-nums"}}>{((totalPaid/totalDebt)*100||0).toFixed(1)}%</span></div>
          <Bar pct={(totalPaid/totalDebt)*100} h={7}/>
          <div style={{...S.row,marginTop:7}}><span style={S.sm}>Paid: {fmt(totalPaid)}</span><span style={S.sm}>Total: {fmt(totalDebt)}</span></div>
        </div>
        <div style={S.sect}>Settings</div>
        <div style={S.card}>
          <div style={{fontSize:14,fontWeight:500,marginBottom:4}}>👋 Signed in as {user}</div>
          <div style={{...S.sm,marginBottom:12}}>Both phones share the same live data via Supabase.</div>
          <button onClick={()=>setUser(null)} style={{width:"100%"}}>Switch User / Lock App</button>
        </div>
      </>)}

      {/* ── BUDGET ── */}
      {tab==="budget"&&(<>
        {viewMonth!==CUR&&<div style={{...S.card,background:"var(--color-background-info)",borderColor:"var(--color-border-info)",color:"var(--color-text-info)",fontSize:12,marginBottom:10}}>Archived: <b>{monthLabel(viewMonth)}</b></div>}
        <div style={{marginBottom:10}}>
          {isCur&&<div style={{display:"flex",gap:8,marginBottom:8}}>
            {!editMode&&<>
              <button onClick={()=>{const m={};curItems.forEach(b=>{m[b.id]={budgeted:String(b.budgeted),category:b.category,icon:b.icon,group_name:b.group_name,due_date:b.due_date||"–"};});setEditBufs(m);setEditMode(true);}} style={{padding:"8px 18px",borderRadius:99,border:"1px solid var(--color-border-secondary)",background:"var(--color-background-secondary)",fontSize:13,fontWeight:500,cursor:"pointer",width:"auto",flexShrink:0}}>✏️ Edit</button>
              <button onClick={()=>{setNewCat({category:"",budgeted:"",icon:"•••",group_name:"other",due_date:"–"});setAddingCat(true);}} style={{padding:"8px 18px",borderRadius:99,border:"1px dashed #22c55e",background:"rgba(34,197,94,.08)",color:"#22c55e",fontSize:13,fontWeight:500,cursor:"pointer",width:"auto",flexShrink:0}}>+ Category</button>
            </>}
            {editMode&&<>
              <button onClick={saveEditBudget} style={{padding:"8px 18px",borderRadius:99,border:"none",background:"var(--color-text-primary)",color:"var(--color-background-primary)",fontSize:13,fontWeight:600,cursor:"pointer",width:"auto",flexShrink:0}}>Save</button>
              <button onClick={()=>setEditMode(false)} style={{padding:"8px 18px",borderRadius:99,border:"1px solid var(--color-border-secondary)",background:"transparent",fontSize:13,cursor:"pointer",width:"auto",flexShrink:0}}>Cancel</button>
            </>}
          </div>}
          <div style={{display:"flex",gap:6,overflowX:"auto",scrollbarWidth:"none"}}>
            {["all",...GROUPS].map(g=><button key={g} onClick={()=>setFilterGroup(g)} style={{flexShrink:0,padding:"5px 12px",borderRadius:99,border:"0.5px solid",borderColor:filterGroup===g?"var(--color-text-primary)":"var(--color-border-tertiary)",background:filterGroup===g?"var(--color-text-primary)":"transparent",color:filterGroup===g?"var(--color-background-primary)":"var(--color-text-secondary)",fontFamily:"inherit",fontSize:11,cursor:"pointer",textTransform:"capitalize",whiteSpace:"nowrap",width:"auto"}}>{g==="all"?"All":g}</button>)}
          </div>
        </div>
        {filtered.map(b=>{
          const pct=Number(b.budgeted)>0?(Number(b.spent)/Number(b.budgeted))*100:0;
          const over=Number(b.spent)>Number(b.budgeted)&&Number(b.budgeted)>0;
          const isPend=Number(b.spent)===0&&Number(b.budgeted)>0;
          const eb=editBufs[b.id]||{};
          return(<div key={b.id} style={{...S.card,borderLeft:`3px solid ${over?"#ef4444":isPend?"var(--color-border-tertiary)":"#22c55e"}`}}>
            {editMode&&isCur?(<>
              <div style={{display:"grid",gridTemplateColumns:"auto 1fr auto",gap:8,marginBottom:8,alignItems:"center"}}>
                <select value={eb.icon||b.icon} onChange={e=>setEditBufs(p=>({...p,[b.id]:{...p[b.id],icon:e.target.value}}))} style={{fontSize:18,padding:"2px 4px",borderRadius:6,border:"0.5px solid var(--color-border-secondary)",background:"var(--color-background-secondary)",fontFamily:"inherit",width:"auto"}}>{EMOJI_OPTIONS.map(e=><option key={e} value={e}>{e}</option>)}</select>
                <input value={eb.category||b.category} onChange={e=>setEditBufs(p=>({...p,[b.id]:{...p[b.id],category:e.target.value}}))} style={{...S.ii,fontSize:13}}/>
                <button onClick={()=>removeBudgetItem(b.id,b.category)} style={{background:"none",border:"none",cursor:"pointer",color:"#ef4444",fontSize:20,lineHeight:1,padding:"0 2px",width:"auto",flexShrink:0}}>×</button>
              </div>
              <div style={S.fieldRow}>
                <div><div style={S.label}>Group</div><select value={eb.group_name||b.group_name} onChange={e=>setEditBufs(p=>({...p,[b.id]:{...p[b.id],group_name:e.target.value}}))} style={S.ii}>{GROUPS.map(g=><option key={g} value={g}>{g}</option>)}</select></div>
                <div><div style={S.label}>Due Date</div><input value={eb.due_date??b.due_date??"–"} onChange={e=>setEditBufs(p=>({...p,[b.id]:{...p[b.id],due_date:e.target.value}}))} style={S.ii}/></div>
              </div>
              <div><div style={S.label}>Budget Amount</div><div style={{display:"flex",alignItems:"center",gap:4}}><span style={S.sm}>$</span><input type="number" value={eb.budgeted??String(b.budgeted)} onChange={e=>setEditBufs(p=>({...p,[b.id]:{...p[b.id],budgeted:e.target.value}}))} style={{...S.ii,flex:1}}/></div></div>
            </>):(<>
              <div style={{...S.row,marginBottom:8}}>
                <div style={{display:"flex",alignItems:"center",gap:9,flex:1,minWidth:0}}>
                  <span style={{fontSize:16,flexShrink:0}}>{b.icon}</span>
                  <div style={{minWidth:0}}><div style={{fontSize:13,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{b.category}</div>{b.due_date&&b.due_date!=="–"&&<div style={{fontSize:10,color:"var(--color-text-tertiary)"}}>Due {b.due_date}</div>}</div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:5,flexShrink:0}}>
                  {over&&<span style={S.chip("#ef4444")}>+{fmt(Number(b.spent)-Number(b.budgeted))}</span>}
                  {!over&&isPend&&<span style={S.chip("#f59e0b")}>pending</span>}
                  {!over&&!isPend&&Number(b.budgeted)>0&&<span style={S.chip("#22c55e")}>paid</span>}
                  {Number(b.budgeted)===0&&<span style={S.chip("#8b5cf6")}>quarterly</span>}
                </div>
              </div>
              <Bar pct={pct} h={5}/>
              <div style={{...S.row,marginTop:7}}><span style={{...S.sm,fontVariantNumeric:"tabular-nums"}}>{fmt(Number(b.spent))}</span><span style={{...S.sm,fontVariantNumeric:"tabular-nums"}}>/ {fmt(Number(b.budgeted))}</span></div>
              {!isCur&&<div style={{marginTop:8,display:"flex",alignItems:"center",gap:6}}><span style={S.sm}>Edit spent: $</span><input type="number" defaultValue={b.spent} onBlur={async e=>{const v=+(parseFloat(e.target.value)||0).toFixed(2);await db.update("budget_items",b.id,"id",{spent:v});setItems(prev=>prev.map(x=>x.id===b.id?{...x,spent:v}:x));}} style={{width:80,fontSize:12,padding:"2px 6px",borderRadius:6,border:"0.5px solid var(--color-border-secondary)",background:"var(--color-background-secondary)"}}/></div>}
            </>)}
          </div>);
        })}
      </>)}

      {/* ── LOG ── */}
      {tab==="log"&&(<>
        {/* Import / Export toolbar */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
          <button onClick={openImportModal} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:7,padding:"11px 14px",borderRadius:12,border:"1px solid #22c55e",background:"rgba(34,197,94,.08)",color:"#22c55e",fontFamily:"inherit",fontSize:13,fontWeight:600,cursor:"pointer",width:"100%"}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Import CSV
          </button>
          <button onClick={exportExpensesToCSV} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:7,padding:"11px 14px",borderRadius:12,border:"0.5px solid var(--color-border-secondary)",background:"var(--color-background-secondary)",color:"var(--color-text-secondary)",fontFamily:"inherit",fontSize:13,fontWeight:500,cursor:"pointer",width:"100%"}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export CSV
          </button>
        </div>

        {/* Log form */}
        <div style={S.card}>
          <div style={{fontSize:14,fontWeight:500,marginBottom:14}}>Log Expense</div>
          <span style={S.label}>Category</span>
          <select value={logCat} onChange={e=>setLogCat(e.target.value)} style={S.inp}><option value="">Choose…</option>{curItems.map(b=><option key={b.id} value={b.id}>{b.icon} {b.category} — {fmt(Number(b.budgeted))}</option>)}</select>
          <div style={S.fieldRow}>
            <div><span style={S.label}>Amount</span><input type="number" placeholder="0.00" value={logAmt} onChange={e=>setLogAmt(e.target.value)} style={{...S.ii,fontSize:14,padding:"9px 12px",borderRadius:8}}/></div>
            <div><span style={S.label}>Date</span><input type="date" value={logDate} onChange={e=>setLogDate(e.target.value)} style={{...S.ii,fontSize:14,padding:"9px 12px",borderRadius:8}}/></div>
          </div>
          <span style={S.label}>Note (optional)</span>
          <input type="text" placeholder="e.g. Fry's grocery run" value={logNote} onChange={e=>setLogNote(e.target.value)} style={S.inp}/>
          {prevCat&&logAmt&&+logAmt>0&&(
            <div style={{...S.card,background:willOver?"var(--color-background-danger)":"var(--color-background-success)",borderColor:willOver?"var(--color-border-danger)":"var(--color-border-success)",marginBottom:12}}>
              <div style={{...S.row,marginBottom:6}}><span style={S.sm}>Current</span><span style={{...S.sm,fontVariantNumeric:"tabular-nums"}}>{fmt(Number(prevCat.spent))}</span></div>
              <div style={{...S.row,marginBottom:6}}><span style={S.sm}>After</span><span style={{fontSize:14,fontWeight:500,color:willOver?"#ef4444":"#22c55e",fontVariantNumeric:"tabular-nums"}}>{fmt(projSpend)}</span></div>
              <div style={{...S.row,marginBottom:8}}><span style={S.sm}>Budget</span><span style={{...S.sm,fontVariantNumeric:"tabular-nums"}}>{fmt(Number(prevCat.budgeted))}</span></div>
              <Bar pct={(projSpend/Number(prevCat.budgeted))*100} h={5}/>
              {willOver&&<div style={{fontSize:12,color:"#ef4444",marginTop:8,fontWeight:500}}>Will exceed by {fmt(projSpend-Number(prevCat.budgeted))}</div>}
            </div>
          )}
          <button onClick={logExpense} style={{width:"100%"}}>Log Expense</button>
        </div>

        {/* Debt payment */}
        <div style={{...S.row,margin:"6px 0"}}><div style={{flex:1,height:"0.5px",background:"var(--color-border-tertiary)"}}/><span style={{...S.sm,padding:"0 10px"}}>debt payment</span><div style={{flex:1,height:"0.5px",background:"var(--color-border-tertiary)"}}/></div>
        <div style={S.card}>
          <div style={{fontSize:14,fontWeight:500,marginBottom:14}}>Record Debt Payment</div>
          <span style={S.label}>Account</span>
          <select value={debtId} onChange={e=>setDebtId(e.target.value)} style={S.inp}><option value="">Choose…</option>{debts.filter(d=>Number(d.paid)<Number(d.total)).map(d=><option key={d.id} value={d.id}>{d.name} — {fmt(Number(d.total)-Number(d.paid))} left</option>)}</select>
          <span style={S.label}>Amount</span>
          <input type="number" placeholder="0.00" value={debtAmt} onChange={e=>setDebtAmt(e.target.value)} style={S.inp}/>
          <button onClick={payDebt} style={{width:"100%"}}>Record Payment</button>
        </div>

        {/* Expense history */}
        <div style={{...S.row,margin:"8px 0 4px"}}><div style={{flex:1,height:"0.5px",background:"var(--color-border-tertiary)"}}/><span style={{...S.sm,padding:"0 10px"}}>expense history</span><div style={{flex:1,height:"0.5px",background:"var(--color-border-tertiary)"}}/></div>

        {logForMonth.length>0?(<>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10,gap:8,flexWrap:"wrap"}}>
            <div style={{display:"flex",gap:6,overflowX:"auto",scrollbarWidth:"none",flex:1}}>
              {["all",...logCategories].map(c=><button key={c} onClick={()=>setExpenseFilter(c)} style={{flexShrink:0,padding:"4px 10px",borderRadius:99,border:"0.5px solid",borderColor:expenseFilter===c?"var(--color-text-primary)":"var(--color-border-tertiary)",background:expenseFilter===c?"var(--color-text-primary)":"transparent",color:expenseFilter===c?"var(--color-background-primary)":"var(--color-text-secondary)",fontFamily:"inherit",fontSize:11,cursor:"pointer",whiteSpace:"nowrap",width:"auto"}}>{c==="all"?"All":c}</button>)}
            </div>
            <div style={{display:"flex",gap:6,flexShrink:0}}>
              {selectMode?(<>
                <button onClick={toggleSelectAll} style={{padding:"4px 10px",borderRadius:99,border:"0.5px solid var(--color-border-secondary)",background:"transparent",fontFamily:"inherit",fontSize:11,cursor:"pointer",width:"auto",color:"var(--color-text-secondary)"}}>{selectedLogIds.size===filteredLog.length?"None":"All"}</button>
                {selectedLogIds.size>0&&<button onClick={massDeleteExpenses} style={{padding:"4px 12px",borderRadius:99,border:"none",background:"#ef4444",color:"#fff",fontFamily:"inherit",fontSize:11,fontWeight:600,cursor:"pointer",width:"auto"}}>Delete {selectedLogIds.size}</button>}
                <button onClick={()=>{setSelectMode(false);setSelectedLogIds(new Set());}} style={{padding:"4px 10px",borderRadius:99,border:"0.5px solid var(--color-border-tertiary)",background:"transparent",fontFamily:"inherit",fontSize:11,cursor:"pointer",width:"auto",color:"var(--color-text-tertiary)"}}>Done</button>
              </>):<button onClick={()=>setSelectMode(true)} style={{padding:"4px 10px",borderRadius:99,border:"0.5px solid var(--color-border-secondary)",background:"transparent",fontFamily:"inherit",fontSize:11,cursor:"pointer",width:"auto",color:"var(--color-text-secondary)"}}>Select</button>}
            </div>
          </div>
          <div style={{...S.row,marginBottom:10}}>
            <span style={{fontSize:12,color:"var(--color-text-tertiary)"}}>{filteredLog.length} entries</span>
            <span style={{fontSize:14,fontWeight:600,fontVariantNumeric:"tabular-nums"}}>{fmt(logTotal)}</span>
          </div>
          {logDates.map(date=>(
            <div key={date}>
              <div style={{fontSize:11,fontWeight:500,color:"var(--color-text-tertiary)",letterSpacing:.5,textTransform:"uppercase",padding:"6px 0 4px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <span>{date===todayISO()?"Today":new Date(date+"T12:00:00").toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}</span>
                <span style={{fontVariantNumeric:"tabular-nums"}}>{fmt(logByDate[date].reduce((s,e)=>s+Number(e.amount),0))}</span>
              </div>
              {logByDate[date].map(entry=>{
                const catItem=curItems.find(b=>b.id===entry.budget_item_id);
                const isSel=selectedLogIds.has(entry.id);
                return(
                  <div key={entry.id} style={{...S.card,padding:"10px 14px",marginBottom:8,borderLeft:`3px solid ${isSel?"#60a5fa":"var(--color-border-tertiary)"}`,background:isSel?"rgba(96,165,250,.05)":"var(--color-background-primary)",transition:"all .15s"}} onClick={()=>selectMode&&toggleSelectLog(entry.id)}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      {selectMode&&<div style={{width:18,height:18,borderRadius:5,border:`1.5px solid ${isSel?"#60a5fa":"var(--color-border-secondary)"}`,background:isSel?"#60a5fa":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .15s"}}>
                        {isSel&&<svg width="10" height="10" viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>}
                      <div style={{width:32,height:32,borderRadius:8,background:"var(--color-background-secondary)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}>{catItem?.icon||"💳"}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{entry.category}</div>
                        {entry.note&&<div style={{fontSize:11,color:"var(--color-text-tertiary)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{entry.note}</div>}
                        <div style={{fontSize:10,color:"var(--color-text-tertiary)",marginTop:1}}>{entry.logged_by}</div>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                        <span style={{fontSize:14,fontWeight:600,fontVariantNumeric:"tabular-nums"}}>{fmt(Number(entry.amount))}</span>
                        {!selectMode&&<button onClick={e=>{e.stopPropagation();deleteExpenseEntry(entry);}} style={{background:"none",border:"none",cursor:"pointer",color:"var(--color-text-tertiary)",fontSize:18,lineHeight:1,padding:0,width:"auto"}}>×</button>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </>):(
          <div style={{...S.card,textAlign:"center",padding:"28px 20px",color:"var(--color-text-tertiary)"}}>
            <div style={{fontSize:28,marginBottom:8}}>📋</div>
            <div style={{fontSize:13,marginBottom:4}}>No expense history yet</div>
            <div style={{fontSize:11}}>Log expenses above or import a CSV</div>
          </div>
        )}
      </>)}

      {/* ── DEBTS ── */}
      {tab==="debts"&&(<>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
          <div style={{...S.card,background:"var(--color-background-danger)",borderColor:"var(--color-border-danger)"}}><div style={S.label}>Collections</div><div style={{fontSize:20,fontWeight:500,color:"#ef4444",letterSpacing:"-.5px"}}>{fmtK(collectionsAmt)}</div><div style={S.sm}>{((collectionsAmt/totalDebt)*100||0).toFixed(0)}% of total</div></div>
          <div style={S.card}><div style={S.label}>Still Owed</div><div style={{fontSize:20,fontWeight:500,letterSpacing:"-.5px"}}>{fmtK(totalDebt-totalPaid)}</div><div style={S.sm}>of {fmt(totalDebt)}</div></div>
        </div>
        <div style={{...S.card,borderLeft:"3px solid #8b5cf6",padding:0,overflow:"hidden",marginBottom:10}}>
          <div onClick={()=>setShowAI(v=>!v)} style={{padding:"12px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}}>
            <div style={{display:"flex",alignItems:"center",gap:9}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><circle cx="12" cy="16" r="1" fill="#8b5cf6"/></svg><span style={{fontSize:13,fontWeight:500,color:"#8b5cf6"}}>AI Debt Advisor</span></div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="2" strokeLinecap="round"><polyline points={showAI?"18 15 12 9 6 15":"6 9 12 15 18 9"}/></svg>
          </div>
          {showAI&&(<div style={{borderTop:"0.5px solid var(--color-border-tertiary)",padding:"12px 14px"}}>
            <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
              {["Which debt first?","Negotiate collections?","Snowball vs avalanche?","Debt-free timeline?","Exit collections?"].map(q=><button key={q} onClick={()=>askAI(q)} style={{padding:"5px 10px",borderRadius:99,border:"0.5px solid rgba(139,92,246,.22)",background:"rgba(139,92,246,.08)",color:"#8b5cf6",fontFamily:"inherit",fontSize:11,cursor:"pointer",fontWeight:500,width:"auto"}}>{q}</button>)}
            </div>
            <div style={{display:"flex",gap:7,marginBottom:12}}>
              <input value={aiQuestion} onChange={e=>setAiQuestion(e.target.value)} onKeyDown={e=>e.key==="Enter"&&askAI()} placeholder="Ask about your debts…" style={{flex:1,fontSize:13,padding:"8px 12px",borderRadius:8,border:"0.5px solid var(--color-border-secondary)",background:"var(--color-background-secondary)",fontFamily:"inherit"}}/>
              <button onClick={()=>askAI()} disabled={aiLoading||!aiQuestion.trim()} style={{padding:"8px 14px",borderRadius:8,border:"none",background:"#8b5cf6",color:"#fff",fontFamily:"inherit",fontSize:13,cursor:"pointer",fontWeight:500,opacity:aiLoading||!aiQuestion.trim()?.5:1,width:"auto"}}>{aiLoading?"…":"Ask"}</button>
            </div>
            {(aiLoading||aiResponse)&&<div ref={aiRef} style={{background:"var(--color-background-secondary)",borderRadius:10,padding:"12px 14px",fontSize:13,lineHeight:1.7,maxHeight:300,overflowY:"auto",whiteSpace:"pre-wrap",border:"0.5px solid var(--color-border-tertiary)"}}>{aiLoading?"Analyzing your debt situation…":aiResponse}</div>}
            {aiResponse&&!aiLoading&&<button onClick={()=>setAiResponse("")} style={{marginTop:8,padding:"4px 10px",borderRadius:99,border:"0.5px solid var(--color-border-tertiary)",background:"transparent",color:"var(--color-text-tertiary)",fontFamily:"inherit",fontSize:11,cursor:"pointer",width:"auto"}}>Clear</button>}
          </div>)}
        </div>
        <div style={{...S.row,alignItems:"center",marginBottom:4}}>
          <div style={S.sect}>In Collections</div>
          <div style={{display:"flex",gap:6}}>
            <button onClick={addDebt} style={{padding:"4px 10px",borderRadius:99,border:"0.5px dashed var(--color-border-secondary)",background:"transparent",color:"var(--color-text-tertiary)",fontFamily:"inherit",fontSize:11,cursor:"pointer",width:"auto"}}>+ Debt</button>
            {!editDebtMode?<button onClick={()=>{const m={};debts.forEach(d=>{m[d.id]={total:String(d.total),paid:String(d.paid),name:d.name,collections:d.collections,apr:String(d.apr||0)};});setEditDebtBufs(m);setEditDebtMode(true);}} style={{padding:"4px 12px",borderRadius:99,border:"0.5px solid var(--color-border-secondary)",background:"transparent",fontFamily:"inherit",fontSize:11,cursor:"pointer",width:"auto"}}>Edit</button>
            :<div style={{display:"flex",gap:5}}>
              <button onClick={()=>setEditDebtMode(false)} style={{padding:"4px 10px",borderRadius:99,border:"0.5px solid var(--color-border-tertiary)",background:"transparent",color:"var(--color-text-tertiary)",fontFamily:"inherit",fontSize:11,cursor:"pointer",width:"auto"}}>Cancel</button>
              <button onClick={saveEditDebts} style={{padding:"4px 10px",borderRadius:99,border:"none",background:"var(--color-text-primary)",color:"var(--color-background-primary)",fontFamily:"inherit",fontSize:11,cursor:"pointer",fontWeight:500,width:"auto"}}>Save</button>
            </div>}
          </div>
        </div>
        {[...debts.filter(d=>d.collections),...debts.filter(d=>!d.collections)].map((debt,idx)=>{
          const isCol=debt.collections;
          const ebuf=editDebtBufs[debt.id]||{};
          const tot=editDebtMode?(+(parseFloat(ebuf.total)||0)):Number(debt.total);
          const pd=editDebtMode?(+(parseFloat(ebuf.paid)||0)):Number(debt.paid);
          const dpct=tot>0?(pd/tot)*100:0,drem=tot-pd,ddone=drem<=0;
          const debtCard=(<div key={debt.id} style={{...S.card,borderLeft:`3px solid ${isCol?"#ef4444":ddone?"#22c55e":"var(--color-border-tertiary)"}`}}>
            {editDebtMode?(<>
              <input value={ebuf.name||""} onChange={ev=>setEditDebtBufs(p=>({...p,[debt.id]:{...p[debt.id],name:ev.target.value}}))} style={{...S.ii,marginBottom:8,fontSize:13}}/>
              <div style={S.fieldRow}>
                <div><div style={S.label}>Total</div><div style={{display:"flex",gap:3,alignItems:"center"}}><span style={S.sm}>$</span><input type="number" value={ebuf.total||""} onChange={ev=>setEditDebtBufs(p=>({...p,[debt.id]:{...p[debt.id],total:ev.target.value}}))} style={S.ii}/></div></div>
                <div><div style={S.label}>Paid</div><div style={{display:"flex",gap:3,alignItems:"center"}}><span style={S.sm}>$</span><input type="number" value={ebuf.paid||""} onChange={ev=>setEditDebtBufs(p=>({...p,[debt.id]:{...p[debt.id],paid:ev.target.value}}))} style={S.ii}/></div></div>
              </div>
              <div style={{marginBottom:8}}><div style={S.label}>APR %</div><input type="number" value={ebuf.apr||""} onChange={ev=>setEditDebtBufs(p=>({...p,[debt.id]:{...p[debt.id],apr:ev.target.value}}))} placeholder="0" style={S.ii}/></div>
              <label style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:"var(--color-text-secondary)",cursor:"pointer"}}><input type="checkbox" checked={ebuf.collections??debt.collections} onChange={ev=>setEditDebtBufs(p=>({...p,[debt.id]:{...p[debt.id],collections:ev.target.checked}}))}/>In collections</label>
            </>):(<>
              <div style={{...S.row,marginBottom:8}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:7}}><span style={{fontSize:13,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{debt.name}</span>{ddone&&<span style={S.chip("#22c55e")}>paid off</span>}</div>
                  <div style={S.sm}>{dpct.toFixed(0)}% paid{Number(debt.apr)>0?` · ${debt.apr}% APR`:""}</div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                  <span style={{fontSize:15,fontWeight:500,color:isCol?"#ef4444":ddone?"#22c55e":"var(--color-text-primary)"}}>{fmt(drem)}</span>
                  <button onClick={()=>removeDebt(debt.id,debt.name)} style={{background:"none",border:"none",cursor:"pointer",color:"var(--color-text-tertiary)",fontSize:18,lineHeight:1,padding:0,width:"auto"}}>×</button>
                </div>
              </div>
              <Bar pct={dpct} color={isCol?"#ef4444":"#22c55e"} h={5}/>
            </>)}
          </div>);
          if(!isCol&&idx===debts.filter(d=>d.collections).length) return[<div key="sect" style={S.sect}>Active Debts</div>,debtCard];
          return debtCard;
        }).flat()}
      </>)}

      {/* ── SAVE ── */}
      {tab==="save"&&(<>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
          <div style={{...S.card,background:"var(--color-background-success)",borderColor:"var(--color-border-success)"}}><div style={S.label}>Total Saved</div><div style={{fontSize:20,fontWeight:500,color:"#22c55e",letterSpacing:"-.5px"}}>{fmtK(totalSaved)}</div><div style={S.sm}>of {fmt(totalTarget)} goal</div></div>
          <div style={S.card}><div style={S.label}>Monthly Committed</div><div style={{fontSize:20,fontWeight:500,letterSpacing:"-.5px"}}>{fmtK(monthlyCommitted)}</div><div style={S.sm}>{fmt(Math.max(remaining-monthlyCommitted,0))} surplus left</div></div>
        </div>
        <div style={{...S.card,borderLeft:"3px solid #f59e0b",padding:0,overflow:"hidden",marginBottom:10}}>
          <div onClick={()=>setShowSvD(v=>!v)} style={{padding:"12px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}}>
            <div style={{display:"flex",alignItems:"center",gap:9}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg><span style={{fontSize:13,fontWeight:500,color:"#f59e0b"}}>Save vs. Pay Debt Calculator</span></div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="2" strokeLinecap="round"><polyline points={showSvD?"18 15 12 9 6 15":"6 9 12 15 18 9"}/></svg>
          </div>
          {showSvD&&(<div style={{borderTop:"0.5px solid var(--color-border-tertiary)",padding:"14px"}}>
            {highAPR&&<div style={{...S.card,background:"var(--color-background-danger)",borderColor:"var(--color-border-danger)",marginBottom:10}}><div style={{fontSize:12,fontWeight:500,color:"#ef4444",marginBottom:4}}>Highest-interest debt</div><div style={S.row}><span style={{fontSize:13}}>{highAPR.name}</span><span style={{fontSize:13,fontWeight:500,color:"#ef4444"}}>{highAPR.apr}% APR</span></div><div style={{...S.sm,marginTop:4}}>Every $1,000 in savings costs ~${((Number(highAPR.apr)-4.5)/100*1000).toFixed(0)}/yr vs. paying this debt.</div></div>}
            {[{label:"Recommended split",val:Number(highAPR?.apr)>10?"80% debt / 20% savings":"50/50 split",color:"#22c55e"},{label:"Emergency fund first",val:"Build $1,000 buffer before aggressive payoff (CFPB)",color:"#60a5fa"},{label:"After $1k fund",val:`Every extra dollar → ${highAPR?.name||"highest APR debt"}`,color:"#f59e0b"}].map(r=><div key={r.label} style={{padding:"10px 12px",background:"var(--color-background-secondary)",borderRadius:"var(--border-radius-md)",borderLeft:`3px solid ${r.color}`,marginBottom:8}}><div style={{fontSize:11,fontWeight:500,color:"var(--color-text-tertiary)",textTransform:"uppercase",letterSpacing:.7,marginBottom:3}}>{r.label}</div><div style={{fontSize:13,lineHeight:1.5}}>{r.val}</div></div>)}
          </div>)}
        </div>
        <div style={{...S.row,alignItems:"center",marginBottom:4}}>
          <div style={S.sect}>Your Funds</div>
          <div style={{display:"flex",gap:6}}>
            <button onClick={()=>{setNewFund({name:"",icon:"🏦",target:"",saved:"",monthly_goal:"",due_date:"",color:"#22c55e",fund_type:"sinking",notes:""});setAddingFund(true);}} style={{padding:"4px 10px",borderRadius:99,border:"0.5px dashed var(--color-border-secondary)",background:"transparent",color:"var(--color-text-tertiary)",fontFamily:"inherit",fontSize:11,cursor:"pointer",width:"auto"}}>+ Fund</button>
            {!editSavingsMode?<button onClick={()=>{const m={};savings.forEach(f=>{m[f.id]={...f,target:String(f.target),saved:String(f.saved),monthly_goal:String(f.monthly_goal)};});setEditSavingsBufs(m);setEditSavingsMode(true);}} style={{padding:"4px 12px",borderRadius:99,border:"0.5px solid var(--color-border-secondary)",background:"transparent",fontFamily:"inherit",fontSize:11,cursor:"pointer",width:"auto"}}>Edit</button>
            :<div style={{display:"flex",gap:5}}>
              <button onClick={()=>setEditSavingsMode(false)} style={{padding:"4px 10px",borderRadius:99,border:"0.5px solid var(--color-border-tertiary)",background:"transparent",color:"var(--color-text-tertiary)",fontFamily:"inherit",fontSize:11,cursor:"pointer",width:"auto"}}>Cancel</button>
              <button onClick={saveEditSavings} style={{padding:"4px 10px",borderRadius:99,border:"none",background:"var(--color-text-primary)",color:"var(--color-background-primary)",fontFamily:"inherit",fontSize:11,cursor:"pointer",fontWeight:500,width:"auto"}}>Save</button>
            </div>}
          </div>
        </div>
        {savings.map(f=>{
          const pct=Number(f.target)>0?(Number(f.saved)/Number(f.target))*100:0;
          const ml=Number(f.monthly_goal)>0?Math.ceil((Number(f.target)-Number(f.saved))/Number(f.monthly_goal)):null;
          const done=Number(f.saved)>=Number(f.target);
          const ed=editSavingsBufs[f.id]||{};
          return(<div key={f.id} style={{...S.card,borderLeft:`3px solid ${f.color||"#22c55e"}`}}>
            {editSavingsMode?(<>
              <div style={{display:"grid",gridTemplateColumns:"auto auto 1fr auto",gap:8,marginBottom:10,alignItems:"center"}}>
                <select value={ed.icon||f.icon} onChange={e=>setEditSavingsBufs(p=>({...p,[f.id]:{...p[f.id],icon:e.target.value}}))} style={{fontSize:18,padding:"2px 4px",borderRadius:6,border:"0.5px solid var(--color-border-secondary)",background:"var(--color-background-secondary)",fontFamily:"inherit",width:"auto"}}>{FUND_ICONS.map(ic=><option key={ic} value={ic}>{ic}</option>)}</select>
                <div style={{display:"flex",flexWrap:"wrap",gap:4}}>{FUND_COLORS.map(c=><div key={c} onClick={()=>setEditSavingsBufs(p=>({...p,[f.id]:{...p[f.id],color:c}}))} style={{width:16,height:16,borderRadius:"50%",background:c,cursor:"pointer",border:(ed.color||f.color)===c?"2px solid var(--color-text-primary)":"2px solid transparent"}}/>)}</div>
                <input value={ed.name||f.name} onChange={e=>setEditSavingsBufs(p=>({...p,[f.id]:{...p[f.id],name:e.target.value}}))} style={{...S.ii,fontSize:13}}/>
                <button onClick={()=>removeFund(f.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#ef4444",fontSize:18,lineHeight:1,padding:"0 4px",width:"auto"}}>×</button>
              </div>
              <div style={S.fieldRow}>
                <div><div style={S.label}>Target $</div><input type="number" value={ed.target||""} onChange={e=>setEditSavingsBufs(p=>({...p,[f.id]:{...p[f.id],target:e.target.value}}))} style={S.ii}/></div>
                <div><div style={S.label}>Saved $</div><input type="number" value={ed.saved||""} onChange={e=>setEditSavingsBufs(p=>({...p,[f.id]:{...p[f.id],saved:e.target.value}}))} style={S.ii}/></div>
              </div>
              <div style={S.fieldRow}>
                <div><div style={S.label}>Monthly Goal $</div><input type="number" value={ed.monthly_goal||""} onChange={e=>setEditSavingsBufs(p=>({...p,[f.id]:{...p[f.id],monthly_goal:e.target.value}}))} style={S.ii}/></div>
                <div><div style={S.label}>Target Date</div><input type="date" value={ed.due_date||""} onChange={e=>setEditSavingsBufs(p=>({...p,[f.id]:{...p[f.id],due_date:e.target.value}}))} style={S.ii}/></div>
              </div>
            </>):(<>
              <div style={{...S.row,marginBottom:10}}>
                <div style={{display:"flex",alignItems:"center",gap:10,flex:1,minWidth:0}}>
                  <div style={{width:38,height:38,borderRadius:10,background:(f.color||"#22c55e")+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{f.icon}</div>
                  <div style={{minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:13,fontWeight:500}}>{f.name}</span>{done&&<span style={S.chip("#22c55e")}>complete</span>}{f.fund_type==="emergency"&&!done&&<span style={S.chip("#60a5fa")}>priority</span>}</div>
                    {f.notes&&<div style={{fontSize:11,color:"var(--color-text-tertiary)",marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.notes}</div>}
                  </div>
                </div>
                <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:2,flexShrink:0}}>
                  <div style={{fontSize:15,fontWeight:500,color:f.color||"#22c55e"}}>{fmt(Number(f.saved))}</div>
                  <div style={S.sm}>of {fmt(Number(f.target))}</div>
                  <button onClick={()=>removeFund(f.id)} style={{background:"none",border:"none",cursor:"pointer",color:"var(--color-text-tertiary)",fontSize:14,lineHeight:1,padding:0,width:"auto"}}>×</button>
                </div>
              </div>
              <Bar pct={pct} color={f.color||"#22c55e"} h={7}/>
              <div style={{display:"flex",gap:8,marginTop:8,flexWrap:"wrap"}}>
                <span style={S.sm}>{pct.toFixed(0)}% funded</span>
                {ml!==null&&!done&&<span style={S.sm}>· ~{ml} mo at {fmt(Number(f.monthly_goal))}/mo</span>}
                {f.due_date&&<span style={S.sm}>· Due {new Date(f.due_date+"T00:00:00").toLocaleDateString("en-US",{month:"short",year:"numeric"})}</span>}
              </div>
            </>)}
          </div>);
        })}
        <div style={{...S.row,margin:"8px 0 4px"}}><div style={{flex:1,height:"0.5px",background:"var(--color-border-tertiary)"}}/><span style={{...S.sm,padding:"0 10px"}}>log a transfer</span><div style={{flex:1,height:"0.5px",background:"var(--color-border-tertiary)"}}/></div>
        <div style={S.card}>
          <div style={{fontSize:14,fontWeight:500,marginBottom:6}}>Record Savings Transfer</div>
          <div style={{...S.sm,color:"var(--color-text-tertiary)",marginBottom:12,lineHeight:1.5}}>Deducts from your "Savings" budget category automatically.</div>
          <span style={S.label}>Fund</span>
          <select value={logFundId} onChange={e=>setLogFundId(e.target.value)} style={S.inp}><option value="">Choose fund…</option>{savings.filter(f=>Number(f.saved)<Number(f.target)).map(f=><option key={f.id} value={f.id}>{f.icon} {f.name} — {fmt(Number(f.target)-Number(f.saved))} to go</option>)}</select>
          <span style={S.label}>Amount Transferred</span>
          <input type="number" placeholder="0.00" value={logSavingsAmt} onChange={e=>setLogSavingsAmt(e.target.value)} style={S.inp}/>
          <span style={S.label}>Note (optional)</span>
          <input type="text" placeholder="e.g. Moved from checking" value={logSavingsNote} onChange={e=>setLogSavingsNote(e.target.value)} style={S.inp}/>
          <button onClick={logSavingsTransfer} style={{width:"100%"}}>Log Transfer</button>
        </div>
        {savingsLog.length>0&&(<><div style={S.sect}>Transfer History</div>{savingsLog.slice(0,10).map(e=><div key={e.id} style={{...S.card,padding:"10px 14px"}}><div style={S.row}><div><div style={{fontSize:13,fontWeight:500}}>{e.fund_name}</div>{e.note&&<div style={S.sm}>{e.note}</div>}<div style={{fontSize:10,color:"var(--color-text-tertiary)",marginTop:2}}>{e.logged_by} · {new Date(e.created_at||Date.now()).toLocaleDateString("en-US",{month:"short",day:"numeric"})}</div></div><span style={{fontSize:14,fontWeight:500,color:"#22c55e",fontVariantNumeric:"tabular-nums"}}>+{fmt(Number(e.amount))}</span></div></div>)}</>)}
      </>)}

      </div>

      {/* ── Modals ── */}
      {addingMonth&&<ModalWrap onClose={()=>setAddingMonth(false)}><div style={{fontSize:16,fontWeight:500,marginBottom:16}}>Add Past Month</div><span style={S.label}>Select Month</span><select value={newMonthKey} onChange={e=>setNewMonthKey(e.target.value)} style={{...S.inp,marginBottom:16}}><option value="">Choose…</option>{(()=>{const opts=[];for(let y=2024;y<=2027;y++)for(let m=1;m<=12;m++){const k=`${y}-${String(m).padStart(2,"0")}`;if(!allMonths.includes(k))opts.push(<option key={k} value={k}>{MONTHS[m-1]} {y}</option>);}return opts;})()}</select><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><button onClick={()=>setAddingMonth(false)}>Cancel</button><button onClick={addPastMonth} style={{background:"var(--color-text-primary)",color:"var(--color-background-primary)",fontWeight:500}}>Add Month</button></div></ModalWrap>}
      {addingCat&&<ModalWrap onClose={()=>setAddingCat(false)}><div style={{fontSize:16,fontWeight:500,marginBottom:16}}>New Budget Category</div><div style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:8,marginBottom:12,alignItems:"center"}}><select value={newCat.icon} onChange={e=>setNewCat(p=>({...p,icon:e.target.value}))} style={{fontSize:20,padding:"4px 6px",borderRadius:8,border:"0.5px solid var(--color-border-secondary)",background:"var(--color-background-secondary)",fontFamily:"inherit",width:"auto"}}>{EMOJI_OPTIONS.map(e=><option key={e} value={e}>{e}</option>)}</select><input placeholder="Category name" value={newCat.category} onChange={e=>setNewCat(p=>({...p,category:e.target.value}))} style={{fontSize:14,marginBottom:0}}/></div><div style={S.fieldRow}><div><span style={S.label}>Budget $</span><input type="number" placeholder="0.00" value={newCat.budgeted} onChange={e=>setNewCat(p=>({...p,budgeted:e.target.value}))} style={S.ii}/></div><div><span style={S.label}>Due Date</span><input placeholder="e.g. 15th" value={newCat.due_date} onChange={e=>setNewCat(p=>({...p,due_date:e.target.value}))} style={S.ii}/></div></div><div style={{marginBottom:14}}><span style={S.label}>Group</span><select value={newCat.group_name} onChange={e=>setNewCat(p=>({...p,group_name:e.target.value}))} style={{...S.ii,fontSize:14,padding:"8px 12px",borderRadius:8}}>{GROUPS.map(g=><option key={g} value={g}>{g}</option>)}</select></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><button onClick={()=>setAddingCat(false)}>Cancel</button><button onClick={addCategory} style={{background:"var(--color-text-primary)",color:"var(--color-background-primary)",fontWeight:500}}>Add</button></div></ModalWrap>}
      {addingFund&&<ModalWrap onClose={()=>setAddingFund(false)}><div style={{fontSize:16,fontWeight:500,marginBottom:16}}>New Savings Fund</div><div style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:8,marginBottom:12,alignItems:"center"}}><select value={newFund.icon} onChange={e=>setNewFund(p=>({...p,icon:e.target.value}))} style={{fontSize:20,padding:"4px 6px",borderRadius:8,border:"0.5px solid var(--color-border-secondary)",background:"var(--color-background-secondary)",fontFamily:"inherit",width:"auto"}}>{FUND_ICONS.map(ic=><option key={ic} value={ic}>{ic}</option>)}</select><input placeholder="Fund name" value={newFund.name} onChange={e=>setNewFund(p=>({...p,name:e.target.value}))} style={{fontSize:14,marginBottom:0}}/></div><div style={{marginBottom:10}}><span style={S.label}>Color</span><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{FUND_COLORS.map(c=><div key={c} onClick={()=>setNewFund(p=>({...p,color:c}))} style={{width:24,height:24,borderRadius:"50%",background:c,cursor:"pointer",border:newFund.color===c?"3px solid var(--color-text-primary)":"3px solid transparent"}}/>)}</div></div><div style={S.fieldRow}><div><span style={S.label}>Target $</span><input type="number" placeholder="1000" value={newFund.target} onChange={e=>setNewFund(p=>({...p,target:e.target.value}))} style={S.ii}/></div><div><span style={S.label}>Already Saved $</span><input type="number" placeholder="0" value={newFund.saved} onChange={e=>setNewFund(p=>({...p,saved:e.target.value}))} style={S.ii}/></div></div><div style={S.fieldRow}><div><span style={S.label}>Monthly Goal $</span><input type="number" placeholder="50" value={newFund.monthly_goal} onChange={e=>setNewFund(p=>({...p,monthly_goal:e.target.value}))} style={S.ii}/></div><div><span style={S.label}>Target Date</span><input type="date" value={newFund.due_date} onChange={e=>setNewFund(p=>({...p,due_date:e.target.value}))} style={S.ii}/></div></div><div style={{marginBottom:10}}><span style={S.label}>Type</span><select value={newFund.fund_type} onChange={e=>setNewFund(p=>({...p,fund_type:e.target.value}))} style={{...S.ii,fontSize:14,padding:"8px 12px",borderRadius:8}}>{FUND_TYPES.map(t=><option key={t} value={t}>{t}</option>)}</select></div><div style={{marginBottom:16}}><span style={S.label}>Notes</span><input placeholder="What is this for?" value={newFund.notes} onChange={e=>setNewFund(p=>({...p,notes:e.target.value}))} style={{...S.ii,fontSize:14,padding:"8px 12px",borderRadius:8}}/></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><button onClick={()=>setAddingFund(false)}>Cancel</button><button onClick={addFund} style={{background:"var(--color-text-primary)",color:"var(--color-background-primary)",fontWeight:500}}>Add Fund</button></div></ModalWrap>}

      {/* Import modal — called as a function, never as <ImportModal /> */}
      {showImportModal && ImportModal()}

      {/* Bottom Nav */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:"var(--color-background-primary)",borderTop:"0.5px solid var(--color-border-tertiary)",display:"flex",zIndex:100,paddingBottom:"env(safe-area-inset-bottom,0)"}}>
        {TABS.map(n=>(
          <button key={n.k} onClick={()=>{setTab(n.k);if(n.k!=="budget"&&n.k!=="home")setViewMonth(CUR);}} style={S.tabBtn(tab===n.k)}>
            {n.k==="log"
              ?<div style={{width:42,height:42,borderRadius:14,background:"var(--color-text-primary)",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--color-background-primary)",marginTop:-20,flexShrink:0}}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></div>
              :<div>{TAB_ICONS[n.k]?.(tab===n.k)}</div>
            }
            <span>{n.label}</span>
          </button>
        ))}
      </div>

      {/* Toast */}
      {toast&&<div style={{position:"fixed",bottom:72,left:"50%",transform:"translateX(-50%)",background:toast.type==="err"?"var(--color-background-danger)":"var(--color-background-success)",color:toast.type==="err"?"var(--color-text-danger)":"var(--color-text-success)",border:`0.5px solid ${toast.type==="err"?"var(--color-border-danger)":"var(--color-border-success)"}`,padding:"10px 18px",borderRadius:10,fontSize:13,fontWeight:500,whiteSpace:"nowrap",zIndex:300,maxWidth:"86vw",textAlign:"center",boxShadow:"0 4px 24px rgba(0,0,0,.15)"}}>{toast.msg}</div>}
    </div>
  );
}
