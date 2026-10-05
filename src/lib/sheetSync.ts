export type SheetRecordKind='expense'|'survey'|'budget'|'category';

export type SheetSyncState={
  state:'idle'|'syncing'|'synced'|'error';
  message:string;
};

export async function syncRecord(kind:SheetRecordKind,record:Record<string,unknown>){
  const response=await fetch('/api/sync-sheet',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({kind,record})
  });
  const result=await response.json().catch(()=>({error:'The sync service returned an invalid response.'}));
  if(!response.ok||!result.ok)throw new Error(result.error||'Google Sheet sync failed.');
  return result as {ok:true;sheet:string;row:number};
}
