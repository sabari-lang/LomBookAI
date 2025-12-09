import { api } from "../../lib/httpClient";

// ==================== 🧾 INVOICES APIs ====================

export const getInvoices = async (params = {}) => {
    try {
        const response = await api.get("/sales/invoices/paged", { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching invoices:", error);
        return null;
    }
};

export const getInvoiceById = async (id) => {
    try {
        const response = await api.get(`/sales/invoices/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching invoice with ID ${id}:`, error);
        return null;
    }
};

export const createInvoice = async (data) => {
    try {
        const response = await api.post("/sales/invoices", data);
        return response.data;
    } catch (error) {
        console.error("Error creating invoice:", error);
        throw error;
    }
};

export const updateInvoice = async (id, data) => {
    try {
        const response = await api.put(`/sales/invoices/${id}`, data);
        return response.data;
    } catch (error) {
        console.error(`Error updating invoice with ID ${id}:`, error);
        throw error;
    }
};

export const deleteInvoice = async (id) => {
    try {
        const response = await api.delete(`/sales/invoices/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting invoice with ID ${id}:`, error);
        return null;
    }
};

// ==================== 📦 SALES ORDERS APIs ====================

// GET All Sales Orders (with filters / pagination)
export const getSalesOrders = async (params = {}) => {
    try {
        const response = await api.get("/sales/orders/paged", { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching sales orders:", error);
        return null;
    }
};

// GET Single Sales Order by ID
export const getSalesOrderById = async (id) => {
    try {
        const response = await api.get(`/sales/orders/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching sales order with ID ${id}:`, error);
        return null;
    }
};

// CREATE Sales Order
export const createSalesOrder = async (data) => {
    try {
        const response = await api.post("/sales/orders", data);
        return response.data;
    } catch (error) {
        console.error("Error creating sales order:", error);
        throw error;
    }
};

// UPDATE Sales Order
export const updateSalesOrder = async (id, data) => {
    try {
        const response = await api.put(`/sales/orders/${id}`, data);
        return response.data;
    } catch (error) {
        console.error(`Error updating sales order with ID ${id}:`, error);
        throw error;
    }
};

// DELETE Sales Order
export const deleteSalesOrder = async (id) => {
    try {
        const response = await api.delete(`/sales/orders/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting sales order with ID ${id}:`, error);
        return null;
    }
};

// ==================== 🚚 DELIVERY CHALLANS APIs ====================
// GET all delivery challans
export const getDeliveryChallans = async (params = {}) => {
    try {
        const response = await api.get("/sales/delivery-challans/paged", { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching delivery challans:", error);
        return null;
    }
};

// CREATE delivery challan
export const createDeliveryChallan = async (data) => {
    try {
        const response = await api.post("/sales/delivery-challans", data);
        return response.data;
    } catch (error) {
        console.error("Error creating delivery challan:", error);
        throw error;
    }
};

// UPDATE delivery challan
export const updateDeliveryChallan = async (id, data) => {
    try {
        const response = await api.put(`/sales/delivery-challans/${id}`, data);
        return response.data;
    } catch (error) {
        console.error(`Error updating delivery challan with ID ${id}:`, error);
        throw error;
    }
};

// DELETE delivery challan
export const deleteDeliveryChallan = async (id) => {
    try {
        const response = await api.delete(`/sales/delivery-challans/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting delivery challan with ID ${id}:`, error);
        throw error;
    }
};


// ==================== 💳 PAYMENTS RECEIVED APIs ====================

// GET All Payments Received (with filters / pagination)
export const getPaymentsReceived = async (params = {}) => {
    try {
        const response = await api.get("/sales/payments-received/paged", { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching payments received:", error);
        return null;
    }
};

// CREATE Payment Received
export const createPaymentReceived = async (data) => {
    try {
        const response = await api.post("/sales/payments-received", data);
        return response.data;
    } catch (error) {
        console.error("Error recording payment:", error);
        throw error;
    }
};

// GET Single Payment by ID
export const getPaymentReceivedById = async (id) => {
    try {
        const response = await api.get(`/sales/payments-received/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching payment with ID ${id}:`, error);
        return null;
    }
};

// UPDATE Payment
export const updatePaymentReceived = async (id, data) => {
    try {
        const response = await api.put(`/sales/payments-received/${id}`, data);
        return response.data;
    } catch (error) {
        console.error(`Error updating payment with ID ${id}:`, error);
        throw error;
    }
};

// DELETE Payment
export const deletePaymentReceived = async (id) => {
    try {
        const response = await api.delete(`/sales/payments-received/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting payment with ID ${id}:`, error);
        return null;
    }
};

// ==================== 🧾 CREDIT NOTES APIs ====================

// GET all credit notes
export const getCreditNotes = async (params = {}) => {
    try {
        const response = await api.get("/sales/credit-notes/paged", { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching credit notes:", error);
        return null;
    }
};

// CREATE credit note
export const createCreditNote = async (data) => {
    try {
        const response = await api.post("/sales/credit-notes", data);
        return response.data;
    } catch (error) {
        console.error("Error creating credit note:", error);
        throw error;
    }
};

// UPDATE credit note
export const updateCreditNote = async (id, data) => {
    try {
        const response = await api.put(`/sales/credit-notes/${id}`, data);
        return response.data;
    } catch (error) {
        console.error(`Error updating credit note with ID ${id}:`, error);
        throw error;
    }
};

// DELETE credit note
export const deleteCreditNote = async (id) => {
    try {
        const response = await api.delete(`/sales/credit-notes/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting credit note with ID ${id}:`, error);
        throw error;
    }
};


// ==================== 🧑‍💼 CUSTOMERS APIs ====================

export const getCustomers = async (params = {}) => {
    try {
        const response = await api.get("/sales/customers/paged", { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching customers:", error);
        return null;
    }
};

export const getCustomerById = async (id) => {
    try {
        const response = await api.get(`/sales/customers/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching customer with ID ${id}:`, error);
        return null;
    }
};

export const createCustomer = async (data) => {
    try {
        const response = await api.post("/sales/customers", data);
        return response.data;
    } catch (error) {
        console.error("Error creating customer:", error);
        throw error;
    }
};

export const updateCustomer = async (id, data) => {
    try {
        const response = await api.put(`/sales/customers/${id}`, data);
        return response.data;
    } catch (error) {
        console.error(`Error updating customer with ID ${id}:`, error);
        throw error;
    }
};

export const deleteCustomer = async (id) => {
    try {
        const response = await api.delete(`/sales/customers/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting customer with ID ${id}:`, error);
        return null;
    }
};

// ==================== 💬 QUOTES APIs ====================

export const getQuotes = async (params = {}) => {
    try {
        const response = await api.get("/sales/quotes/paged", { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching quotes:", error);
        return null;
    }
};

// Create
export const createQuote = async (data) => {
    try {
        const response = await api.post("/sales/quotes", data);
        return response.data;
    } catch (error) {
        console.error("Error creating quote:", error);
        throw error;
    }
};

// Update
export const updateQuote = async (quoteId, data) => {
    try {
        const response = await api.put(`/sales/quotes/${quoteId}`, data);
        return response.data;
    } catch (error) {
        console.error("Error updating quote:", error);
        throw error;
    }
};

// Delete
export const deleteQuote = async (quoteId) => {
    try {
        const response = await api.delete(`/sales/quotes/${quoteId}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting quote:", error);
        throw error;
    }
};

// GET all recurring invoices
export const getRecurringInvoices = async (params = {}) => {
    try {
        const response = await api.get("/sales/recurring-invoices/paged", { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching recurring invoices:", error);
        return null;
    }
};

// CREATE (POST)
export const createRecurringInvoice = async (data) => {
    try {
        const response = await api.post("/sales/recurring-invoices", data);
        return response.data;
    } catch (error) {
        console.error("Error creating recurring invoice:", error);
        throw error;
    }
};

// UPDATE (PUT)
export const updateRecurringInvoice = async (id, data) => {
    try {
        const response = await api.put(`/sales/recurring-invoices/${id}`, data);
        return response.data;
    } catch (error) {
        console.error(`Error updating recurring invoice with ID ${id}:`, error);
        throw error;
    }
};

// DELETE
export const deleteRecurringInvoice = async (id) => {
    try {
        const response = await api.delete(`/sales/recurring-invoices/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting recurring invoice with ID ${id}:`, error);
        throw error;
    }
};
