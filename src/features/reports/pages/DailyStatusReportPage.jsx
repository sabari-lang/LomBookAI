import ReportPage from './ReportPage';

/**
 * Daily Status Report Page
 * 
 * Displays daily logistics operations status including:
 * - All shipments for the day
 * - Status tracking (dispatched, in-transit, delivered, pending)
 * - Key operational details (shipper, consignee, vessel, ports, etc.)
 * 
 * This is a wrapper component that uses the generic ReportPage
 * with configuration from reportDefinitions.js
 */
const DailyStatusReportPage = () => {
  return <ReportPage />;
};

export default DailyStatusReportPage;
