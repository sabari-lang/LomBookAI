# Clearance Pending Report — Filter Contract (Frontend → Backend)

Source: `src/features/reports/config/reportDefinitions.js`

## Branch
- Value/label (static fallback): `HEAD OFFICE`, `ANATHAPUR`, `BANGALORE`, `CHENNAI`, `HYDERABAD`, `MUMBAI`, `COCHIN`, `All`
- Final endpoint: `/logistics-reports/filters/branches`

## Based On
- Values/labels: `All`, `Exclusive`, `Included Job`

## Status
- Values/labels (static): `All`, `Open`, `Not Arrived`, `Today Planning`, `Awaiting for Duty`, `Queries from Customs`, `Awaiting CEPA`, `OOC Completed`, `Delivered`, `Others`, `Clearance Completed`, `Pending for Query`
- Final endpoint: `/logistics-reports/filters/statuses`

## Incoterms
- Values/labels (static): `All`, `CIF`, `C & F`, `CAF`, `CFR`, `CPT`, `DAP`, `DDP`, `DDU`, `EXW`, `FAS`, `FCA`, `FOB`
- Final endpoint: `/logistics-reports/filters/incoterms`

## Search By
- Values → Labels:
  - `ALL` → All
  - `SHIPPER_INVOICE_NO` → Shipper Invoice No
  - `VESSEL_NAME` → Vessel Name
  - `FLIGHT_NO` → Flight No
  - `REMARKS` → Remarks

## Order By
- Values → Labels:
  - `CONSIGNEE_NAME` → Consignee Name
  - `SHIPPER_NAME` → Shipper Name

## Sort By
- Values/labels: `Ascending`, `Descending` (ensure backend accepts these as-is or map to `asc`/`desc`)

## Notes
- `optionsEndpoint` entries indicate the planned backend endpoints; current static lists are fallbacks for UI.
- Backend should accept the **values** exactly as listed above; labels are for display only.

