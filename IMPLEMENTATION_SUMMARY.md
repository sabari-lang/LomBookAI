# Personal Effects (UB) Module - Implementation Summary

## Overview
Complete feature-parity duplication of Commercial module into Personal Effects (UB) with separate routes, components, and services.

## Endpoint Transformations
- `/air-inbound/` → `/ub/air-inbound/`
- `/air-outbound/` → `/ub/air-outbound/`
- `/ocean-inbound/` → `/ub/ocean-inbound/`
- `/ocean-outbound/` → `/ub/ocean-outbound/`
- `/houses/` → `/house/` (singular for UB)
- Ocean: `hawb` → `hbl`
- Accounting: `job/{jobNo}/hawb/{hawb}/accounting/...` → `shipments/{ubId}/provisional-entries` or `shipments/{ubId}/accounting-entries`

## Files Created

### Services (API Files)
1. `src/services/personal-effects/airInbound/peAirInboundApi.js` ✅
2. `src/services/personal-effects/airOutbound/peAirOutboundApi.js` (to create)
3. `src/services/personal-effects/oceanInbound/peOceanInboundApi.js` (to create)
4. `src/services/personal-effects/oceanOutbound/peOceanOutboundApi.js` (to create)

### Components Structure (per mode)
For each mode (air-inbound, air-outbound, ocean-inbound, ocean-outbound):
- JobCreation.jsx (with job defaults + shipment term logic)
- AirInboundComp.jsx / AirInboundClosedComp.jsx (or equivalent)
- masterreport/houseairwaybill/ (or housebillofladding for ocean):
  - CreateHouse.jsx
  - HouseAirwaybill.jsx (or HouseBillOfLaddingSeaInbound.jsx)
  - HouseStatusUpdate.jsx
- masterreport/housereport/:
  - provisionalentry/ (ProvisionalEntry.jsx, RaiseAccountingEntry.jsx, CreateProvisionalEntry.jsx)
  - accountingentrycus/ (AccountingEntryCus.jsx, ViewCustomerAccount.jsx)
  - accountingentryvendor/ (AccountingEntryVen.jsx, RaisingEntryVendor.jsx, ViewVendorAccount.jsx)
  - arrivalnotice/ (ArrivalNotice.jsx, CreateArrivalNotice.jsx)
  - jobcosting/ (JobCosting.jsx)

### Pages
- `src/pages/personal-effects/air-inbound/PEAirInbound.jsx`
- `src/pages/personal-effects/air-outbound/PEAirOutbound.jsx`
- `src/pages/personal-effects/ocean-inbound/PEOceanInbound.jsx`
- `src/pages/personal-effects/ocean-outbound/PEOceanOutbound.jsx`

### Routing
- Update `src/components/common/navigation/Navigation.jsx` with all PE routes
- Update `src/components/common/sidebar/Sidebar.jsx` with Personal Effects (UB) menu group

## Key Implementation Notes

1. **Job Defaults**: All PE JobCreation components must use `applyJobDefaults()` and `applyShipmentTermPaymentLogic()` from `src/utils/jobDefaults.js`

2. **ubId Resolution**: For accounting endpoints, fetch job/house first to get ubId, then use it for accounting calls

3. **Query Keys**: Use `pe-ub-` prefix for all React Query keys (e.g., `pe-ub-air-inbound-master`)

4. **Session Storage**: Use `peUbMasterData` and `peUbHouseData` instead of `masterAirwayData` and `houseAirwayData`

5. **Separation**: No imports from Commercial pages/components into PE code

## Status
- ✅ Air Inbound service file created
- ⏳ Remaining service files (3)
- ⏳ All component files (40+)
- ⏳ Page files (4)
- ⏳ Routing updates
- ⏳ Sidebar updates

