import { api } from "../../lib/httpClient";

// ---------------------- Business Reports ----------------------

// GET Business Bank Statement
export const getBankStatement = async (params = {}) => {
    try {
        const response = await api.get("/reports/business/bank-statement", { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching bank statement report:", error);
        return null;
    }
};

// GET Business Discount Report
export const getBusinessDiscount = async (params = {}) => {
    try {
        const response = await api.get("/reports/business/discount", { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching business discount report:", error);
        return null;
    }
};

// ---------------------- Item Reports ----------------------

// GET Item Summary
export const getItemSummary = async (params = {}) => {
    try {
        const response = await api.get("/reports/items/summary",
            { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching item summary:", error);
        return null;
    }
};

// GET Item Report By Party
export const getItemByParty = async (params = {}) => {
    try {
        const response = await api.get("/reports/items/by-party",
            { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching item by party:", error);
        return null;
    }
};

// GET Item Profit Loss
export const getItemProfitLoss = async (params = {}) => {
    try {
        const response = await api.get("/reports/items/profit-loss-item",
            { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching item profit loss:", error);
        return null;
    }
};

// GET Category-wise Profit Loss
export const getCategoryProfitLoss = async (params = {}) => {
    try {
        const response = await api.get("/reports/items/category-profit-loss",
            { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching category profit loss:", error);
        return null;
    }
};

// ---------------------- Party Reports ----------------------

// GET Party Statement
export const getPartyStatement = async (params = {}) => {
    try {
        const response = await api.get("/reports/party/statement",
            { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching party statement:", error);
        return null;
    }
};

// GET Party Profit Loss
export const getPartyProfitLoss = async (params = {}) => {
    try {
        const response = await api.get("/reports/party/profit-loss",
            { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching party profit loss:", error);
        return null;
    }
};

// GET Party All Balances
export const getPartyAllBalances = async (params = {}) => {
    try {
        const response = await api.get("/reports/party/all-balances", { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching all balances:", error);
        return null;
    }
};

// GET Party By Item
export const getPartyByItem = async (params = {}) => {
    try {
        const response = await api.get("/reports/party/by-item",
            { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching party by item:", error);
        return null;
    }
};

// GET Party Sale Purchase
export const getPartySalePurchase = async (params = {}) => {
    try {
        const response = await api.get("/reports/party/sale-purchase", { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching party sale/purchase:", error);
        return null;
    }
};

// GET Sale Purchase By Group
export const getPartySalePurchaseByGroup = async (params = {}) => {
    try {
        const response = await api.get("/reports/party/sale-purchase-by-group",
            { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching sale/purchase by group:", error);
        return null;
    }
};

// ---------------------- General Reports ----------------------

// GET Sales Report
export const getSalesReport = async (params = {}) => {
    try {
        const response = await api.get("/reports/sales",
            { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching sales report:", error);
        return null;
    }
};

// GET Purchases Report
export const getPurchaseReport = async (params = {}) => {
    try {
        const response = await api.get("/reports/purchases",
            { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching purchase report:", error);
        return null;
    }
};

// GET Cash Flow
export const getCashFlowReport = async (params = {}) => {
    try {
        const response = await api.get("/reports/cash-flow",
            { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching cash flow:", error);
        return null;
    }
};

// GET Profit Loss
export const getProfitLossReport = async (params = {}) => {
    try {
        const response = await api.get("/reports/profit-loss",
            { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching profit loss:", error);
        return null;
    }
};

// GET Aging Report
export const getAgingReport = async (params = {}) => {
    try {
        const response = await api.get("/reports/aging",
            { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching aging report:", error);
        return null;
    }
};

// ---------------------- Sales Reports ----------------------

// GET Sales Orders
export const getSalesOrders = async (params = {}) => {
    try {
        const response = await api.get("/reports/sales/orders",
            { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching sales orders:", error);
        return null;
    }
};

// GET Sales Order Items
export const getSalesOrderItems = async (params = {}) => {
    try {
        const response = await api.get("/reports/sales/order-items",
            { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching sales order items:", error);
        return null;
    }
};

// ---------------------- Stock Reports ----------------------

// GET Stock Summary
export const getStockSummary = async (params = {}) => {
    try {
        const response = await api.get("/reports/stock/summary",
            { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching stock summary:", error);
        return null;
    }
};

// ---------------------- Tax Reports ----------------------

// GET TCS Receivable
export const getTcsReceivable = async (params = {}) => {
    try {
        const response = await api.get("/reports/tax/tcs-receivable",
            { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching tcs receivable:", error);
        return null;
    }
};

// GET TDS Payable
export const getTdsPayable = async (params = {}) => {
    try {
        const response = await api.get("/reports/tax/tds-payable",
            { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching tds payable:", error);
        return null;
    }
};

// GET TDS Receivable
export const getTdsReceivable = async (params = {}) => {
    try {
        const response = await api.get("/reports/tax/tds-receivable",
            { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching tds receivable:", error);
        return null;
    }
};

// GET GST Summary
export const getGstSummary = async (params = {}) => {
    try {
        const response = await api.get("/reports/tax/gst-summary",
            { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching GST summary:", error);
        return null;
    }
};

// GET GST Rate Summary
export const getGstRateSummary = async (params = {}) => {
    try {
        const response = await api.get("/reports/tax/gst-rate-summary",
            { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching GST rate summary:", error);
        return null;
    }
};

// GET GSTR-1 Report
export const getGstrOneReport = async (params = {}) => {
    try {
        const response = await api.get("/reports/tax/gstr-one", { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching GSTR-1 report:", error);
        return null;
    }
};

// GET GSTR-2 Report
export const getGstrTwoReport = async (params = {}) => {
    try {
        const response = await api.get("/reports/tax/gstr-two", { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching GSTR-2 report:", error);
        return null;
    }
};

// GET Sales By HSN
export const getSalesByHsn = async (params = {}) => {
    try {
        const response = await api.get("/reports/tax/sales-by-hsn",
            { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching sales by HSN:", error);
        return null;
    }
};

// GET SAC Summary
export const getSacSummary = async (params = {}) => {
    try {
        const response = await api.get("/reports/tax/sac-summary",
            { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching SAC summary:", error);
        return null;
    }
};

// ---------------------- Transaction Reports ----------------------

// GET Transaction Sales
export const getTransactionSales = async (params = {}) => {
    try {
        const response = await api.get("/reports/transactions/sales",
            { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching transaction sales:", error);
        return null;
    }
};

// GET Transaction Purchases
export const getTransactionPurchases = async (params = {}) => {
    try {
        const response = await api.get("/reports/transactions/purchases",
            { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching transaction purchases:", error);
        return null;
    }
};

// GET Daybook
export const getTransactionDaybook = async (params = {}) => {
    try {
        const response = await api.get("/reports/transactions/daybook",
            { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching daybook:", error);
        return null;
    }
};

// GET All Transactions
export const getAllTransactions = async (params = {}) => {
    try {
        const response = await api.get("/reports/transactions/all",
            { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching all transactions:", error);
        return null;
    }
};

// GET Bill-wise Profit
export const getBillWiseProfit = async (params = {}) => {
    try {
        const response = await api.get("/reports/transactions/bill-wise-profit",
            { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching bill-wise profit:", error);
        return null;
    }
};

// GET Cashflow
export const getTransactionCashflow = async (params = {}) => {
    try {
        const response = await api.get("/reports/transactions/cashflow",
            { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching cashflow:", error);
        return null;
    }
};
