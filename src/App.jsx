import { useState, useMemo, useEffect, useRef, useCallback } from "react";

// ── Supabase config ───────────────────────────────────────────────────────────
const SUPABASE_URL = "https://wxmhcqpnrzhafyfgkine.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4bWhjcXBucnpoYWZ5ZmdraW5lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MjEwMTEsImV4cCI6MjA5MzM5NzAxMX0.KDxJTx87HTbkPrf-17fzaY4reXxmn5mbx2KhWu9cyL0";

const db = {
  async get(table, filters = {}) {
    let url = `${SUPABASE_URL}/rest/v1/${table}?select=*`;
    Object.entries(filters).forEach(([k, v]) => { url += `&${k}=eq.${v}`; });
    const r = await fetch(url, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } });
    return r.json();
  },
  async upsert(table, data) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify(Array.isArray(data) ? data : [data]),
    });
    return r.json();
  },
  async update(table, id, idField = "id", data) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${idField}=eq.${id}`, {
      method: "PATCH",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify(data),
    });
    return r.json();
  },
  async delete(table, id, idField = "id") {
    await fetch(`${SUPABASE_URL}/rest/v1/${table}?${idField}=eq.${id}`, {
      method: "DELETE",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    });
  },
  subscribe(table, callback) {
    // Polling fallback every 8 seconds for real-time feel
    const interval = setInterval(callback, 8000);
    return () => clearInterval(interval);
  }
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
const USERS = [
  { name: "Jono", pin: "1728" },
  { name: "Yulissa", pin: "5130" },
];

const fmt=n=>"$"+Math.abs(n).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
const fmtK=n=>{const a=Math.abs(n);return a>=1000?"$"+(a/1000).toFixed(1)+"k":fmt(n);};
const today=new Date();
const CUR=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}`;
const monthLabel=k=>{const[y,m]=k.split("-");return`${MONTHS[parseInt(m)-1]} ${y}`;};

// ── Sub-components ────────────────────────────────────────────────────────────
function Bar({pct,color="#22c55e",h=5}){
  const c=pct>100?"#ef4444":pct>85?"#f59e0b":color;
  return <div style={{background:"rgba(128,128,128,.12)",borderRadius:99,height:h,overflow:"hidden"}}><div style={{width:`${Math.min(pct,100)}%`,height:"100%",background:c,borderRadius:99,transition:"width .6s"}}/></div>;
}
function Ring({pct,size=120,stroke=11,color="#22c55e",children}){
  const r=(size-stroke)/2,c=2*Math.PI*r,d=Math.min(pct/100,1)*c;
  return(<div style={{position:"relative",width:size,height:size,flexShrink:0}}>
    <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(128,128,128,.12)" strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={`${d} ${c-d}`} strokeLinecap="round" style={{transition:"stroke-dasharray .8s"}}/>
    </svg>
    <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>{children}</div>
  </div>);
}
const TAB_ICONS={
  home:a=><svg width="22" height="22" viewBox="0 0 24 24" fill={a?"currentColor":"none"} stroke="currentColor" strokeWidth={a?0:2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 12L12 3l9 9"/><path d="M9 21V12h6v9"/><path d="M3 12v9h18V12"/></svg>,
  budget:a=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a?2.4:2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="9" x2="9" y2="20"/></svg>,
  debts:a=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a?2.4:2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 3"/></svg>,
  save:a=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a?2.4:2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
};
const TABS=[{k:"home",label:"Home"},{k:"budget",label:"Budget"},{k:"log",label:"Log"},{k:"debts",label:"Debts"},{k:"save",label:"Save"}];
const TAB_TITLES={home:"Overview",budget:"Monthly Budget",log:"Log Expense",debts:"Debt Tracker",save:"Savings Goals"};

// ── PIN Screen ────────────────────────────────────────────────────────────────
function PinScreen({onLogin}){
  const[digits,setDigits]=useState([]);
  const[error,setError]=useState("");
  const[popKey,setPopKey]=useState(null);

  function press(k){
    if(digits.length>=4)return;
    setPopKey(k);setTimeout(()=>setPopKey(null),220);
    const next=[...digits,String(k)];
    setDigits(next);setError("");
    if(next.length===4)setTimeout(()=>evaluate(next),150);
  }
  function del_(){setDigits(d=>d.slice(0,-1));setError("");}
  function evaluate(d){
    const code=d.join("");
    const user=USERS.find(u=>u.pin===code);
    if(user){setDigits([]);onLogin(user.name);}
    else{setError("Incorrect PIN. Try again.");setDigits([]);}
  }

  return(
    <div style={{position:"fixed",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,background:"var(--color-background-primary)",zIndex:500}}>
      <div style={{marginBottom:20}}>
        <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="56" height="56" rx="16" fill="var(--color-background-secondary)"/>
          <line x1="18" y1="22" x2="38" y2="22" stroke="var(--color-text-primary)" strokeWidth="2" strokeLinecap="round"/>
          <line x1="18" y1="28" x2="32" y2="28" stroke="var(--color-text-secondary)" strokeWidth="2" strokeLinecap="round"/>
          <line x1="18" y1="34" x2="28" y2="34" stroke="var(--color-text-tertiary)" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>
      <div style={{fontSize:22,fontWeight:600,marginBottom:4}}>Brandon Family Budget</div>
      <div style={{fontSize:14,color:"var(--color-text-secondary)",marginBottom:32}}>Enter your PIN</div>
      <div style={{display:"flex",gap:16,marginBottom:error?12:36}}>
        {[0,1,2,3].map(i=><div key={i} style={{width:16,height:16,borderRadius:"50%",border:`2px solid ${digits.length>i?"#22c55e":"var(--color-border-primary)"}`,background:digits.length>i?"#22c55e":"transparent",transition:"all .15s"}}/>)}
      </div>
      {error&&<div style={{fontSize:12,color:"#ef4444",marginBottom:20,textAlign:"center"}}>{error}</div>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,72px)",gap:12}}>
        {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((k,i)=>(
          <button key={i} onClick={()=>k==="⌫"?del_():k!==""?press(k):null}
            style={{height:72,borderRadius:14,border:k===""?"none":"0.5px solid var(--color-border-secondary)",background:k===""?"transparent":"var(--color-background-primary)",fontSize:k==="⌫"?22:24,fontWeight:500,cursor:k===""?"default":"pointer",opacity:k===""?0:1,width:72,transition:"transform .1s",fontFamily:"inherit",color:"var(--color-text-primary)"}}
            onPointerDown={()=>{if(k!=="")document.activeElement?.blur();}}>
            {k}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App(){
  const[user,setUser]=useState(null);
  const[tab,setTab]=useState("home");
  const[viewMonth,setViewMonth]=useState(CUR);
  const[filterGroup,setFilterGroup]=useState("all");
  const[toast,setToast]=useState(null);
  const[loading,setLoading]=useState(true);
  const[syncing,setSyncing]=useState(false);

  // Data state (all synced from Supabase)
  const[items,setItems]=useState([]);
  const[debts,setDebts]=useState([]);
  const[savings,setSavings]=useState([]);
  const[savingsLog,setSavingsLog]=useState([]);
  const[allMonths,setAllMonths]=useState([CUR]);
  const[income]=useState(INCOME);

  // Form state
  const[editMode,setEditMode]=useState(false);
  const[editBufs,setEditBufs]=useState({});
  const[editDebtMode,setEditDebtMode]=useState(false);
  const[editDebtBufs,setEditDebtBufs]=useState({});
  const[editSavingsMode,setEditSavingsMode]=useState(false);
  const[editSavingsBufs,setEditSavingsBufs]=useState({});
  const[logCat,setLogCat]=useState("");
  const[logAmt,setLogAmt]=useState("");
  const[logNote,setLogNote]=useState("");
  const[debtId,setDebtId]=useState("");
  const[debtAmt,setDebtAmt]=useState("");
  const[logFundId,setLogFundId]=useState("");
  const[logSavingsAmt,setLogSavingsAmt]=useState("");
  const[logSavingsNote,setLogSavingsNote]=useState("");
  const[addingMonth,setAddingMonth]=useState(false);
  const[newMonthKey,setNewMonthKey]=useState("");
  const[addingCat,setAddingCat]=useState(false);
  const[newCat,setNewCat]=useState({category:"",budgeted:"",icon:"•••",group_name:"other",due_date:"–"});
  const[addingFund,setAddingFund]=useState(false);
  const[newFund,setNewFund]=useState({name:"",icon:"🏦",target:"",saved:"",monthly_goal:"",due_date:"",color:"#22c55e",fund_type:"sinking",notes:""});
  const[showAI,setShowAI]=useState(false);
  const[showSvD,setShowSvD]=useState(false);
  const[aiLoading,setAiLoading]=useState(false);
  const[aiResponse,setAiResponse]=useState("");
  const[aiQuestion,setAiQuestion]=useState("");
  const aiRef=useRef(null);

  const showToast=(msg,type="ok")=>{setToast({msg,type});setTimeout(()=>setToast(null),2800);};

  // ── Load data ───────────────────────────────────────────────────────────────
  async function loadAll(){
    try{
      const [dbItems,dbDebts,dbSavings,dbLog]=await Promise.all([
        db.get("budget_items",{month_key:viewMonth}),
        db.get("debts"),
        db.get("savings_funds"),
        db.get("savings_log"),
      ]);
      if(dbItems?.length) setItems(dbItems); else await seedItems();
      if(dbDebts?.length) setDebts(dbDebts); else await seedDebts();
      if(dbSavings?.length) setSavings(dbSavings); else await seedSavings();
      if(dbLog?.length) setSavingsLog(dbLog);
      // Get all months that have data
      const allM=await db.get("budget_items");
      const months=[...new Set((allM||[]).map(x=>x.month_key))].sort().reverse();
      if(months.length) setAllMonths(months);
    }catch(e){showToast("Connection error — check internet","err");}
    setLoading(false);
  }

  async function seedItems(){
    const rows=DEFAULT_ITEMS.map(b=>({...b,month_key:CUR}));
    const res=await db.upsert("budget_items",rows);
    if(res?.length) setItems(res);
  }
  async function seedDebts(){
    const res=await db.upsert("debts",DEFAULT_DEBTS);
    if(res?.length) setDebts(res);
  }
  async function seedSavings(){
    const res=await db.upsert("savings_funds",DEFAULT_SAVINGS);
    if(res?.length) setSavings(res);
  }

  useEffect(()=>{if(user){loadAll();}});
  useEffect(()=>{if(user){setLoading(true);loadAll();}}, [viewMonth,user]);

  // Polling for real-time sync
  useEffect(()=>{
    if(!user) return;
    const interval=setInterval(()=>{
      db.get("budget_items",{month_key:viewMonth}).then(r=>{if(r?.length)setItems(r);});
      db.get("debts").then(r=>{if(r?.length)setDebts(r);});
      db.get("savings_funds").then(r=>{if(r?.length)setSavings(r);});
    },10000);
    return()=>clearInterval(interval);
  },[user,viewMonth]);

  useEffect(()=>{if(aiRef.current)aiRef.current.scrollTop=aiRef.current.scrollHeight;},[aiResponse]);

  // ── Computed ────────────────────────────────────────────────────────────────
  const curItems=items.filter(b=>b.month_key===viewMonth);
  const totalSpent=useMemo(()=>curItems.reduce((s,b)=>s+Number(b.spent),0),[curItems]);
  const totalBudgeted=useMemo(()=>curItems.reduce((s,b)=>s+Number(b.budgeted),0),[curItems]);
  const remaining=income-totalSpent;
  const totalDebt=useMemo(()=>debts.reduce((s,d)=>s+Number(d.total),0),[debts]);
  const totalPaid=useMemo(()=>debts.reduce((s,d)=>s+Number(d.paid),0),[debts]);
  const collectionsAmt=useMemo(()=>debts.filter(d=>d.collections).reduce((s,d)=>s+(Number(d.total)-Number(d.paid)),0),[debts]);
  const totalSaved=savings.reduce((s,f)=>s+Number(f.saved),0);
  const totalTarget=savings.reduce((s,f)=>s+Number(f.target),0);
  const overBudget=curItems.filter(b=>Number(b.spent)>Number(b.budgeted)&&Number(b.budgeted)>0);
  const pendingBills=curItems.filter(b=>Number(b.spent)===0&&Number(b.budgeted)>0);
  const filtered=filterGroup==="all"?curItems:curItems.filter(b=>b.group_name===filterGroup);
  const prevCat=curItems.find(b=>b.id===+logCat);
  const projSpend=prevCat?Number(prevCat.spent)+(+logAmt||0):0;
  const willOver=prevCat&&projSpend>Number(prevCat.budgeted)&&Number(prevCat.budgeted)>0;
  const highAPR=[...debts].filter(d=>d.apr>0&&d.paid<d.total).sort((a,b)=>b.apr-a.apr)[0];
  const isCur=viewMonth===CUR;
  const spentPct=(totalSpent/income)*100;
  const ringColor=spentPct>90?"#ef4444":spentPct>75?"#f59e0b":"#22c55e";
  const monthlyCommitted=savings.reduce((s,f)=>s+Number(f.monthly_goal),0);

  // ── Actions ─────────────────────────────────────────────────────────────────
  async function logExpense(){
    if(!logCat||!logAmt||isNaN(+logAmt)||+logAmt<=0)return showToast("Fill in category & amount","err");
    const item=curItems.find(b=>b.id===+logCat);if(!item)return;
    const newSpent=+(Number(item.spent)+(+logAmt)).toFixed(2);
    setSyncing(true);
    await db.update("budget_items",item.id,"id",{spent:newSpent});
    setItems(prev=>prev.map(b=>b.id===item.id?{...b,spent:newSpent}:b));
    setSyncing(false);
    showToast(`${fmt(+logAmt)} → ${item.category}`);
    setLogCat("");setLogAmt("");setLogNote("");
  }

  async function payDebt(){
    if(!debtId||!debtAmt||isNaN(+debtAmt)||+debtAmt<=0)return showToast("Fill debt & amount","err");
    const debt=debts.find(d=>d.id===debtId);if(!debt)return;
    const newPaid=Math.min(+(Number(debt.paid)+(+debtAmt)).toFixed(2),Number(debt.total));
    setSyncing(true);
    await db.update("debts",debtId,"id",{p
