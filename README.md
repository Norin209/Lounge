This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Live expense sheet

The admin expense dashboard reads its data directly from Google Sheets through
the server-side Google Sheets API. The service-account key is never sent to the
browser.

1. Enable the Google Sheets API and Google Drive API in a Google Cloud project.
2. Create a service account and download its JSON key.
3. Share the expense spreadsheet and salary workbook with the service account's
   `client_email` as a Viewer.
4. Copy `.env.example` to `.env.local` and set the service-account email and
   private key. On Netlify, add the same values under Site configuration →
   Environment variables.

Expense tabs must be named like `July-2026`. The dashboard reads the existing
category blocks in columns B–AK and refreshes live data every minute. The salary
workbook may remain an Excel `.xlsx` file in Google Drive; its monthly `Total
Salary` summary is combined into the matching month as the `Salaries` category.
Final payments after borrowing and deductions remain visible in the payroll
comparison panel.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
