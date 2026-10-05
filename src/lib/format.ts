export const money=(n:number)=>new Intl.NumberFormat('en-MY',{style:'currency',currency:'MYR',minimumFractionDigits:2}).format(Number.isFinite(n)?n:0);
export const formatDate=(v?:string)=>{if(!v)return '—'; const [y,m,d]=v.slice(0,10).split('-'); return `${d}-${m}-${y}`};
export const monthLabel=(v:string)=>new Intl.DateTimeFormat('en-MY',{month:'short',year:'numeric'}).format(new Date(`${v}-01T00:00:00`));
export const todayISO=()=>new Date().toISOString().slice(0,10);
