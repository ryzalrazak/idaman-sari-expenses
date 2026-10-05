import {useEffect,useMemo,useState} from 'react';
import type {Budget,Category,DesignName,Expense,ExpenseStatus,ExpenseType,Person,Pic,SurveyDecision,SurveyItem,ThemeName} from './types';
import {demoBudgets,demoCategories,demoExpenses,demoSurvey} from './lib/demoData';
import {databaseMode} from './lib/supabase';
import {syncRecord} from './lib/sheetSync';
import type {SheetRecordKind,SheetSyncState} from './lib/sheetSync';
import {formatDate,money,monthLabel,todayISO} from './lib/format';
import ThemeToggle from './components/ThemeToggle';
import StatCard from './components/StatCard';
import StatusPill from './components/StatusPill';

type Page='dashboard'|'expenses'|'survey'|'budget'|'categories'|'settings';
const paymentMethods=['Cash','Debit Card','Credit Card','Bank Transfer','DuitNow','E-Wallet','Auto Debit','Other'];
const statuses:ExpenseStatus[]=['Planned','Quoted','Ordered','Pending','Paid','Cancelled'];
const people:Person[]=['Rizal','Diyana','Joint Account'];
const nav:[Page,string,string][]=[['dashboard','Overview','⌂'],['expenses','Expenses','₋'],['survey','Survey','◎'],['budget','Budget','◫'],['categories','Categories','≡'],['settings','Settings','⚙']];
type SyncWriter=(kind:SheetRecordKind,record:Record<string,unknown>)=>Promise<void>;

function useStored<T>(key:string,fallback:T){
  const [value,setValue]=useState<T>(()=>{try{return JSON.parse(localStorage.getItem(key)||'null')??fallback}catch{return fallback}});
  useEffect(()=>localStorage.setItem(key,JSON.stringify(value)),[key,value]);
  return [value,setValue] as const;
}

export default function App(){
  const [page,setPage]=useState<Page>('dashboard');
  const [theme,setTheme]=useStored<ThemeName>('idaman-theme','light');
  const [design,setDesign]=useStored<DesignName>('idaman-design','calm');
  const [month,setMonth]=useStored('idaman-month','2026-10');
  const [expenses,setExpenses]=useStored<Expense[]>('idaman-expenses',demoExpenses);
  const [survey,setSurvey]=useStored<SurveyItem[]>('idaman-survey',demoSurvey);
  const [budgets,setBudgets]=useStored<Budget[]>('idaman-budgets',demoBudgets);
  const [categories,setCategories]=useStored<Category[]>('idaman-categories',demoCategories);
  const [sheetSync,setSheetSync]=useState<SheetSyncState>({state:'idle',message:'Checking Sheet sync…'});
  useEffect(()=>{document.documentElement.dataset.theme=theme;document.documentElement.dataset.design=design},[theme,design]);
  useEffect(()=>{
    let active=true;
    fetch('/api/sync-sheet').then(response=>response.json()).then(result=>{
      if(active)setSheetSync(result.configured?{state:'synced',message:'Google Sheet connected'}:{state:'error',message:'Google Sheet setup incomplete'});
    }).catch(()=>{if(active)setSheetSync({state:'error',message:'Sheet sync unavailable'})});
    return()=>{active=false};
  },[]);
  const sync:SyncWriter=async(kind,record)=>{
    setSheetSync({state:'syncing',message:'Saving to Google Sheets…'});
    try{
      const result=await syncRecord(kind,record);
      setSheetSync({state:'synced',message:`Saved to ${result.sheet}`});
    }catch(error){
      setSheetSync({state:'error',message:error instanceof Error?error.message:'Google Sheet sync failed.'});
    }
  };

  const surveyExpenses=useMemo<Expense[]>(()=>survey.filter(s=>s.decision==='Confirmed').map(s=>({
    id:s.id,date:s.confirmedDate||s.surveyDate,expenseType:'One-time',mainCategory:s.mainCategory,subcategory:s.subcategory,
    description:`${s.description}${s.optionModel?` — ${s.optionModel}`:''}`,vendor:s.vendor,paidBy:s.paidBy,paymentMethod:s.paymentMethod,
    status:s.expenseStatus,budgeted:s.estimatedCost,actual:s.actualCost||s.estimatedCost,rizalPct:s.rizalPct,diyanaPct:s.diyanaPct,
    receiptUrl:s.productLink,notes:`Confirmed from Survey${s.notes?` | ${s.notes}`:''}`,surveyItemId:s.id
  })),[survey]);
  const allExpenses=useMemo(()=>[...expenses,...surveyExpenses],[expenses,surveyExpenses]);

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">IS</span><div><strong>Idaman Sari</strong><small>Rizal + Diyana</small></div></div>
      <nav>{nav.map(([id,label,icon])=><button className={page===id?'active':''} key={id} onClick={()=>setPage(id)}><span>{icon}</span><b>{label}</b></button>)}</nav>
      <div className="sidebar-footer"><i className={`sync-dot ${sheetSync.state}`}/><div><small>{databaseMode}</small><small>{sheetSync.message}</small></div></div>
    </aside>
    <main className="main">
      <header className="topbar"><div><small>{monthLabel(month)}</small><h1>{nav.find(n=>n[0]===page)?.[1]}</h1></div><div className="top-actions"><label className="month-picker"><span>Month</span><input type="month" value={month} onChange={e=>setMonth(e.target.value)}/></label><ThemeToggle theme={theme} onChange={setTheme}/></div></header>
      <section className="content">
        {page==='dashboard'&&<Dashboard expenses={allExpenses} budgets={budgets} month={month} go={setPage}/>} 
        {page==='expenses'&&<Expenses expenses={expenses} setExpenses={setExpenses} categories={categories} sync={sync}/>}
        {page==='survey'&&<Survey survey={survey} setSurvey={setSurvey} categories={categories} sync={sync}/>}
        {page==='budget'&&<BudgetView budgets={budgets} setBudgets={setBudgets} expenses={allExpenses} categories={categories} month={month} sync={sync}/>}
        {page==='categories'&&<Categories categories={categories} setCategories={setCategories} sync={sync}/>}
        {page==='settings'&&<Settings theme={theme} setTheme={setTheme} design={design} setDesign={setDesign} sheetSync={sheetSync} reset={()=>{setExpenses(demoExpenses);setSurvey(demoSurvey);setBudgets(demoBudgets);setCategories(demoCategories)}}/>}
      </section>
    </main>
    <nav className="mobile-nav">{nav.slice(0,5).map(([id,label,icon])=><button className={page===id?'active':''} key={id} onClick={()=>setPage(id)}><span>{icon}</span><small>{label}</small></button>)}</nav>
  </div>
}

function Dashboard({expenses,budgets,month,go}:{expenses:Expense[];budgets:Budget[];month:string;go:(p:Page)=>void}){
  const active=expenses.filter(e=>e.status!=='Cancelled');
  const one=active.filter(e=>e.expenseType==='One-time');
  const monthly=active.filter(e=>e.expenseType==='Monthly'&&e.date.startsWith(month));
  const paid=active.filter(e=>e.status==='Paid');
  const oneBudget=budgets.filter(b=>b.expenseType==='One-time').reduce((a,b)=>a+b.plannedAmount,0);
  const oneActual=one.reduce((a,e)=>a+e.actual,0);
  const monthBudget=budgets.filter(b=>b.expenseType==='Monthly').reduce((a,b)=>a+b.plannedAmount,0);
  const monthActual=monthly.reduce((a,e)=>a+e.actual,0);
  const outstanding=active.filter(e=>e.status!=='Paid').reduce((a,e)=>a+e.actual,0);
  const rp=paid.filter(e=>e.paidBy==='Rizal').reduce((a,e)=>a+e.actual,0), dp=paid.filter(e=>e.paidBy==='Diyana').reduce((a,e)=>a+e.actual,0);
  const rs=paid.reduce((a,e)=>a+e.actual*e.rizalPct/100,0), ds=paid.reduce((a,e)=>a+e.actual*e.diyanaPct/100,0);
  const byCat=Object.entries(one.reduce<Record<string,number>>((m,e)=>{m[e.mainCategory]=(m[e.mainCategory]||0)+e.actual;return m},{})).sort((a,b)=>b[1]-a[1]);
  return <>
    <div className="hero-row"><div><span className="eyebrow">Home finance at a glance</span><h2>Track the move without losing the details.</h2><p>Renovation, furniture, appliances, utilities and monthly household spending in one workflow.</p></div><button className="primary" onClick={()=>go('expenses')}>+ Add expense</button></div>
    <div className="stat-grid"><StatCard label="One-time budget" value={money(oneBudget)} hint={`${money(oneActual)} recorded`} tone={oneActual>oneBudget?'bad':'good'}/><StatCard label="One-time remaining" value={money(oneBudget-oneActual)} hint="Planned minus actual" tone={oneBudget-oneActual<0?'bad':'good'}/><StatCard label="Monthly target" value={money(monthBudget)} hint={`${money(monthActual)} this month`} tone={monthActual>monthBudget&&monthBudget>0?'bad':'default'}/><StatCard label="Outstanding" value={money(outstanding)} hint="Not marked Paid" tone={outstanding>0?'warn':'good'}/></div>
    <div className="two-col"><article className="panel"><span className="eyebrow">Settlement</span><h3>Who has paid what?</h3><div className="people-grid"><div><span>Rizal paid</span><strong>{money(rp)}</strong><small>Net position {money(rp-rs)}</small></div><div><span>Diyana paid</span><strong>{money(dp)}</strong><small>Net position {money(dp-ds)}</small></div></div><p className="help">Positive = should receive money back. Negative = owes the household. Only Paid expenses count.</p></article><article className="panel"><span className="eyebrow">One-time setup</span><h3>Spend by category</h3><div className="bar-list">{byCat.map(([name,amount])=><div key={name}><div className="bar-label"><span>{name}</span><b>{money(amount)}</b></div><div className="track"><i style={{width:`${Math.max(5,amount/(byCat[0]?.[1]||1)*100)}%`}}/></div></div>)}</div></article></div>
    <article className="panel"><div className="panel-head"><div><span className="eyebrow">Recent activity</span><h3>Latest expenses</h3></div><button className="text-button" onClick={()=>go('expenses')}>View all →</button></div><ExpenseTable expenses={[...active].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,6)}/></article>
  </>
}

function ExpenseTable({expenses}:{expenses:Expense[]}){return <div className="table-wrap"><table><thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Paid by</th><th>Status</th><th className="num">Actual</th></tr></thead><tbody>{expenses.map(e=><tr key={`${e.id}-${e.surveyItemId||''}`}><td>{formatDate(e.date)}</td><td><b>{e.description}</b><small>{e.vendor||e.id}</small></td><td>{e.mainCategory}<small>{e.subcategory}</small></td><td>{e.paidBy}</td><td><StatusPill value={e.status}/></td><td className="num"><b>{money(e.actual)}</b></td></tr>)}{!expenses.length&&<tr><td colSpan={6} className="empty">Nothing here yet.</td></tr>}</tbody></table></div>}

function Expenses({expenses,setExpenses,categories,sync}:{expenses:Expense[];setExpenses:(v:Expense[])=>void;categories:Category[];sync:SyncWriter}){
  const [show,setShow]=useState(false); const [type,setType]=useState<ExpenseType>('One-time');
  const cats=categories.filter(c=>c.active&&c.expenseType===type); const mains=[...new Set(cats.map(c=>c.mainCategory))]; const [main,setMain]=useState(mains[0]||'');
  useEffect(()=>{if(!mains.includes(main))setMain(mains[0]||'')},[type,categories]);
  const subs=cats.filter(c=>c.mainCategory===main);
  const save=(ev:React.FormEvent<HTMLFormElement>)=>{ev.preventDefault();const f=new FormData(ev.currentTarget);const r=Number(f.get('rizalPct')||50);const row:Expense={id:`IS-WEB-${crypto.randomUUID().slice(0,8).toUpperCase()}`,date:String(f.get('date')),expenseType:type,mainCategory:String(f.get('mainCategory')),subcategory:String(f.get('subcategory')),description:String(f.get('description')),vendor:String(f.get('vendor')),paidBy:String(f.get('paidBy')) as Person,paymentMethod:String(f.get('paymentMethod')),status:String(f.get('status')) as ExpenseStatus,budgeted:Number(f.get('budgeted')||0),actual:Number(f.get('actual')||0),rizalPct:r,diyanaPct:100-r,receiptUrl:String(f.get('receiptUrl')||''),notes:String(f.get('notes')||'')};setExpenses([row,...expenses]);void sync('expense',row as unknown as Record<string,unknown>);setShow(false)};
  return <><PageHead eyebrow="Manual expense log" title="Expenses" text="Confirmed Survey choices flow into totals automatically; use this page for direct expenses." action={show?'Close':'+ New expense'} click={()=>setShow(!show)}/>{show&&<form className="panel form-grid" onSubmit={save}><label>Date<input required name="date" type="date" defaultValue={todayISO()}/></label><label>Expense type<select value={type} onChange={e=>setType(e.target.value as ExpenseType)}><option>One-time</option><option>Monthly</option></select></label><label>Main category<select name="mainCategory" value={main} onChange={e=>setMain(e.target.value)}>{mains.map(x=><option key={x}>{x}</option>)}</select></label><label>Subcategory<select name="subcategory">{subs.map(x=><option key={x.id}>{x.subcategory}</option>)}</select></label><label className="span-2">Description<input name="description" required/></label><label>Vendor / payee<input name="vendor"/></label><label>Paid by<select name="paidBy">{people.map(x=><option key={x}>{x}</option>)}</select></label><label>Payment method<select name="paymentMethod">{paymentMethods.map(x=><option key={x}>{x}</option>)}</select></label><label>Status<select name="status">{statuses.map(x=><option key={x}>{x}</option>)}</select></label><label>Budgeted (RM)<input name="budgeted" type="number" min="0" step="0.01"/></label><label>Actual (RM)<input name="actual" required type="number" min="0" step="0.01"/></label><label>Rizal share %<input name="rizalPct" type="number" min="0" max="100" defaultValue="50"/></label><label>Receipt / link<input name="receiptUrl" type="url"/></label><label className="span-2">Notes<textarea name="notes" rows={2}/></label><div className="span-2 form-actions"><button className="primary">Save expense</button></div></form>}<article className="panel"><ExpenseTable expenses={expenses}/></article></>
}

function Survey({survey,setSurvey,categories,sync}:{survey:SurveyItem[];setSurvey:(v:SurveyItem[])=>void;categories:Category[];sync:SyncWriter}){
  const [show,setShow]=useState(false); const cats=categories.filter(c=>c.active&&c.expenseType==='One-time');
  const setDecision=(id:string,decision:SurveyDecision)=>{const updated=survey.find(s=>s.id===id);if(!updated)return;const row={...updated,decision,confirmedDate:decision==='Confirmed'?(updated.confirmedDate||todayISO()):updated.confirmedDate};setSurvey(survey.map(s=>s.id===id?row:s));void sync('survey',row as unknown as Record<string,unknown>)};
  const save=(ev:React.FormEvent<HTMLFormElement>)=>{ev.preventDefault();const f=new FormData(ev.currentTarget);const sub=String(f.get('subcategory')),cat=cats.find(c=>c.subcategory===sub),r=Number(f.get('rizalPct')||50);const row:SurveyItem={id:`SV-WEB-${crypto.randomUUID().slice(0,8).toUpperCase()}`,surveyDate:String(f.get('surveyDate')),itemType:String(f.get('itemType')) as SurveyItem['itemType'],mainCategory:cat?.mainCategory||'Other',subcategory:sub,description:String(f.get('description')),vendor:String(f.get('vendor')),contact:String(f.get('contact')||''),optionModel:String(f.get('optionModel')||''),estimatedCost:Number(f.get('estimatedCost')||0),actualCost:0,productLink:String(f.get('productLink')||''),warrantyLeadTime:String(f.get('warrantyLeadTime')||''),surveyedBy:String(f.get('surveyedBy')) as Pic,rating:Number(f.get('rating')||3),decision:'Considering',paidBy:'Joint Account',paymentMethod:'Bank Transfer',expenseStatus:'Planned',rizalPct:r,diyanaPct:100-r,notes:String(f.get('notes')||'')};setSurvey([row,...survey]);void sync('survey',row as unknown as Record<string,unknown>);setShow(false)};
  return <><PageHead eyebrow="Quotation & product comparison" title="Survey" text="Preserves the sheet rule: only Confirmed choices enter expense totals." action={show?'Close':'+ Add option'} click={()=>setShow(!show)}/>{show&&<form className="panel form-grid" onSubmit={save}><label>Survey date<input name="surveyDate" required type="date" defaultValue={todayISO()}/></label><label>Item type<select name="itemType"><option>Renovation Works</option><option>Furniture</option><option>Appliance</option><option>Fixtures & Fittings</option><option>Other</option></select></label><label>Subcategory<select name="subcategory">{cats.map(c=><option key={c.id}>{c.subcategory}</option>)}</select></label><label>Surveyed by<select name="surveyedBy"><option>Rizal</option><option>Diyana</option><option>Both</option></select></label><label className="span-2">Description<input name="description" required/></label><label>Vendor / contractor<input name="vendor" required/></label><label>Contact<input name="contact"/></label><label>Option / model<input name="optionModel"/></label><label>Estimated cost (RM)<input name="estimatedCost" required type="number" min="0" step="0.01"/></label><label>Rating<input name="rating" type="number" min="1" max="5" defaultValue="3"/></label><label>Rizal share %<input name="rizalPct" type="number" min="0" max="100" defaultValue="50"/></label><label>Product / quote link<input name="productLink" type="url"/></label><label>Warranty / lead time<input name="warrantyLeadTime"/></label><label className="span-2">Notes<textarea name="notes" rows={2}/></label><div className="span-2 form-actions"><button className="primary">Save option</button></div></form>}<div className="survey-grid">{survey.map(s=><article className="survey-card" key={s.id}><div className="survey-top"><div><span className="eyebrow">{s.id} · {formatDate(s.surveyDate)}</span><h3>{s.description}</h3><p>{s.vendor}{s.optionModel&&` · ${s.optionModel}`}</p></div><b className="rating">{'★'.repeat(s.rating)}<span>{'★'.repeat(5-s.rating)}</span></b></div><div className="survey-meta"><span>{s.mainCategory}</span><span>{s.subcategory}</span><b>{money(s.estimatedCost)}</b></div><label>Decision<select value={s.decision} onChange={e=>setDecision(s.id,e.target.value as SurveyDecision)}><option>Considering</option><option>Shortlisted</option><option>Confirmed</option><option>Rejected</option></select></label>{s.decision==='Confirmed'&&<div className="confirmed">✓ Added to expense totals · {formatDate(s.confirmedDate)}</div>}</article>)}</div></>
}

function BudgetView({budgets,setBudgets,expenses,categories,month,sync}:{budgets:Budget[];setBudgets:(v:Budget[])=>void;expenses:Expense[];categories:Category[];month:string;sync:SyncWriter}){
  const [show,setShow]=useState(false); const actual=(b:Budget)=>expenses.filter(e=>e.status!=='Cancelled'&&e.expenseType===b.expenseType&&e.mainCategory===b.mainCategory&&e.subcategory===b.subcategory&&(b.expenseType==='One-time'||e.date.startsWith(month))).reduce((a,e)=>a+e.actual,0);
  const save=(ev:React.FormEvent<HTMLFormElement>)=>{ev.preventDefault();const f=new FormData(ev.currentTarget),sub=String(f.get('subcategory')),c=categories.find(x=>x.subcategory===sub);if(!c)return;const row:Budget={id:crypto.randomUUID(),expenseType:c.expenseType,mainCategory:c.mainCategory,subcategory:c.subcategory,responsiblePic:c.defaultPic,plannedAmount:Number(f.get('plannedAmount')||0),notes:String(f.get('notes')||'')};setBudgets([row,...budgets]);void sync('budget',row as unknown as Record<string,unknown>);setShow(false)};
  return <><PageHead eyebrow="Plan vs actual" title="Budget" text="Monthly actuals follow the selected month; one-time actuals include all setup spending." action={show?'Close':'+ Budget item'} click={()=>setShow(!show)}/>{show&&<form className="panel form-grid" onSubmit={save}><label className="span-2">Category / subcategory<select name="subcategory">{categories.filter(c=>c.active).map(c=><option key={c.id}>{c.subcategory}</option>)}</select></label><label>Planned amount (RM)<input name="plannedAmount" type="number" required min="0" step="0.01"/></label><label>Notes<input name="notes"/></label><div className="span-2 form-actions"><button className="primary">Add budget</button></div></form>}<article className="panel"><div className="table-wrap"><table><thead><tr><th>Type</th><th>Category</th><th>PIC</th><th className="num">Planned</th><th className="num">Actual</th><th className="num">Variance</th><th>Status</th></tr></thead><tbody>{budgets.map(b=>{const a=actual(b),v=b.plannedAmount-a;return <tr key={b.id}><td>{b.expenseType}</td><td><b>{b.mainCategory}</b><small>{b.subcategory}</small></td><td>{b.responsiblePic}</td><td className="num">{money(b.plannedAmount)}</td><td className="num">{money(a)}</td><td className={`num ${v<0?'negative':'positive'}`}>{money(v)}</td><td><StatusPill value={a===0?'Not started':v<0?'Over budget':'Within budget'}/></td></tr>})}</tbody></table></div></article></>
}

function Categories({categories,setCategories,sync}:{categories:Category[];setCategories:(v:Category[])=>void;sync:SyncWriter}){
  const [show,setShow]=useState(false); const save=(ev:React.FormEvent<HTMLFormElement>)=>{ev.preventDefault();const f=new FormData(ev.currentTarget);const row:Category={id:crypto.randomUUID(),expenseType:String(f.get('expenseType')) as ExpenseType,mainCategory:String(f.get('mainCategory')),subcategory:String(f.get('subcategory')),defaultPic:String(f.get('defaultPic')) as Pic,active:true};setCategories([...categories,row]);void sync('category',row as unknown as Record<string,unknown>);setShow(false)};
  const toggle=(category:Category)=>{const row={...category,active:!category.active};setCategories(categories.map(item=>item.id===category.id?row:item));void sync('category',row as unknown as Record<string,unknown>)};
  return <><PageHead eyebrow="Shared lookup list" title="Categories" text="Deactivate old categories instead of deleting them, matching the spreadsheet process." action={show?'Close':'+ Category'} click={()=>setShow(!show)}/>{show&&<form className="panel form-grid" onSubmit={save}><label>Expense type<select name="expenseType"><option>One-time</option><option>Monthly</option></select></label><label>Default PIC<select name="defaultPic"><option>Rizal</option><option>Diyana</option><option>Both</option></select></label><label>Main category<input name="mainCategory" required/></label><label>Subcategory<input name="subcategory" required/></label><div className="span-2 form-actions"><button className="primary">Add category</button></div></form>}<article className="panel"><div className="table-wrap"><table><thead><tr><th>Type</th><th>Main category</th><th>Subcategory</th><th>Default PIC</th><th>Active</th></tr></thead><tbody>{categories.map(c=><tr key={c.id}><td>{c.expenseType}</td><td><b>{c.mainCategory}</b></td><td>{c.subcategory}</td><td>{c.defaultPic}</td><td><button className={`toggle ${c.active?'on':''}`} onClick={()=>toggle(c)}>{c.active?'Active':'Inactive'}</button></td></tr>)}</tbody></table></div></article></>
}

function Settings({theme,setTheme,design,setDesign,sheetSync,reset}:{theme:ThemeName;setTheme:(v:ThemeName)=>void;design:DesignName;setDesign:(v:DesignName)=>void;sheetSync:SheetSyncState;reset:()=>void}){
  const designs:[DesignName,string,string][]=[['calm','1. Calm Home','Clean cards and roomy spacing. Best default for everyday use.'],['ledger','2. Smart Ledger','Denser finance-first layout for detailed tracking.'],['board','3. Project Board','Bolder renovation/status view for the setup phase.']];
  return <><PageHead eyebrow="Appearance & data" title="Settings" text="Switch the live prototype between three interface directions before choosing the final design."/><article className="panel"><h3>Interface option</h3><div className="design-grid">{designs.map(([id,name,desc])=><button key={id} className={`design-choice ${design===id?'selected':''}`} onClick={()=>setDesign(id)}><strong>{name}</strong><span>{desc}</span></button>)}</div></article><article className="panel"><h3>Day / night mode</h3><div className="segmented"><button className={theme==='light'?'active':''} onClick={()=>setTheme('light')}>☀ Day</button><button className={theme==='dark'?'active':''} onClick={()=>setTheme('dark')}>☾ Night</button></div></article><article className="panel"><h3>Data connection</h3><p><b>{databaseMode} + Google Sheet mirror</b></p><p>New expenses, survey changes, budgets and categories save locally first, then upsert into the original workbook. Current sync status: <b className={`sync-text ${sheetSync.state}`}>{sheetSync.message}</b></p><a className="text-link" target="_blank" rel="noreferrer" href={import.meta.env.VITE_SOURCE_SHEET_URL||'https://docs.google.com/spreadsheets/d/1D_lAlyXK4HsBCO5_Qdqj6Kvb73qUBDE-KaBltOBn53I/edit'}>Open source Google Sheet ↗</a></article><article className="panel"><h3>Demo data</h3><p>Restore the bundled sample records in this browser only. Reset does not overwrite the Google Sheet.</p><button className="secondary" onClick={reset}>Reset demo data</button></article></>
}

function PageHead({eyebrow,title,text,action,click}:{eyebrow:string;title:string;text:string;action?:string;click?:()=>void}){return <div className="page-actions"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2><p>{text}</p></div>{action&&<button className="primary" onClick={click}>{action}</button>}</div>}
