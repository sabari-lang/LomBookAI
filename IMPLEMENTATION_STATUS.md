# Personal Effects (UB) Module - Implementation Status

## ✅ COMPLETED

### Service Layer (100% Complete)
All 4 API service files created with proper UB endpoint transformations:
- ✅ `src/services/personal-effects/airInbound/peAirInboundApi.js`
- ✅ `src/services/personal-effects/airOutbound/peAirOutboundApi.js`
- ✅ `src/services/personal-effects/oceanInbound/peOceanInboundApi.js`
- ✅ `src/services/personal-effects/oceanOutbound/peOceanOutboundApi.js`

**Key Transformations Applied:**
- `/air-inbound/` → `/ub/air-inbound/`
- `/air-outbound/` → `/ub/air-outbound/`
- `/ocean-inbound/` → `/ub/ocean-inbound/`
- `/ocean-outbound/` → `/ub/ocean-outbound/`
- `/houses/` → `/house/` (singular for UB)
- Ocean: `hawb` → `hbl`
- Accounting: `job/{jobNo}/hawb/{hawb}/accounting/...` → `shipments/{ubId}/provisional-entries` or `shipments/{ubId}/accounting-entries`

## ⏳ REMAINING WORK

### Components (0% Complete - 40+ files needed)

#### JobCreation Components (4 files - CRITICAL)
- [ ] `src/components/personal-effects/air-inbound/JobCreation.jsx`
- [ ] `src/components/personal-effects/air-outbound/JobCreation.jsx`
- [ ] `src/components/personal-effects/ocean-inbound/JobCreation.jsx`
- [ ] `src/components/personal-effects/ocean-outbound/JobCreation.jsx`

**Required Transformations:**
1. Import PE services instead of Commercial
2. Use `pe-ub-` prefix for React Query keys
3. Apply `applyJobDefaults()` to `defaultValues`
4. Watch `shipment` term and call `applyShipmentTermPaymentLogic()`
5. Re-apply defaults on submit: `applyJobDefaults()`, `applyShipmentTermPaymentLogic()`, `normalizeJobDates()`
6. Change sessionStorage keys: `peUbMasterData` instead of `masterAirwayData`

#### Main Components (8 files)
- [ ] `src/components/personal-effects/air-inbound/PEAirInboundComp.jsx`
- [ ] `src/components/personal-effects/air-inbound/PEAirInboundClosedComp.jsx`
- [ ] `src/components/personal-effects/air-outbound/PEAirOutboundComp.jsx`
- [ ] `src/components/personal-effects/air-outbound/PEAirOutboundClosedComp.jsx`
- [ ] `src/components/personal-effects/ocean-inbound/PEOceanInboundComp.jsx`
- [ ] `src/components/personal-effects/ocean-inbound/PEOceanInboundClosedComp.jsx`
- [ ] `src/components/personal-effects/ocean-outbound/PEOceanOutboundComp.jsx`
- [ ] `src/components/personal-effects/ocean-outbound/PEOceanOutboundClosedComp.jsx`

**Required Transformations:**
1. Import PE services
2. Use `pe-ub-` prefix for React Query keys
3. Update all API calls to use PE service functions

#### House Components (12+ files)
For each mode:
- [ ] `masterreport/houseairwaybill/CreateHouse.jsx` (or `housebillofladding` for ocean)
- [ ] `masterreport/houseairwaybill/HouseAirwaybill.jsx` (or `HouseBillOfLaddingSeaInbound.jsx`)
- [ ] `masterreport/houseairwaybill/HouseStatusUpdate.jsx`

**Required Transformations:**
1. Import PE services
2. Use `/house/` (singular) endpoints
3. For ocean: use `hbl` instead of `hawb`
4. Use `pe-ub-` prefix for React Query keys

#### Accounting Components (20+ files)
For each mode:
- [ ] `masterreport/housereport/provisionalentry/ProvisionalEntry.jsx`
- [ ] `masterreport/housereport/provisionalentry/CreateProvisionalEntry.jsx`
- [ ] `masterreport/housereport/provisionalentry/RaiseAccountingEntry.jsx`
- [ ] `masterreport/housereport/accountingentrycus/AccountingEntryCus.jsx`
- [ ] `masterreport/housereport/accountingentrycus/ViewCustomerAccount.jsx`
- [ ] `masterreport/housereport/accountingentryvendor/AccountingEntryVen.jsx`
- [ ] `masterreport/housereport/accountingentryvendor/RaisingEntryVendor.jsx`
- [ ] `masterreport/housereport/accountingentryvendor/ViewVendorAccount.jsx`

**CRITICAL: Accounting Endpoint Changes**
- Commercial: `/air-inbound/houses/job/${jobNo}/hawb/${hawb}/accounting/...`
- PE (UB): `/ub/air-inbound/shipments/${ubId}/provisional-entries` or `/ub/air-inbound/shipments/${ubId}/accounting-entries`
- **Must fetch job/house first to get `ubId`, then use it for accounting calls**

#### Other Components (8+ files)
- [ ] Arrival Notice components (2 per inbound mode = 4 files)
- [ ] Job Costing components (1 per mode = 4 files)

### Pages (0% Complete - 4 files)
- [ ] `src/pages/personal-effects/air-inbound/PEAirInbound.jsx`
- [ ] `src/pages/personal-effects/air-outbound/PEAirOutbound.jsx`
- [ ] `src/pages/personal-effects/ocean-inbound/PEOceanInbound.jsx`
- [ ] `src/pages/personal-effects/ocean-outbound/PEOceanOutbound.jsx`

**Required:**
- Import PE components (not Commercial)
- Use same structure as Commercial pages

### Routing (0% Complete)
- [ ] Update `src/components/common/navigation/Navigation.jsx` with all PE routes
- [ ] Update `src/components/common/sidebar/Sidebar.jsx` with Personal Effects (UB) menu group

## Implementation Pattern

### For Each Component File:

1. **Copy Commercial component** to PE location
2. **Update imports:**
   ```javascript
   // FROM
   import { createAirInboundJob } from "./Api";
   
   // TO
   import { createUbAirInboundJob } from "../../../../services/personal-effects/airInbound/peAirInboundApi";
   ```

3. **Update query keys:**
   ```javascript
   // FROM
   queryClient.invalidateQueries(["airInboundJobs"]);
   
   // TO
   queryClient.invalidateQueries(["pe-ub-air-inbound-master"]);
   ```

4. **Update sessionStorage keys:**
   ```javascript
   // FROM
   sessionStorage.getItem("masterAirwayData");
   
   // TO
   sessionStorage.getItem("peUbMasterData");
   ```

5. **For JobCreation components, add job defaults:**
   ```javascript
   import { applyJobDefaults, applyShipmentTermPaymentLogic, normalizeJobDates } from "../../../../utils/jobDefaults";
   
   // In defaultValues
   defaultValues: applyJobDefaults(initialValues)
   
   // Watch shipment term
   const shipment = watch("shipment");
   useEffect(() => {
       const currentValues = getValues();
       const updated = applyShipmentTermPaymentLogic({ ...currentValues, shipment });
       setValue("wtvalPP", updated.wtvalPP || "");
       setValue("otherPP", updated.otherPP || "");
       setValue("coll1", updated.coll1 || "");
       setValue("coll2", updated.coll2 || "");
   }, [shipment, setValue, getValues]);
   
   // On submit
   let payload = { ...data };
   payload = applyJobDefaults(payload);
   payload = applyShipmentTermPaymentLogic(payload);
   payload = normalizeJobDates(payload);
   ```

6. **For accounting components, use ubId:**
   ```javascript
   // First fetch house to get ubId
   const houseData = await getUbAirInboundHouseByHawb(jobNo, hawb);
   const ubId = houseData?.ubId;
   
   // Then use ubId for accounting calls
   const provisionals = await getUbAirInboundProvisionals(ubId);
   ```

## Next Steps

1. **Priority 1**: Create all 4 JobCreation components (with job defaults)
2. **Priority 2**: Create main comp components (8 files)
3. **Priority 3**: Create House components (12+ files)
4. **Priority 4**: Create Accounting components (20+ files) - **Note ubId requirement**
5. **Priority 5**: Create other components (8+ files)
6. **Priority 6**: Create page files (4 files)
7. **Priority 7**: Update routing and sidebar

## Notes

- All PE components must be completely separate from Commercial
- No imports from Commercial pages/components into PE code
- Keep UI/UX identical to Commercial
- Use `pe-ub-` prefix for all React Query keys
- Use `peUb` prefix for all localStorage/sessionStorage keys
- Dashboard UI must remain unchanged

