const SPREADSHEET_ID='1D_lAlyXK4HsBCO5_Qdqj6Kvb73qUBDE-KaBltOBn53I';

function doPost(event){
  const lock=LockService.getScriptLock();
  try{
    const payload=JSON.parse(event.postData.contents||'{}');
    const expected=PropertiesService.getScriptProperties().getProperty('SHEET_SYNC_SECRET');
    if(!expected||payload.secret!==expected)return json_({ok:false,error:'Unauthorized.'});
    if(!payload.record||!payload.record.id)return json_({ok:false,error:'Missing record ID.'});
    lock.waitLock(10000);
    const spreadsheet=SpreadsheetApp.openById(SPREADSHEET_ID);
    const result=upsert_(spreadsheet,payload.kind,payload.record);
    SpreadsheetApp.flush();
    return json_({ok:true,sheet:result.sheet,row:result.row});
  }catch(error){
    console.error(error);
    return json_({ok:false,error:String(error&&error.message||error)});
  }finally{
    if(lock.hasLock())lock.releaseLock();
  }
}

function upsert_(spreadsheet,kind,record){
  if(kind==='expense')return upsertExpense_(spreadsheet.getSheetByName('Expense Log'),record);
  if(kind==='survey')return upsertSurvey_(spreadsheet.getSheetByName('Survey'),record);
  if(kind==='budget')return upsertBudget_(spreadsheet.getSheetByName('Budget Plan'),record);
  if(kind==='category')return upsertCategory_(spreadsheet.getSheetByName('Category Management'),record);
  throw new Error('Unsupported record type.');
}

function upsertExpense_(sheet,record){
  const row=findRow_(sheet,7,1,record.id,[1,2,4,7]);
  prepareRow_(sheet,row,7,19);
  const date=date_(record.date);
  const values=[record.id,date,'',record.expenseType,record.mainCategory,record.subcategory,record.description,record.vendor,record.paidBy,record.paymentMethod,record.status,number_(record.budgeted),number_(record.actual),percent_(record.rizalPct),percent_(record.diyanaPct),'','',record.receiptUrl||'',record.notes||''];
  sheet.getRange(row,1,1,19).setValues([values]);
  sheet.getRange(row,3).setFormula(`=IF($B${row}="","",DATE(YEAR($B${row}),MONTH($B${row}),1))`);
  sheet.getRange(row,16).setFormula(`=IF($M${row}="","",$M${row}*$N${row})`);
  sheet.getRange(row,17).setFormula(`=IF($M${row}="","",$M${row}*$O${row})`);
  return {sheet:'Expense Log',row:row};
}

function upsertSurvey_(sheet,record){
  const row=findRow_(sheet,5,1,record.id,[1,2,6]);
  prepareRow_(sheet,row,5,23);
  const values=[record.id,date_(record.surveyDate),record.itemType,record.mainCategory,record.subcategory,record.description,record.vendor,record.contact||'',record.optionModel||'',number_(record.estimatedCost),number_(record.actualCost),record.productLink||'',record.warrantyLeadTime||'',record.surveyedBy,number_(record.rating),record.decision,record.confirmedDate?date_(record.confirmedDate):'',record.paidBy,record.paymentMethod,record.expenseStatus,percent_(record.rizalPct),percent_(record.diyanaPct),record.notes||''];
  sheet.getRange(row,1,1,23).setValues([values]);
  return {sheet:'Survey',row:row};
}

function upsertBudget_(sheet,record){
  ensureSyncColumn_(sheet,5,11,'App Sync ID');
  const row=findRow_(sheet,6,11,record.id,[1,2,3]);
  prepareRow_(sheet,row,6,10);
  sheet.getRange(row,1,1,10).setValues([[record.expenseType,record.mainCategory,record.subcategory,record.responsiblePic,number_(record.plannedAmount),'','','','',record.notes||'']]);
  sheet.getRange(row,6).setFormula(`=IF($A${row}="","",IF($A${row}="Monthly",SUMIFS('Expense Log'!$M$7:$M$509,'Expense Log'!$D$7:$D$509,$A${row},'Expense Log'!$E$7:$E$509,$B${row},'Expense Log'!$F$7:$F$509,$C${row},'Expense Log'!$B$7:$B$509,">="&Dashboard!$B$4,'Expense Log'!$B$7:$B$509,"<"&EDATE(Dashboard!$B$4,1)),SUMIFS('Expense Log'!$M$7:$M$509,'Expense Log'!$D$7:$D$509,$A${row},'Expense Log'!$E$7:$E$509,$B${row},'Expense Log'!$F$7:$F$509,$C${row})))`);
  sheet.getRange(row,7).setFormula(`=IF($E${row}="","",$E${row}-$F${row})`);
  sheet.getRange(row,8).setFormula(`=IF(OR($E${row}="",$E${row}=0),"",$F${row}/$E${row})`);
  sheet.getRange(row,9).setFormula(`=IF($A${row}="","",IF($E${row}="","Set budget",IF($F${row}=0,"Not started",IF($F${row}<=$E${row},"Within budget","Over budget"))))`);
  sheet.getRange(row,11).setValue(record.id);
  return {sheet:'Budget Plan',row:row};
}

function upsertCategory_(sheet,record){
  ensureSyncColumn_(sheet,4,9,'App Sync ID');
  const row=findRow_(sheet,5,9,record.id,[1,2,3]);
  prepareRow_(sheet,row,5,6);
  sheet.getRange(row,1,1,6).setValues([[record.expenseType,record.mainCategory,record.subcategory,record.defaultPic,Boolean(record.active),record.notes||'']]);
  sheet.getRange(row,9).setValue(record.id);
  return {sheet:'Category Management',row:row};
}

function findRow_(sheet,startRow,idColumn,id,sentinelColumns){
  const rowCount=sheet.getMaxRows()-startRow+1;
  const ids=sheet.getRange(startRow,idColumn,rowCount,1).getDisplayValues();
  for(let i=0;i<ids.length;i++)if(ids[i][0]===id)return startRow+i;
  const width=Math.max.apply(null,sentinelColumns);
  const rows=sheet.getRange(startRow,1,rowCount,width).getDisplayValues();
  for(let i=0;i<rows.length;i++)if(sentinelColumns.every(column=>!rows[i][column-1]))return startRow+i;
  sheet.insertRowsAfter(sheet.getMaxRows(),1);
  return sheet.getMaxRows();
}

function prepareRow_(sheet,row,templateRow,width){
  const template=sheet.getRange(templateRow,1,1,width);
  const target=sheet.getRange(row,1,1,width);
  template.copyTo(target,SpreadsheetApp.CopyPasteType.PASTE_FORMAT,false);
  target.setDataValidations(template.getDataValidations());
}

function ensureSyncColumn_(sheet,headerRow,column,title){
  if(sheet.getRange(headerRow,column).getDisplayValue()!==title)sheet.getRange(headerRow,column).setValue(title);
  sheet.hideColumns(column);
}

function date_(value){
  if(!value)return '';
  const parts=String(value).split('-').map(Number);
  return new Date(parts[0],parts[1]-1,parts[2],12,0,0);
}

function number_(value){
  const number=Number(value);
  return Number.isFinite(number)?number:0;
}

function percent_(value){
  return number_(value)/100;
}

function json_(payload){
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}
