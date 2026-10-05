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
