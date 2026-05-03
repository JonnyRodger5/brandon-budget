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
    await db.update("debts",debtId,"id",{paid:newPaid});
    setDebts(prev=>prev.map(d=>d.id===debtId?{...d,paid:newPaid}:d));
    setSyncing(false);
    showToast(`Payment logged for ${debt.name}`);
    setDebtId("");setDebtAmt("");
  }

  async function logSavingsTransfer(){
    if(!logFundId||!logSavingsAmt||isNaN(+logSavingsAmt)||+logSavingsAmt<=0)return showToast("Pick a fund and enter amount","err");
    const fund=savings.find(f=>f.id===logFundId);if(!fund)return;
    const newSaved=+(Number(fund.saved)+(+logSavingsAmt)).toFixed(2);
    const savItem=curItems.find(b=>b.category==="Savings");
    setSyncing(true);
    await db.update("savings_funds",logFundId,"id",{saved:newSaved});
    if(savItem) await db.update("budget_items",savItem.id,"id",{spent:+(Number(savItem.spent)+(+logSavingsAmt)).toFixed(2)});
    const entry={id:"sl"+Date.now(),fund_id:logFundId,fund_name:fund.name,amount:+logSavingsAmt,note:logSavingsNote,logged_by:user};
    await db.upsert("savings_log",[entry]);
    setSavings(prev=>prev.map(f=>f.id===logFundId?{...f,saved:newSaved}:f));
    if(savItem) setItems(prev=>prev.map(b=>b.id===savItem.id?{...b,spent:+(Number(b.spent)+(+logSavingsAmt)).toFixed(2)}:b));
    setSavingsLog(prev=>[entry,...prev]);
    setSyncing(false);
    showToast(`${fmt(+logSavingsAmt)} added to ${fund.name}`);
    setLogFundId("");setLogSavingsAmt("");setLogSavingsNote("");
  }

  async function saveEditBudget(){
    const updates=curItems.map(b=>({...b,budgeted:+(parseFloat(editBufs[b.id]?.budgeted)||0).toFixed(2),category:editBufs[b.id]?.category||b.category,icon:editBufs[b.id]?.icon||b.icon,group_name:editBufs[b.id]?.group_name||b.group_name,due_date:editBufs[b.id]?.due_date||b.due_date||"–"}));
    setSyncing(true);
    await db.upsert("budget_items",updates);
    setItems(prev=>prev.map(b=>{const u=updates.find(x=>x.id===b.id);return u||b;}));
    setSyncing(false);
    setEditMode(false);showToast("Budget saved");
  }

  async function addCategory(){
    if(!newCat.category||!newCat.budgeted)return showToast("Name and amount required","err");
    const item={...newCat,id:Date.now(),budgeted:+(parseFloat(newCat.budgeted)||0).toFixed(2),spent:0,month_key:CUR};
    setSyncing(true);
    await db.upsert("budget_items",[item]);
    setItems(prev=>[...prev,item]);
    setSyncing(false);
    setAddingCat(false);setNewCat({category:"",budgeted:"",icon:"•••",group_name:"other",due_date:"–"});
    showToast(`${item.category} added`);
  }

  async function removeBudgetItem(id,name){
    if(!confirm(`Remove "${name}"?`))return;
    setSyncing(true);
    await db.delete("budget_items",id,"id");
    setItems(prev=>prev.filter(b=>b.id!==id));
    setSyncing(false);showToast(`${name} removed`);
  }

  async function saveEditDebts(){
    const updates=debts.map(d=>{const e=editDebtBufs[d.id];if(!e)return d;return{...d,name:e.name,total:+(parseFloat(e.total)||0).toFixed(2),paid:+(parseFloat(e.paid)||0).toFixed(2),collections:e.collections,apr:+(parseFloat(e.apr)||0).toFixed(2)};});
    setSyncing(true);
    await db.upsert("debts",updates);
    setDebts(updates);setSyncing(false);setEditDebtMode(false);showToast("Debts updated");
  }

  async function addDebt(){
    const nd={id:"d"+Date.now(),name:"New Debt",total:0,paid:0,collections:false,apr:0};
    setSyncing(true);
    await db.upsert("debts",[nd]);
    setDebts(prev=>[...prev,nd]);
    setSyncing(false);
    const m={};[...debts,nd].forEach(d=>{m[d.id]={total:String(d.total),paid:String(d.paid),name:d.name,collections:d.collections,apr:String(d.apr||0)};});
    setEditDebtBufs(m);setEditDebtMode(true);
  }

  async function removeDebt(id,name){
    if(!confirm(`Remove "${name}"?`))return;
    setSyncing(true);
    await db.delete("debts",id,"id");
    setDebts(prev=>prev.filter(d=>d.id!==id));
    setSyncing(false);showToast(`${name} removed`);
  }

  async function saveEditSavings(){
    const updates=savings.map(f=>{const e=editSavingsBufs[f.id];if(!e)return f;return{...f,name:e.name,icon:e.icon,target:+(parseFloat(e.target)||0).toFixed(2),saved:+(parseFloat(e.saved)||0).toFixed(2),monthly_goal:+(parseFloat(e.monthly_goal)||0).toFixed(2),due_date:e.due_date,color:e.color,fund_type:e.fund_type,notes:e.notes};});
    setSyncing(true);
    await db.upsert("savings_funds",updates);
    setSavings(updates);setSyncing(false);setEditSavingsMode(false);showToast("Savings updated");
  }

  async function addFund(){
    if(!newFund.name||!newFund.target)return showToast("Name and target required","err");
    const f={...newFund,id:"s"+Date.now(),target:+(parseFloat(newFund.target)||0).toFixed(2),saved:+(parseFloat(newFund.saved)||0).toFixed(2),monthly_goal:+(parseFloat(newFund.monthly_goal)||0).toFixed(2)};
    setSyncing(true);
    await db.upsert("savings_funds",[f]);
    setSavings(prev=>[...prev,f]);
    setSyncing(false);setAddingFund(false);showToast(`${f.name} added`);
  }

  async function removeFund(id){
    setSyncing(true);
    await db.delete("savings_funds",id,"id");
    setSavings(prev=>prev.filter(f=>f.id!==id));
    setSyncing(false);showToast("Fund removed");
  }

  async function addPastMonth(){
    if(!newMonthKey||allMonths.includes(newMonthKey))return showToast("Month already exists","err");
    const rows=DEFAULT_ITEMS.map(b=>({...b,month_key:newMonthKey,spent:0}));
    setSyncing(true);
    await db.upsert("budget_items",rows);
    setAllMonths(prev=>[...prev,newMonthKey].sort().reverse());
    setSyncing(false);setViewMonth(newMonthKey);setAddingMonth(false);
    showToast(`${monthLabel(newMonthKey)} added`);
  }

  async function askAI(q2){
    const q=q2||aiQuestion;if(!q.trim())return;
    setAiLoading(true);setAiResponse("");setShowAI(true);setAiQuestion("");
    const ds=debts.map(d=>`- ${d.name}: $${(Number(d.total)-Number(d.paid)).toFixed(2)}${d.apr>0?`, ${d.apr}% APR`:""}${d.collections?" (collections)":""}`).join("\n");
    const sys=`You are a certified financial advisor for the Brandon family. Use Debt Avalanche, Snowball, and collection negotiation strategies. Be specific and empathetic, under 300 words. Reference CFPB, NerdWallet, Experian, Dave Ramsey.\n\nDebts:\n${ds}\nIncome: $${income}/mo\nSurplus: $${Math.max(income-totalSpent,0).toFixed(2)}/mo`;
    try{
      const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:sys,messages:[{role:"user",content:q}]})});
      const data=await r.json();
      setAiResponse(data.content?.map(c=>c.text||"").join("")||"Could not generate a response.");
    }catch(e){setAiResponse("Network error: "+e.message);}
    setAiLoading(false);
  }

  // ── Styles ──────────────────────────────────────────────────────────────────
  const S={
    card:{background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:"var(--border-radius-lg)",padding:"14px 16px",marginBottom:10},
    label:{fontSize:11,fontWeight:500,letterSpacing:.8,textTransform:"uppercase",color:"var(--color-text-tertiary)",marginBottom:4,display:"block"},
    sm:{fontSize:12,color:"var(--color-text-secondary)"},
    row:{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8},
    chip:c=>({fontSize:10,fontWeight:500,padding:"2px 8px",borderRadius:99,background:c+"22",color:c,flexShrink:0}),
    sect:{fontSize:11,fontWeight:500,letterSpacing:1,textTransform:"uppercase",color:"var(--color-text-tertiary)",padding:"12px 0 6px"},
    inp:{width:"100%",marginBottom:10},
    tabBtn:a=>({flex:1,padding:"10px 4px 12px",background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:4,color:a?"var(--color-text-primary)":"var(--color-text-tertiary)",fontFamily:"inherit",fontSize:9,fontWeight:a?500:400,letterSpacing:.5,textTransform:"uppercase",borderTop:a?"2px solid var(--color-text-primary)":"2px solid transparent",transition:"all .15s"}),
    fieldRow:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8},
    ii:{fontSize:12,padding:"3px 7px",borderRadius:6,border:"0.5px solid var(--color-border-secondary)",background:"var(--color-background-secondary)",color:"var(--color-text-primary)",fontFamily:"inherit",width:"100%"},
  };

  if(!user) return <PinScreen onLogin={n=>{setUser(n);showToast(`Welcome, ${n}!`);}}/>;
  if(loading) return <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100vh",gap:12}}><div style={{fontSize:36}}>💰</div><div style={{fontSize:16,fontWeight:500}}>Loading your finances…</div><div style={{fontSize:12,color:"var(--color-text-tertiary)"}}>Connecting to database</div></div>;

  const ModalWrap=({onClose,children})=>(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",display:"flex",alignItems:"flex-end",zIndex:200}} onClick={onClose}>
      <div style={{width:"100%",background:"var(--color-background-primary)",borderRadius:"20px 20px 0 0",padding:"24px 20px 40px",maxHeight:"85dvh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>{children}</div>
    </div>
  );

  return(
    <div style={{fontFamily:"system-ui,-apple-system,sans-serif",color:"var(--color-text-primary)",paddingBottom:88}}>

      {/* Sync indicator */}
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
        <div style={S.card}>
          <div style={{fontSize:14,fontWeight:500,marginBottom:14}}>Log Expense</div>
          <span style={S.label}>Category</span>
          <select value={logCat} onChange={e=>setLogCat(e.target.value)} style={S.inp}><option value="">Choose…</option>{curItems.map(b=><option key={b.id} value={b.id}>{b.icon} {b.category} — {fmt(Number(b.budgeted))}</option>)}</select>
          <span style={S.label}>Amount</span>
          <input type="number" placeholder="0.00" value={logAmt} onChange={e=>setLogAmt(e.target.value)} style={S.inp}/>
          <span style={S.label}>Note (optional)</span>
          <input type="text" placeholder="e.g. Fry's grocery run" value={logNote} onChange={e=>setLogNote(e.target.value)} style={S.inp}/>
          {prevCat&&logAmt&&+logAmt>0&&(<div style={{...S.card,background:willOver?"var(--color-background-danger)":"var(--color-background-success)",borderColor:willOver?"var(--color-border-danger)":"var(--color-border-success)",marginBottom:12}}>
            <div style={{...S.row,marginBottom:6}}><span style={S.sm}>Current</span><span style={{...S.sm,fontVariantNumeric:"tabular-nums"}}>{fmt(Number(prevCat.spent))}</span></div>
            <div style={{...S.row,marginBottom:6}}><span style={S.sm}>After</span><span style={{fontSize:14,fontWeight:500,color:willOver?"#ef4444":"#22c55e",fontVariantNumeric:"tabular-nums"}}>{fmt(projSpend)}</span></div>
            <div style={{...S.row,marginBottom:8}}><span style={S.sm}>Budget</span><span style={{...S.sm,fontVariantNumeric:"tabular-nums"}}>{fmt(Number(prevCat.budgeted))}</span></div>
            <Bar pct={(projSpend/Number(prevCat.budgeted))*100} h={5}/>
            {willOver&&<div style={{fontSize:12,color:"#ef4444",marginTop:8,fontWeight:500}}>Will exceed by {fmt(projSpend-Number(prevCat.budgeted))}</div>}
          </div>)}
          <button onClick={logExpense} style={{width:"100%"}}>Log Expense</button>
        </div>
        <div style={{...S.row,margin:"6px 0"}}><div style={{flex:1,height:"0.5px",background:"var(--color-border-tertiary)"}}/><span style={{...S.sm,padding:"0 10px"}}>debt payment</span><div style={{flex:1,height:"0.5px",background:"var(--color-border-tertiary)"}}/></div>
        <div style={S.card}>
          <div style={{fontSize:14,fontWeight:500,marginBottom:14}}>Record Debt Payment</div>
          <span style={S.label}>Account</span>
          <select value={debtId} onChange={e=>setDebtId(e.target.value)} style={S.inp}><option value="">Choose…</option>{debts.filter(d=>Number(d.paid)<Number(d.total)).map(d=><option key={d.id} value={d.id}>{d.name} — {fmt(Number(d.total)-Number(d.paid))} left</option>)}</select>
          <span style={S.label}>Amount</span>
          <input type="number" placeholder="0.00" value={debtAmt} onChange={e=>setDebtAmt(e.target.value)} style={S.inp}/>
          <button onClick={payDebt} style={{width:"100%"}}>Record Payment</button>
        </div>
      </>)}

      {/* ── DEBTS ── */}
      {tab==="debts"&&(<>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
          <div style={{...S.card,background:"var(--color-background-danger)",borderColor:"var(--color-border-danger)"}}><div style={S.label}>Collections</div><div style={{fontSize:20,fontWeight:500,color:"#ef4444",letterSpacing:"-.5px"}}>{fmtK(collectionsAmt)}</div><div style={S.sm}>{((collectionsAmt/totalDebt)*100||0).toFixed(0)}% of total</div></div>
          <div style={S.card}><div style={S.label}>Still Owed</div><div style={{fontSize:20,fontWeight:500,letterSpacing:"-.5px"}}>{fmtK(totalDebt-totalPaid)}</div><div style={S.sm}>of {fmt(totalDebt)}</div></div>
        </div>

        {/* AI Advisor */}
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
              <button onClick={()=>askAI()} disabled={aiLoading||!aiQuestion.trim()} style={{padding:"8px 14px",borderRadius:8,border:"none",background:"#8b5cf6",color:"#fff",fontFamily:"inherit",fontSize:13,cursor:"pointer",fontWeight:500,opacity:aiLoading||!aiQuestion.trim()?0.5:1,width:"auto"}}>{aiLoading?"…":"Ask"}</button>
            </div>
            {(aiLoading||aiResponse)&&<div ref={aiRef} style={{background:"var(--color-background-secondary)",borderRadius:10,padding:"12px 14px",fontSize:13,lineHeight:1.7,maxHeight:300,overflowY:"auto",whiteSpace:"pre-wrap",border:"0.5px solid var(--color-border-tertiary)"}}>{aiLoading?"Analyzing your debt situation…":aiResponse}</div>}
            {aiResponse&&!aiLoading&&<button onClick={()=>setAiResponse("")} style={{marginTop:8,padding:"4px 10px",borderRadius:99,border:"0.5px solid var(--color-border-tertiary)",background:"transparent",color:"var(--color-text-tertiary)",fontFamily:"inherit",fontSize:11,cursor:"pointer",width:"auto"}}>Clear</button>}
          </div>)}
        </div>

        {/* Debt list */}
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
        {[...debts.filter(d=>d.collections),...debts.filter(d=>!d.collections)].map((d,idx)=>{
          const isCol=d.collections;
          const e=editDebtBufs[d.id]||{};
          const tot=editDebtMode?(+(parseFloat(e.total)||0)):Number(d.total);
          const pd=editDebtMode?(+(parseFloat(e.paid)||0)):Number(d.paid);
          const pct=tot>0?(pd/tot)*100:0,rem=tot-pd,done=rem<=0;
          if(!isCol&&idx===debts.filter(d=>d.collections).length) return [<div key="sect" style={S.sect}>Active Debts</div>,renderDebtCard(d,e,pct,rem,done,isCol)];
          return renderDebtCard(d,e,pct,rem,done,isCol);

          function renderDebtCard(d,e,pct,rem,done,isCol){return(<div key={d.id} style={{...S.card,borderLeft:`3px solid ${isCol?"#ef4444":done?"#22c55e":"var(--color-border-tertiary)"}`}}>
            {editDebtMode?(<>
              <input value={e.name||""} onChange={ev=>setEditDebtBufs(p=>({...p,[d.id]:{...p[d.id],name:ev.target.value}}))} style={{...S.ii,marginBottom:8,fontSize:13}}/>
              <div style={S.fieldRow}>
                <div><div style={S.label}>Total</div><div style={{display:"flex",gap:3,alignItems:"center"}}><span style={S.sm}>$</span><input type="number" value={e.total||""} onChange={ev=>setEditDebtBufs(p=>({...p,[d.id]:{...p[d.id],total:ev.target.value}}))} style={S.ii}/></div></div>
                <div><div style={S.label}>Paid</div><div style={{display:"flex",gap:3,alignItems:"center"}}><span style={S.sm}>$</span><input type="number" value={e.paid||""} onChange={ev=>setEditDebtBufs(p=>({...p,[d.id]:{...p[d.id],paid:ev.target.value}}))} style={S.ii}/></div></div>
              </div>
              <div style={{marginBottom:8}}><div style={S.label}>APR %</div><input type="number" value={e.apr||""} onChange={ev=>setEditDebtBufs(p=>({...p,[d.id]:{...p[d.id],apr:ev.target.value}}))} placeholder="0" style={S.ii}/></div>
              <label style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:"var(--color-text-secondary)",cursor:"pointer"}}><input type="checkbox" checked={e.collections??d.collections} onChange={ev=>setEditDebtBufs(p=>({...p,[d.id]:{...p[d.id],collections:ev.target.checked}}))}/> In collections</label>
            </>):(<>
              <div style={{...S.row,marginBottom:8}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:7}}><span style={{fontSize:13,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.name}</span>{done&&<span style={S.chip("#22c55e")}>paid off</span>}</div>
                  <div style={S.sm}>{pct.toFixed(0)}% paid{Number(d.apr)>0?` · ${d.apr}% APR`:""}</div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                  <span style={{fontSize:15,fontWeight:500,color:isCol?"#ef4444":done?"#22c55e":"var(--color-text-primary)"}}>{fmt(rem)}</span>
                  <button onClick={()=>removeDebt(d.id,d.name)} style={{background:"none",border:"none",cursor:"pointer",color:"var(--color-text-tertiary)",fontSize:18,lineHeight:1,padding:0,width:"auto"}}>×</button>
                </div>
              </div>
              <Bar pct={pct} color={isCol?"#ef4444":"#22c55e"} h={5}/>
            </>)}
          </div>);}
        }).flat()}
      </>)}

      {/* ── SAVE ── */}
      {tab==="save"&&(<>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
          <div style={{...S.card,background:"var(--color-background-success)",borderColor:"var(--color-border-success)"}}><div style={S.label}>Total Saved</div><div style={{fontSize:20,fontWeight:500,color:"#22c55e",letterSpacing:"-.5px"}}>{fmtK(totalSaved)}</div><div style={S.sm}>of {fmt(totalTarget)} goal</div></div>
          <div style={S.card}><div style={S.label}>Monthly Committed</div><div style={{fontSize:20,fontWeight:500,letterSpacing:"-.5px"}}>{fmtK(monthlyCommitted)}</div><div style={S.sm}>{fmt(Math.max(remaining-monthlyCommitted,0))} surplus left</div></div>
        </div>

        {/* Save vs Debt */}
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

        {/* Transfer form */}
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

      </div>{/* end content */}

      {/* Modals */}
      {addingMonth&&<ModalWrap onClose={()=>setAddingMonth(false)}><div style={{fontSize:16,fontWeight:500,marginBottom:16}}>Add Past Month</div><span style={S.label}>Select Month</span><select value={newMonthKey} onChange={e=>setNewMonthKey(e.target.value)} style={{...S.inp,marginBottom:16}}><option value="">Choose…</option>{(()=>{const opts=[];for(let y=2024;y<=2027;y++)for(let m=1;m<=12;m++){const k=`${y}-${String(m).padStart(2,"0")}`;if(!allMonths.includes(k))opts.push(<option key={k} value={k}>{MONTHS[m-1]} {y}</option>);}return opts;})()}</select><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><button onClick={()=>setAddingMonth(false)}>Cancel</button><button onClick={addPastMonth} style={{background:"var(--color-text-primary)",color:"var(--color-background-primary)",fontWeight:500}}>Add Month</button></div></ModalWrap>}
      {addingCat&&<ModalWrap onClose={()=>setAddingCat(false)}><div style={{fontSize:16,fontWeight:500,marginBottom:16}}>New Budget Category</div><div style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:8,marginBottom:12,alignItems:"center"}}><select value={newCat.icon} onChange={e=>setNewCat(p=>({...p,icon:e.target.value}))} style={{fontSize:20,padding:"4px 6px",borderRadius:8,border:"0.5px solid var(--color-border-secondary)",background:"var(--color-background-secondary)",fontFamily:"inherit",width:"auto"}}>{EMOJI_OPTIONS.map(e=><option key={e} value={e}>{e}</option>)}</select><input placeholder="Category name" value={newCat.category} onChange={e=>setNewCat(p=>({...p,category:e.target.value}))} style={{fontSize:14,marginBottom:0}}/></div><div style={S.fieldRow}><div><span style={S.label}>Budget $</span><input type="number" placeholder="0.00" value={newCat.budgeted} onChange={e=>setNewCat(p=>({...p,budgeted:e.target.value}))} style={S.ii}/></div><div><span style={S.label}>Due Date</span><input placeholder="e.g. 15th" value={newCat.due_date} onChange={e=>setNewCat(p=>({...p,due_date:e.target.value}))} style={S.ii}/></div></div><div style={{marginBottom:14}}><span style={S.label}>Group</span><select value={newCat.group_name} onChange={e=>setNewCat(p=>({...p,group_name:e.target.value}))} style={{...S.ii,fontSize:14,padding:"8px 12px",borderRadius:8}}>{GROUPS.map(g=><option key={g} value={g}>{g}</option>)}</select></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><button onClick={()=>setAddingCat(false)}>Cancel</button><button onClick={addCategory} style={{background:"var(--color-text-primary)",color:"var(--color-background-primary)",fontWeight:500}}>Add</button></div></ModalWrap>}
      {addingFund&&<ModalWrap onClose={()=>setAddingFund(false)}><div style={{fontSize:16,fontWeight:500,marginBottom:16}}>New Savings Fund</div><div style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:8,marginBottom:12,alignItems:"center"}}><select value={newFund.icon} onChange={e=>setNewFund(p=>({...p,icon:e.target.value}))} style={{fontSize:20,padding:"4px 6px",borderRadius:8,border:"0.5px solid var(--color-border-secondary)",background:"var(--color-background-secondary)",fontFamily:"inherit",width:"auto"}}>{FUND_ICONS.map(ic=><option key={ic} value={ic}>{ic}</option>)}</select><input placeholder="Fund name" value={newFund.name} onChange={e=>setNewFund(p=>({...p,name:e.target.value}))} style={{fontSize:14,marginBottom:0}}/></div><div style={{marginBottom:10}}><span style={S.label}>Color</span><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{FUND_COLORS.map(c=><div key={c} onClick={()=>setNewFund(p=>({...p,color:c}))} style={{width:24,height:24,borderRadius:"50%",background:c,cursor:"pointer",border:newFund.color===c?"3px solid var(--color-text-primary)":"3px solid transparent"}}/>)}</div></div><div style={S.fieldRow}><div><span style={S.label}>Target $</span><input type="number" placeholder="1000" value={newFund.target} onChange={e=>setNewFund(p=>({...p,target:e.target.value}))} style={S.ii}/></div><div><span style={S.label}>Already Saved $</span><input type="number" placeholder="0" value={newFund.saved} onChange={e=>setNewFund(p=>({...p,saved:e.target.value}))} style={S.ii}/></div></div><div style={S.fieldRow}><div><span style={S.label}>Monthly Goal $</span><input type="number" placeholder="50" value={newFund.monthly_goal} onChange={e=>setNewFund(p=>({...p,monthly_goal:e.target.value}))} style={S.ii}/></div><div><span style={S.label}>Target Date</span><input type="date" value={newFund.due_date} onChange={e=>setNewFund(p=>({...p,due_date:e.target.value}))} style={S.ii}/></div></div><div style={{marginBottom:10}}><span style={S.label}>Type</span><select value={newFund.fund_type} onChange={e=>setNewFund(p=>({...p,fund_type:e.target.value}))} style={{...S.ii,fontSize:14,padding:"8px 12px",borderRadius:8}}>{FUND_TYPES.map(t=><option key={t} value={t}>{t}</option>)}</select></div><div style={{marginBottom:16}}><span style={S.label}>Notes</span><input placeholder="What is this for?" value={newFund.notes} onChange={e=>setNewFund(p=>({...p,notes:e.target.value}))} style={{...S.ii,fontSize:14,padding:"8px 12px",borderRadius:8}}/></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><button onClick={()=>setAddingFund(false)}>Cancel</button><button onClick={addFund} style={{background:"var(--color-text-primary)",color:"var(--color-background-primary)",fontWeight:500}}>Add Fund</button></div></ModalWrap>}

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
