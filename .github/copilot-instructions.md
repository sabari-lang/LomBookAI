Welcome! These instructions are tuned to make an AI coding assistant productive quickly in this repo.

Top-level overview
- This is a React (Vite) + Electron front-end app (see `package.json`): run with `npm run dev`, build with `npm run build`, create distributable with `npm run dist`.
- Major patterns: feature folders under `src/components/` (sales, purchases, items, reports, etc). Each feature contains `api.js`, UI screens (`New*.jsx`, `View*.jsx`) and smaller subcomponents.

Key patterns to follow
- Forms follow a consistent implementation: `react-hook-form` + `useFieldArray` for items + `useWatch` for reactive totals. Look at `src/components/sales/quotes/NewQuote.jsx` for a full example.
- Data fetching and mutations use React Query (`@tanstack/react-query`): queries in components call functions in `components/<area>/api.js` and use `useQuery` / `useMutation`. Example: `src/components/sales/invoice/*`.
- API helper conventions: responses are normalized using `src/utils/extractItems.js` (safe extraction of array payloads). Use this rather than assuming response shapes.
- Error handling: use `src/utils/handleProvisionalError.js` consistently. It supports an optional `customMessage` param that shows user-friendly alerts immediately.

Conversion / creation-from-other-documents pattern
- Several pages implement 'convert' flows where a view page routes to a `New*` form and passes metadata in `location.state`. The canonical fields are:
  - `isNew: true`, `sourceQuoteId`, `sourceQuoteNumber`, `sourceType`, `conversionTimestamp`.
- `New*` forms must detect `isNew` (e.g. `const isNewFromQuote = state?.isNew === true`) and ensure conversion always POSTs (create) rather than PUT (update). See `src/components/sales/salesorder/NewSalesOrder.jsx` and `src/components/sales/quotes/ViewQuote.jsx` for examples.

UI & UX conventions
- Date fields use `moment(...).format('YYYY-MM-DD')` on reset/load.
- File upload flow: files are converted via `URL.createObjectURL` then saved into `attachments` in form values. Check `NewInvoice.jsx` / `NewBill.jsx` for details.
- Dropdowns that perform actions use `react-bootstrap` `Dropdown` in view pages (reliable, production-ready choice used across repo).

Where to change code safely
- Modify business logic inside `src/components/<area>/*` — keep API function names in `src/components/<area>/api.js` intact (used across views and forms).
- For adding new queries/mutations, follow existing `useQuery` / `useMutation` patterns and call `queryClient.invalidateQueries` for related keys.

Build & developer workflow notes
- Run locally: `npm run dev` (starts Vite + Electron using concurrently and wait-on). If changing electron code, restart may be necessary.
- Build for production: `npm run build` (Vite) then `npm run dist` to package with electron-builder.

Searchable anchors / examples
- Form reference: `src/components/sales/quotes/NewQuote.jsx`, `src/components/sales/invoice/NewInvoice.jsx`.
- Convert-flow reference: `src/components/sales/quotes/ViewQuote.jsx`, `src/components/sales/salesorder/NewSalesOrder.jsx`.
- Utilities: `src/utils/handleProvisionalError.js`, `src/utils/extractItems.js`.

If anything in here is unclear or incomplete, please point to specific files and I'll iterate the instructions.
