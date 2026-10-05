export type Person='Rizal'|'Diyana'|'Joint Account';
export type Pic='Rizal'|'Diyana'|'Both';
export type ExpenseType='One-time'|'Monthly';
export type ExpenseStatus='Planned'|'Quoted'|'Ordered'|'Pending'|'Paid'|'Cancelled';
export type SurveyDecision='Considering'|'Shortlisted'|'Confirmed'|'Rejected';
export type DesignName='calm'|'ledger'|'board';
export type ThemeName='light'|'dark';
export interface Category{ id:string; expenseType:ExpenseType; mainCategory:string; subcategory:string; defaultPic:Pic; active:boolean; }
export interface Expense{ id:string; date:string; expenseType:ExpenseType; mainCategory:string; subcategory:string; description:string; vendor:string; paidBy:Person; paymentMethod:string; status:ExpenseStatus; budgeted:number; actual:number; rizalPct:number; diyanaPct:number; receiptUrl?:string; notes?:string; surveyItemId?:string; }
export interface Budget{ id:string; expenseType:ExpenseType; mainCategory:string; subcategory:string; responsiblePic:Pic; plannedAmount:number; notes?:string; }
export interface SurveyItem{ id:string; surveyDate:string; itemType:'Renovation Works'|'Furniture'|'Appliance'|'Fixtures & Fittings'|'Other'; mainCategory:string; subcategory:string; description:string; vendor:string; contact:string; optionModel:string; estimatedCost:number; actualCost:number; productLink?:string; warrantyLeadTime?:string; surveyedBy:Pic; rating:number; decision:SurveyDecision; confirmedDate?:string; paidBy:Person; paymentMethod:string; expenseStatus:ExpenseStatus; rizalPct:number; diyanaPct:number; notes?:string; }
