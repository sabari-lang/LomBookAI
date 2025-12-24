# Personal Effects (UB) Module - Complete Implementation Guide

## Status Summary
✅ **Service Layer Complete**: All 4 API service files created
- `src/services/personal-effects/airInbound/peAirInboundApi.js`
- `src/services/personal-effects/airOutbound/peAirOutboundApi.js`
- `src/services/personal-effects/oceanInbound/peOceanInboundApi.js`
- `src/services/personal-effects/oceanOutbound/peOceanOutboundApi.js`

⏳ **Components**: Need to create 40+ component files
⏳ **Pages**: Need to create 4 page files
⏳ **Routing**: Need to update Navigation.jsx and Sidebar.jsx

## Key Transformations Required

### 1. Import Changes
```javascript
// Commercial
import { createAirInboundJob, updateAirInboundJob } from "./Api";

// PE (UB)
import { createUbAirInboundJob, updateUbAirInboundJob } from "../../../../services/personal-effects/airInbound/peAirInboundApi";
```

### 2. Query Key Changes
```javascript
// Commercial
queryClient.invalidateQueries(["airInboundJobs"]);

// PE (UB)
queryClient.invalidateQueries(["pe-ub-air-inbound-master"]);
```

### 3. Session Storage Changes
```javascript
// Commercial
sessionStorage.getItem("masterAirwayData");

// PE (UB)
sessionStorage.getItem("peUbMasterData");
```

### 4. Job Defaults Integration
All PE JobCreation components MUST:
- Import: `import { applyJobDefaults, applyShipmentTermPaymentLogic, normalizeJobDates } from "../../../../utils/jobDefaults";`
- Apply defaults on initialization: `defaultValues: applyJobDefaults(initialValues)`
- Watch shipment term and apply logic: `useEffect(() => { ... }, [shipmentTerm])`
- Re-apply on submit: `payload = applyJobDefaults(payload); payload = applyShipmentTermPaymentLogic(payload);`

### 5. Field Name Mapping
For shipment term payment logic, map to actual field names:
- `shipmentTerm` or `shipment` → check actual field name
- `wtValPp` / `wtvalPP` → check actual field name
- `otherPp` / `otherPP` → check actual field name
- `wtValColl` / `coll1` → check actual field name
- `otherColl` / `coll2` → check actual field name

### 6. Accounting Endpoint Changes
For accounting components:
- Commercial: `/air-inbound/houses/job/${jobNo}/hawb/${hawb}/accounting/...`
- PE (UB): `/ub/air-inbound/shipments/${ubId}/provisional-entries` or `/ub/air-inbound/shipments/${ubId}/accounting-entries`
- **Important**: Need to fetch job/house first to get `ubId`, then use it for accounting calls

### 7. Ocean-Specific Changes
- Use `hbl` instead of `hawb` for ocean modes
- Use `mbl` instead of `mawb` for ocean master bill

## Component Checklist

### Air Inbound
- [ ] `src/components/personal-effects/air-inbound/JobCreation.jsx`
- [ ] `src/components/personal-effects/air-inbound/PEAirInboundComp.jsx`
- [ ] `src/components/personal-effects/air-inbound/PEAirInboundClosedComp.jsx`
- [ ] `src/components/personal-effects/air-inbound/masterreport/houseairwaybill/CreateHouse.jsx`
- [ ] `src/components/personal-effects/air-inbound/masterreport/houseairwaybill/HouseAirwaybill.jsx`
- [ ] `src/components/personal-effects/air-inbound/masterreport/houseairwaybill/HouseStatusUpdate.jsx`
- [ ] `src/components/personal-effects/air-inbound/masterreport/housereport/provisionalentry/...` (3 files)
- [ ] `src/components/personal-effects/air-inbound/masterreport/housereport/accountingentrycus/...` (2 files)
- [ ] `src/components/personal-effects/air-inbound/masterreport/housereport/accountingentryvendor/...` (3 files)
- [ ] `src/components/personal-effects/air-inbound/masterreport/housereport/arrivalnotice/...` (2 files)
- [ ] `src/components/personal-effects/air-inbound/masterreport/housereport/jobcosting/...` (1 file)

### Air Outbound
- [ ] Similar structure to Air Inbound (12+ files)

### Ocean Inbound
- [ ] Similar structure, but use `hbl` instead of `hawb` (12+ files)

### Ocean Outbound
- [ ] Similar structure, but use `hbl` instead of `hawb` (12+ files)

## Page Files Needed
- [ ] `src/pages/personal-effects/air-inbound/PEAirInbound.jsx`
- [ ] `src/pages/personal-effects/air-outbound/PEAirOutbound.jsx`
- [ ] `src/pages/personal-effects/ocean-inbound/PEOceanInbound.jsx`
- [ ] `src/pages/personal-effects/ocean-outbound/PEOceanOutbound.jsx`

## Routing Updates Needed
- [ ] Update `src/components/common/navigation/Navigation.jsx` with all PE routes
- [ ] Update `src/components/common/sidebar/Sidebar.jsx` with Personal Effects (UB) menu group

## Next Steps
1. Create PE JobCreation components (4 files) - **CRITICAL - Must include job defaults**
2. Create PE main comp components (8 files - open + closed for each mode)
3. Create PE House components (12+ files)
4. Create PE Accounting components (20+ files)
5. Create PE page files (4 files)
6. Update routing and sidebar

