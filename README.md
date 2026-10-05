# Idaman Sari Expenses — React App

Responsive **React + TypeScript + Vite** web app based on the workflow in the Idaman Sari Expenses Google Sheet for Rizal and Diyana.

## Included
- One-time setup/renovation and monthly household expenses
- Budget vs actual tracking
- Rizal/Diyana splits and paid/net-position settlement
- Survey / quotation comparison
- **Workflow rule:** only Survey items set to `Confirmed` enter expense totals
- Category management with active/inactive records
- Date inputs use the phone/desktop native date picker; displayed dates use `dd-mm-yyyy`
- Light/dark mode
- Three live interface options in Settings: **Calm Home**, **Smart Ledger**, **Project Board**
- Responsive mobile bottom navigation and desktop sidebar
- Browser localStorage demo mode
- Supabase-ready database/Auth/storage schema
- Vercel SPA configuration
- GitHub Actions build workflow

## Run
```bash
npm install
npm run dev
```

## Free database recommendation
Use **Supabase Free** for the first version. It combines Postgres, Auth for Rizal/Diyana, storage for receipts/quotes, and Row Level Security. The starter SQL is in `supabase/schema.sql`.

## Connect Supabase
1. Create a Supabase project.
2. Run `supabase/schema.sql` in its SQL editor.
3. Copy `.env.example` to `.env.local`.
4. Fill `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
5. Replace the localStorage persistence in `src/App.tsx` with Supabase queries/mutations. The SQL schema mirrors the React types.

## Google Sheet mirror
The app can mirror every user-created or updated expense, survey item, budget and category to the original **Idaman Sari Expenses** workbook.

1. Open the workbook and create a bound Google Apps Script project.
2. Copy `google-apps-script/Code.gs` into the project.
3. Add a Script Property named `SHEET_SYNC_SECRET` with a long random value.
4. Deploy the script as a Web App that executes as the spreadsheet owner.
5. Add the deployment URL to Vercel as `GOOGLE_SHEETS_WEBHOOK_URL`.
6. Add the same secret to Vercel as the sensitive variable `GOOGLE_SHEETS_WEBHOOK_SECRET`.

The browser never receives the Sheet webhook URL or secret. The Vercel function validates the app origin and record shape, then performs an ID-based upsert through Apps Script. The workbook's formulas, dropdowns and formatting are preserved. Budget Plan and Category Management receive a hidden sync-ID column so later updates target the same row.

## GitHub + Vercel
1. Create a GitHub repo and push this folder.
2. Import that repo into Vercel.
3. Vercel will detect Vite. Build command: `npm run build`; output: `dist`.
4. Add Supabase env vars in Vercel if enabled.

The included `vercel.json` makes SPA navigation work on direct visits.

## Recommended production steps
- connect Supabase data queries/mutations
- enable magic-link or email/password authentication
- add Rizal and Diyana to one `Idaman Sari` household
- migrate existing Google Sheet data
- implement receipt/quotation file uploads
- keep the Google Sheet as read-only backup/export, or retire it after validation
