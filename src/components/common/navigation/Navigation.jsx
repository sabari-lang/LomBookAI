import React from "react";
import { BrowserRouter, Routes, Route, HashRouter, Navigate } from "react-router-dom";
import Layout from "../layout/Layout";
import Home from "../../../pages/homepage/Home";
import NewCustomer from "../../sales/customers/NewCustomer";
import ViewCustomer from "../../sales/customers/ViewCustomer";
import ViewQuote from "../../sales/quotes/ViewQuote";
import NewQuote from "../../sales/quotes/NewQuote";
import ViewSalesOrder from "../../sales/salesorder/ViewSalesOrder";
import NewSalesOrder from "../../sales/salesorder/NewSalesOrder";
import ViewDeliveryChallan from "../../sales/deliverychallan/ViewDeliveryChallan";
import NewDeliveryChallan from "../../sales/deliverychallan/NewDeliveryChallan";
import ViewInvoice from "../../sales/invoice/ViewInvoice";
import NewInvoice from "../../sales/invoice/NewInvoice";
import ViewCreditNotes from "../../sales/creditnotes/ViewCreditNotes";
import NewCreditNotes from "../../sales/creditnotes/NewCreditNotes";
import NewRecurringInvoice from "../../sales/recurringinvoice/NewRecurringInvoice";
import ViewRecurringInvoice from "../../sales/recurringinvoice/ViewRecurringInvoice";
import AllPayment from "../../sales/paymentreceived/AllPayment";
import RecordPayment from "../../sales/paymentreceived/RecordPayment";

import NewVendor from "../../purchases/vendors/NewVendor";
import Vendors from "../../purchases/vendors/Vendors";
import Expenses from "../../purchases/expenses/Expenses";
import NewExpenses from "../../purchases/expenses/NewExpenses";
import RecurringExpense from "../../purchases/recurringexpenses/RecurringExpense";
import NewRecurringExpense from "../../purchases/recurringexpenses/NewRecurringExpense";
import Bills from "../../purchases/bills/Bills";
import NewBill from "../../purchases/bills/NewBill";
import RecurringBills from "../../purchases/recurringbills/RecurringBills";
import NewRecurringBills from "../../purchases/recurringbills/NewRecurringBills";
import Payments from "../../purchases/paymentmade/Payments";
import VendorCredits from "../../purchases/vendorcredits/VendorCredits";
import NewVendorCredit from "../../purchases/vendorcredits/NewVendorCredit";
import PurchaseReceives from "../../purchases/purchasereceives/PurchaseReceives";
import PurchaseOrders from "../../purchases/purchaseorders/PurchaseOrders";


import Items from "../../items/Items";
import NewItem from "../../items/NewItem";

import NewPurchaseOrder from "../../purchases/purchaseorders/NewPurchaseOrder";
import NewPurchaseReceives from "../../purchases/purchasereceives/NewPurchaseReceives";
import NewPayment from "../../purchases/paymentmade/NewPayment";

import Banking from "../../banking/Banking";
import AddBank from "../../banking/AddBank";
import Reports from "../../../pages/report/Reports";
import { Provider } from "react-redux";
import { InvoiceStore, persistor } from "../../redux/invoicestore/InvoiceStore";
import { PersistGate } from "redux-persist/integration/react";
import InvoiceAgent from "../../filedocument/InvoiceAgent";
import InvoiceAgentForm from "../../filedocument/InvoiceAgentForm";
import InvoiceDownload from "../../filedocument/InvoiceDownload";
import DownloadSales from "../../downloadinvoices/DownloadSales";
import DayBook from "../../reports/daybook/DayBook";
import AllTransaction from "../../reports/alltransactions/Alltransaction";
import BillwiseProfit from "../../reports/billwiseprofit/BillwiseProfit";


import Quotation from "../../sales/reports/Quotation";
import DownloadSalesOrder from "../../sales/reports/DownloadSalesOrder";
import AskAssistant from "../askassistant/AskAssistant";
import AirOutbound from "../../../pages/logistics/bl/airoutbound/AirOutbound";
import AirInbound from "../../../pages/logistics/bl/airinbound/AirInbound";
import OceanInbound from "../../../pages/logistics/bl/oceaninbound/OceanInbound";
import OceanOutbound from "../../../pages/logistics/bl/oceanoutbound/OceanOutbound";
import FormLayout from "../../../layouts/FormLayout";
import JobCreation from "../../logisticsservices/bl/airinbound/JobCreation";
import HouseAirwaybill from "../../logisticsservices/bl/airinbound/masterreport/houseairwaybill/HouseAirwaybill";
import ProvisionalEntry from "../../logisticsservices/bl/airinbound/masterreport/housereport/provisionalentry/ProvisionalEntry";
import CreateProvisionalEntry from "../../logisticsservices/bl/airinbound/masterreport/housereport/provisionalentry/CreateProvisionalEntry";
import ViewCustomerAccount from "../../logisticsservices/bl/airinbound/masterreport/housereport/accountingentrycus/ViewCustomerAccount";
import ViewVendorAccount from "../../logisticsservices/bl/airinbound/masterreport/housereport/accountingentryvendor/ViewVendorAccount";
import ViewCustomerAccountOut from "../../logisticsservices/bl/airoutbound/masterreport/housereport/accountingentrycus/ViewCustomerAccountOut";
import ViewVendorAccountOut from "../../logisticsservices/bl/airoutbound/masterreport/housereport/accountingentryvendor/ViewVendorAccountOut";
import ViewCustomerAccountSeaIn from "../../logisticsservices/bl/oceaninbound/masterreport/housereport/accountingentrycus/ViewCustomerAccountSeaIn";
import ViewVendorAccountSeaIn from "../../logisticsservices/bl/oceaninbound/masterreport/housereport/accountingentryvendor/ViewVendorAccountSeaIn";
import ViewCustomerAccountSeaOut from "../../logisticsservices/bl/oceanoutbound/masterreport/housereport/accountingentrycus/ViewCustomerAccountSeaOut";
import ViewVendorAccountSeaOut from "../../logisticsservices/bl/oceanoutbound/masterreport/housereport/accountingentryvendor/ViewVendorAccountSeaOut";
import HouseAirwayBillOut from "../../logisticsservices/bl/airoutbound/masterreport/houseairwaybill/HouseAirwayBillOut";
import ProvisionalEntryOut from "../../logisticsservices/bl/airoutbound/masterreport/housereport/provisionalentry/ProvisionalEntryOut";
import CreateProvisionalEntryOut from "../../logisticsservices/bl/airoutbound/masterreport/housereport/provisionalentry/CreateProvisionalEntryOut";
import HouseBillOfLaddingSeaInbound from "../../logisticsservices/bl/oceaninbound/masterreport/housebillofladding/HouseBillOfLaddingSeaInbound";
import ProvisionalEntrySeaIn from "../../logisticsservices/bl/oceaninbound/masterreport/housereport/provisionalentry/ProvisionalEntrySeaIn";
import CreateProvisionalEntrySeaIn from "../../logisticsservices/bl/oceaninbound/masterreport/housereport/provisionalentry/CreateProvisionalEntrySeaIn";
import HouseBillOfLaddingSeaOutbound from "../../logisticsservices/bl/oceanoutbound/masterreport/housebillofladding/HouseBillOfLaddingSeaOutbound";
import ProvisionalEntrySeaOut from "../../logisticsservices/bl/oceanoutbound/masterreport/housereport/provisionalentry/ProvisionalEntrySeaOut";
import CreateProvisionalEntrySeaOut from "../../logisticsservices/bl/oceanoutbound/masterreport/housereport/provisionalentry/CreateProvisionalEntrySeaOut";
import AccountingEntryVendorInvoiceSeaOut from "../../logisticsservices/bl/oceanoutbound/masterreport/housereport/accountingentryvendor/AccountingEntryVendorInvoiceSeaOut";
import PrintVendorPurchase from "../../logisticsservices/bl/oceanoutbound/masterreport/housereport/accountingentryvendor/vendorreport/PrintVendorPurchase";
import ViewUserScreen from "../../../pages/usermanagement/ViewUserScreen";
import Login from "../../../pages/usermanagement/Login";
import DownloadInvoice from "../../sales/reports/DownloadInvoice";
import DeliveryChallanReport from "../../sales/reports/DeliveryChallanReport";
import PaymentReceivedReport from "../../sales/reports/PaymentReceivedReport";
import CreditNoteReport from "../../sales/reports/CreditNoteReport";
import RecurringInvoiceReport from "../../sales/reports/RecurringInvoiceReport";
import PurchaseOrderReport from "../../purchases/reports/PurchaseOrderReport";
import BillReport from "../../purchases/reports/BillReport";
import RecurringBillReport from "../../purchases/reports/RecurringBillReport";
import PaymentMadeReport from "../../purchases/reports/PaymentMadeReport";
import VendorCreditReport from "../../purchases/reports/VendorCreditReport";

// Logistics Reports
import ReportsLayout from "../../../features/reports/components/ReportsLayout";
import ClearancePendingReportPage from "../../../features/reports/pages/ClearancePendingReportPage";
import InvoicePendingReportPage from "../../../features/reports/pages/InvoicePendingReportPage";
import DespatchPendingReportPage from "../../../features/reports/pages/DespatchPendingReportPage";
import InvoiceReportPage from "../../../features/reports/pages/InvoiceReportPage";
import BLSearchReportPage from "../../../features/reports/pages/BLSearchReportPage";
import DepositRefundReportPage from "../../../features/reports/pages/DepositRefundReportPage";
import PendingForQueryReportPage from "../../../features/reports/pages/PendingForQueryReportPage";
import JobClosePendingReportPage from "../../../features/reports/pages/JobClosePendingReportPage";
import JobCostingReportPage from "../../../features/reports/pages/JobCostingReportPage";
import JobCostingHeadDetailReportPage from "../../../features/reports/pages/JobCostingHeadDetailReportPage";


const Navigation = () => {


  const storedAuth = sessionStorage.getItem("auth") ?? localStorage.getItem("auth");
  const isAuth = Boolean(storedAuth);


  return (
    <Provider store={InvoiceStore}>
      <PersistGate loading={null} persistor={persistor}>
        <HashRouter>
          <Routes>
            {/* All routes that use sidebar go inside this Layout */}

            {!isAuth && <Route path="*" element={<Login />} />}



            {isAuth && (
              <>
                <Route path="/" element={<Layout />}>
                  {/* Default route inside Layout */}
                  <Route index element={<Home />} />

                  {/* ITEMS */}
                  <Route path="/items" element={<Items />} />
                  <Route path="/newitem" element={<FormLayout><NewItem /></FormLayout>} />

                  <Route path="/newcustomer" element={<FormLayout><NewCustomer /></FormLayout>} />
                  <Route path="/viewcustomer" element={<ViewCustomer />} />
                  <Route path="/quotes" element={<ViewQuote />} />
                  <Route path="/newquotes" element={<FormLayout><NewQuote /></FormLayout>} />
                  <Route path="/salesorders" element={<ViewSalesOrder />} />
                  <Route path="/newsalesorder" element={<FormLayout><NewSalesOrder /></FormLayout>} />
                  <Route path="/deliverychallans" element={<ViewDeliveryChallan />} />
                  <Route path="/newdeliverychallan" element={<FormLayout><NewDeliveryChallan /></FormLayout>} />
                  <Route path="/invoices" element={<ViewInvoice />} />
                  <Route path="/newinvoice" element={<FormLayout><NewInvoice /></FormLayout>} />
                  <Route path="/creditnotes" element={<ViewCreditNotes />} />
                  <Route path="/newcreditnotes" element={<FormLayout><NewCreditNotes /></FormLayout>} />
                  <Route path="/recurring" element={<ViewRecurringInvoice />} />
                  <Route path="/newcurring" element={<FormLayout><NewRecurringInvoice /></FormLayout>} />
                  <Route path="/payments" element={<AllPayment />} />
                  <Route path="/recordpayment" element={<FormLayout><RecordPayment /></FormLayout>} />
                  {/* SALES END */}



                  {/* PURCHASE START */}
                  <Route path="/vendors" element={<Vendors />} />
                  <Route path="/newvendor" element={<FormLayout><NewVendor /></FormLayout>} />
                  <Route path="/expenses" element={<Expenses />} />
                  <Route path="/newexpense" element={<FormLayout><NewExpenses /></FormLayout>} />
                  <Route path="/recurringexpenses" element={<RecurringExpense />} />
                  <Route path="/newrecurringexpense" element={<FormLayout><NewRecurringExpense /></FormLayout>} />
                  <Route path="/bills" element={<Bills />} />
                  <Route path="/newbill" element={<FormLayout><NewBill /></FormLayout>} />
                  <Route path="/recurringbills" element={<RecurringBills />} />
                  <Route path="/newrecurringbill" element={<FormLayout><NewRecurringBills /></FormLayout>} />
                  <Route path="/paymentsmade" element={<Payments />} />
                  <Route path="/newpaymentmade" element={<FormLayout><NewPayment /></FormLayout>} />
                  <Route path="/vendorcredits" element={<VendorCredits />} />
                  <Route path="/newvendorcredit" element={<FormLayout><NewVendorCredit /></FormLayout>} />
                  <Route path="/purchasereceives" element={<PurchaseReceives />} />
                  <Route path="/newpurchasereceive" element={<FormLayout><NewPurchaseReceives /></FormLayout>} />
                  <Route path="/newpurchaseorder" element={<FormLayout><NewPurchaseOrder /></FormLayout>} />
                  <Route path="/purchaseorders" element={<PurchaseOrders />} />


                  {/* BANKING */}
                  <Route path="/banking" element={<Banking />} />
                  <Route path="/addbank" element={<FormLayout><AddBank /></FormLayout>} />
                  {/* PURCHASE END */}

                  {/* ACCOUNTANT */}



                  {/* Accounting Reports */}
                  {/* Accounting Reports */}
                  <Route path="/reports" element={<Reports />} />
                  
                  {/* Logistics Reports - Use a wrapper route */}
                  <Route path="/reports/*" element={<ReportsLayout />}>
                    <Route path="clearance-pending" element={<ClearancePendingReportPage />} />
                    <Route path="invoice-pending" element={<InvoicePendingReportPage />} />
                    <Route path="despatch-pending" element={<DespatchPendingReportPage />} />
                    <Route path="invoice" element={<InvoiceReportPage />} />
                    <Route path="bl-search" element={<BLSearchReportPage />} />
                    <Route path="deposit-refund" element={<DepositRefundReportPage />} />
                    <Route path="pending-for-query" element={<PendingForQueryReportPage />} />
                    <Route path="job-close-pending" element={<JobClosePendingReportPage />} />
                    <Route path="job-costing" element={<JobCostingReportPage />} />
                    <Route path="job-costing-head-detail" element={<JobCostingHeadDetailReportPage />} />
                  </Route>
                  
                  <Route path="/documents" element={<InvoiceAgent />} />
                  <Route path="/invoiceAgentForm" element={<InvoiceAgentForm />} />
                  <Route path="/invoiceDownload" element={<InvoiceDownload />} />
                  <Route path="/day-book" element={<DayBook />} />
                  <Route path="/all-transaction" element={<AllTransaction />} />
                  <Route path="/bill-wise" element={<BillwiseProfit />} />


                  <Route path="/downloadquote" element={<Quotation />} />
                  <Route path="/sales-invoice" element={<DownloadInvoice />} />
                  <Route path="/downloadsalesorder" element={<DownloadSalesOrder />} />
                  <Route path="/delivery-challan-report" element={<DeliveryChallanReport />} />
                  <Route path="/payment-received-report" element={<PaymentReceivedReport />} />
                  <Route path="/credit-note-report" element={<CreditNoteReport />} />
                  <Route path="/recurring-invoice-report" element={<RecurringInvoiceReport />} />
                  <Route path="/purchase-order-report" element={<PurchaseOrderReport />} />
                  <Route path="/bill-report" element={<BillReport />} />
                  <Route path="/recurring-bill-report" element={<RecurringBillReport />} />
                  <Route path="/payment-made-report" element={<PaymentMadeReport />} />
                  <Route path="/vendor-credit-report" element={<VendorCreditReport />} />
                  <Route path="/ask-assistant" element={<AskAssistant />} />


                  {/* Logistics Services */}
                  <Route path="/air-inbound" element={<FormLayout><AirInbound /></FormLayout>} />
                  <Route path="/air-outbound" element={<FormLayout><AirOutbound /></FormLayout>} />
                  <Route path="/ocean-inbound" element={<FormLayout><OceanInbound /></FormLayout>} />
                  <Route path="/ocean-outbound" element={<FormLayout><OceanOutbound /></FormLayout>} />

                  {/* air-inbound */}
                  <Route path="/air-inbound/masterreport" element={<HouseAirwaybill />} />
                  <Route path="/air-inbound/masterreport/housereport" element={<ProvisionalEntry />} />
                  <Route path="/air-inbound/masterreport/housereport/create-provisional" element={<CreateProvisionalEntry />} />
                  <Route path="/air-inbound/masterreport/housereport/view-customer-account" element={<ViewCustomerAccount />} />
                  <Route path="/air-inbound/masterreport/housereport/view-vendor-account" element={<ViewVendorAccount />} />
                  {/* air-outbound */}
                  <Route path="/air-outbound/masterreport" element={<HouseAirwayBillOut />} />
                  <Route path="/air-outbound/masterreport/housereport" element={<ProvisionalEntryOut />} />
                  <Route path="/air-outbound/masterreport/housereport/create-provisional" element={<CreateProvisionalEntryOut />} />
                  <Route path="/air-outbound/masterreport/housereport/view-customer-accounting" element={<ViewCustomerAccountOut />} />
                  <Route path="/air-outbound/view-vendor-account" element={<ViewVendorAccountOut />} />

                  {/* sea-inbound */}
                  <Route path="/sea-inbound/masterreport" element={<HouseBillOfLaddingSeaInbound />} />
                  <Route path="/sea-inbound/masterreport/housereport" element={<ProvisionalEntrySeaIn />} />
                  <Route path="/sea-inbound/masterreport/housereport/create-provisional" element={<CreateProvisionalEntrySeaIn />} />
                  <Route path="/ocean-inbound/masterreport/housereport/view-customer-accounting" element={<ViewCustomerAccountSeaIn />} />
                  <Route path="/ocean-inbound/vendor-view" element={<ViewVendorAccountSeaIn />} />


                  {/* sea-outbound */}

                  <Route path="/sea-outbound/masterreport" element={<HouseBillOfLaddingSeaOutbound />} />
                  <Route path="/sea-outbound/masterreport/housereport" element={<ProvisionalEntrySeaOut />} />
                  <Route path="/sea-outbound/masterreport/housereport/create-provisional" element={<CreateProvisionalEntrySeaOut />} />
                  <Route path="/ocean-outbound/masterreport/housereport/view-customer-accounting" element={<ViewCustomerAccountSeaOut />} />
                  <Route path="/ocean-outbound/vendor-view" element={<ViewVendorAccountSeaOut />} />


                  {/* invoice */}

                  <Route path="/sea-outbound/vendor-invoice" element={<AccountingEntryVendorInvoiceSeaOut />} />
                  <Route path="/print-vendor-purchase" element={<PrintVendorPurchase />} />




                  <Route path="/user-management" element={<ViewUserScreen />} />





                  {/* ✅ Default redirect if no matching route */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </>
            )}

          </Routes>
        </HashRouter>
      </PersistGate>
    </Provider>

  );
};

export default Navigation;
