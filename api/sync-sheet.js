const ALLOWED_KINDS=new Set(['expense','survey','budget','category']);
const DEFAULT_ORIGINS=[
  'https://idaman-sari-expenses.vercel.app',
  'https://idaman-sari-expenses-jai-da29.vercel.app'
];

function allowedOrigins(){
  return new Set([
    ...DEFAULT_ORIGINS,
    ...(process.env.SHEET_SYNC_ALLOWED_ORIGINS||'').split(',').map(value=>value.trim()).filter(Boolean)
  ]);
}

function send(response,status,payload){
  response.setHeader('Cache-Control','no-store');
  response.status(status).json(payload);
}

export default async function handler(request,response){
  if(request.method==='GET'){
    return send(response,200,{ok:true,configured:Boolean(process.env.GOOGLE_SHEETS_WEBHOOK_URL&&process.env.GOOGLE_SHEETS_WEBHOOK_SECRET)});
  }
  if(request.method!=='POST'){
    response.setHeader('Allow','GET, POST');
    return send(response,405,{ok:false,error:'Method not allowed.'});
  }

  const origin=request.headers.origin;
  if(!origin||!allowedOrigins().has(origin))return send(response,403,{ok:false,error:'This sync request did not come from the Idaman Sari app.'});

  const webhookUrl=process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  const webhookSecret=process.env.GOOGLE_SHEETS_WEBHOOK_SECRET;
  if(!webhookUrl||!webhookSecret)return send(response,503,{ok:false,error:'Google Sheet sync has not been configured yet.'});

  const body=typeof request.body==='string'?JSON.parse(request.body):request.body;
  if(!body||!ALLOWED_KINDS.has(body.kind)||!body.record||typeof body.record!=='object'){
    return send(response,400,{ok:false,error:'Invalid sync request.'});
  }
  if(typeof body.record.id!=='string'||body.record.id.length<3||body.record.id.length>100){
    return send(response,400,{ok:false,error:'Every synchronized record needs a valid ID.'});
  }
  if(JSON.stringify(body.record).length>30000)return send(response,413,{ok:false,error:'Record is too large to synchronize.'});

  try{
    const upstream=await fetch(webhookUrl,{
      method:'POST',
      headers:{'Content-Type':'text/plain;charset=utf-8'},
      body:JSON.stringify({secret:webhookSecret,kind:body.kind,record:body.record}),
      redirect:'follow',
      signal:AbortSignal.timeout(15000)
    });
    const result=await upstream.json().catch(()=>null);
    if(!upstream.ok||!result?.ok)throw new Error(result?.error||`Google Sheet returned ${upstream.status}.`);
    return send(response,200,result);
  }catch(error){
    console.error('Google Sheet sync failed',error);
    return send(response,502,{ok:false,error:'The app saved locally, but Google Sheets could not be updated. Please try the change again.'});
  }
}
