import type {Budget,Category,Expense,SurveyItem} from '../types';
export const demoCategories:Category[]=[
{id:'c1',expenseType:'One-time',mainCategory:'Renovation',subcategory:'Design / contractor',defaultPic:'Both',active:true},
{id:'c2',expenseType:'One-time',mainCategory:'Renovation',subcategory:'Electrical works',defaultPic:'Rizal',active:true},
{id:'c3',expenseType:'One-time',mainCategory:'Renovation',subcategory:'Kitchen cabinets',defaultPic:'Diyana',active:true},
{id:'c4',expenseType:'One-time',mainCategory:'Furniture',subcategory:'Living room',defaultPic:'Diyana',active:true},
{id:'c5',expenseType:'One-time',mainCategory:'Appliances',subcategory:'Refrigerator',defaultPic:'Both',active:true},
{id:'c6',expenseType:'One-time',mainCategory:'Appliances',subcategory:'Air conditioning',defaultPic:'Rizal',active:true},
{id:'c7',expenseType:'One-time',mainCategory:'Utility Setup',subcategory:'Internet installation',defaultPic:'Rizal',active:true},
{id:'c8',expenseType:'One-time',mainCategory:'Moving & Fees',subcategory:'Cleaning',defaultPic:'Diyana',active:true},
{id:'c9',expenseType:'Monthly',mainCategory:'Housing',subcategory:'Mortgage / rent',defaultPic:'Both',active:true},
{id:'c10',expenseType:'Monthly',mainCategory:'Housing',subcategory:'Management / maintenance fee',defaultPic:'Rizal',active:true},
{id:'c11',expenseType:'Monthly',mainCategory:'Utilities',subcategory:'Electricity',defaultPic:'Both',active:true},
{id:'c12',expenseType:'Monthly',mainCategory:'Utilities',subcategory:'Water',defaultPic:'Both',active:true},
{id:'c13',expenseType:'Monthly',mainCategory:'Utilities',subcategory:'Internet',defaultPic:'Rizal',active:true},
{id:'c14',expenseType:'Monthly',mainCategory:'Household',subcategory:'Cleaning supplies',defaultPic:'Diyana',active:true}];
export const demoBudgets:Budget[]=[
{id:'b1',expenseType:'One-time',mainCategory:'Renovation',subcategory:'Design / contractor',responsiblePic:'Diyana',plannedAmount:4000},
{id:'b2',expenseType:'One-time',mainCategory:'Appliances',subcategory:'Refrigerator',responsiblePic:'Both',plannedAmount:4500},
{id:'b3',expenseType:'One-time',mainCategory:'Appliances',subcategory:'Air conditioning',responsiblePic:'Rizal',plannedAmount:3500},
{id:'b4',expenseType:'Monthly',mainCategory:'Utilities',subcategory:'Electricity',responsiblePic:'Both',plannedAmount:350},
{id:'b5',expenseType:'Monthly',mainCategory:'Utilities',subcategory:'Water',responsiblePic:'Both',plannedAmount:60},
{id:'b6',expenseType:'Monthly',mainCategory:'Utilities',subcategory:'Internet',responsiblePic:'Rizal',plannedAmount:130}];
export const demoExpenses:Expense[]=[
{id:'IS-001',date:'2026-10-05',expenseType:'One-time',mainCategory:'Renovation',subcategory:'Design / contractor',description:'Plaster ceiling',vendor:'MDC',paidBy:'Diyana',paymentMethod:'Bank Transfer',status:'Quoted',budgeted:4000,actual:4000,rizalPct:50,diyanaPct:50,notes:'Initial quotation'},
{id:'IS-002',date:'2026-10-05',expenseType:'One-time',mainCategory:'Moving & Fees',subcategory:'Cleaning',description:'Pre-move cleaning',vendor:'Local cleaning service',paidBy:'Rizal',paymentMethod:'DuitNow',status:'Paid',budgeted:300,actual:260,rizalPct:50,diyanaPct:50},
{id:'IS-003',date:'2026-10-06',expenseType:'One-time',mainCategory:'Appliances',subcategory:'Air conditioning',description:'Living hall 2HP air conditioner',vendor:'Demo vendor',paidBy:'Rizal',paymentMethod:'Credit Card',status:'Pending',budgeted:3200,actual:2899,rizalPct:50,diyanaPct:50}];
export const demoSurvey:SurveyItem[]=[
{id:'SV-001',surveyDate:'2026-10-04',itemType:'Appliance',mainCategory:'Appliances',subcategory:'Refrigerator',description:'4-door refrigerator',vendor:'Store A',contact:'',optionModel:'Option A',estimatedCost:3999,actualCost:0,surveyedBy:'Both',rating:4,decision:'Shortlisted',paidBy:'Joint Account',paymentMethod:'Credit Card',expenseStatus:'Planned',rizalPct:50,diyanaPct:50,notes:'Compare warranty and delivery.'},
{id:'SV-002',surveyDate:'2026-10-05',itemType:'Appliance',mainCategory:'Appliances',subcategory:'Air conditioning',description:'2HP living hall air conditioner',vendor:'Store B',contact:'',optionModel:'Option B',estimatedCost:2899,actualCost:0,surveyedBy:'Rizal',rating:5,decision:'Considering',paidBy:'Rizal',paymentMethod:'Bank Transfer',expenseStatus:'Planned',rizalPct:50,diyanaPct:50}];
