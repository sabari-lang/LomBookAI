import { api } from "../../lib/httpClient";

// ==================== 🧾 BILLS APIs ====================

// Get all Bills (GET)
export const getBills = async (params = {}) => {
    try {
        const response = await api.get("/purchases/bills/paged", { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching bills:", error);
        return null;
    }
};

// Get Bill by ID (GET)
export const getBillById = async (id) => {
    try {
        const response = await api.get(`/purchases/bills/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching bill with ID ${id}:`, error);
        return null;
    }
};

// Create Bill (POST)
export const createBill = async (data) => {
    try {
        const response = await api.post("/purchases/bills", data);
        return response.data;
    } catch (error) {
        console.error("Error creating bill:", error);
        throw error;
    }
};

// Update Bill (PUT)
export const updateBill = async (id, data) => {
    try {
        const response = await api.put(`/purchases/bills/${id}`, data);
        return response.data;
    } catch (error) {
        console.error(`Error updating bill with ID ${id}:`, error);
        throw error;
    }
};

// Delete Bill (DELETE)
export const deleteBill = async (id) => {
    try {
        const response = await api.delete(`/purchases/bills/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting bill with ID ${id}:`, error);
        return null;
    }
};

// ==================== 💸 EXPENSES APIs ====================

export const getExpenses = async (params = {}) => {
    try {
        const response = await api.get("/purchases/expenses/paged", { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching expenses:", error);
        return null;
    }
};

// Get Expense by ID (GET)
export const getExpenseById = async (id) => {
    try {
        const response = await api.get(`/purchases/expenses/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching expense with ID ${id}:`, error);
        return null;
    }
};

export const createExpense = async (data) => {
    try {
        const response = await api.post("/purchases/expenses", data);
        return response.data;
    } catch (error) {
        console.error("Error creating expense:", error);
        throw error;
    }
};

export const updateExpense = async (id, data) => {
    try {
        const response = await api.put(`/purchases/expenses/${id}`, data);
        return response.data;
    } catch (error) {
        console.error(`Error updating expense with ID ${id}:`, error);
        throw error;
    }
};

export const deleteExpense = async (id) => {
    try {
        const response = await api.delete(`/purchases/expenses/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting expense with ID ${id}:`, error);
        return null;
    }
};

// ==================== 💳 PAYMENT MADE APIs ====================

// GET all payments made (paged)
export const getPayments = async (params = {}) => {
    try {
        const response = await api.get("/purchases/payments-made/paged", { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching payments:", error);
        return null;
    }
};

// GET payment made by ID
export const getPaymentById = async (id) => {
    try {
        const response = await api.get(`/purchases/payments-made/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching payment made with ID ${id}:`, error);
        return null;
    }
};

// CREATE payment made
export const createPayment = async (data) => {
    try {
        const response = await api.post("/purchases/payments-made", data);
        return response.data;
    } catch (error) {
        console.error("Error creating payment:", error);
        throw error;
    }
};

// UPDATE payment made
export const updatePayment = async (id, data) => {
    try {
        const response = await api.put(`/purchases/payments-made/${id}`, data);
        return response.data;
    } catch (error) {
        console.error(`Error updating payment made with ID ${id}:`, error);
        throw error;
    }
};

// DELETE payment made
export const deletePayment = async (id) => {
    try {
        const response = await api.delete(`/purchases/payments-made/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting payment made with ID ${id}:`, error);
        throw error;
    }
};


// ==================== 📦 PURCHASE ORDERS APIs ====================

// GET All Purchase Orders (Paged + Filters)
export const getPurchaseOrders = async (params = {}) => {
    try {
        const response = await api.get("/purchases/purchase-orders/paged", { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching purchase orders:", error);
        return null;
    }
};

// GET Purchase Order by ID
export const getPurchaseOrderById = async (id) => {
    try {
        const response = await api.get(`/purchases/purchase-orders/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching purchase order with ID ${id}:`, error);
        return null;
    }
};

// CREATE Purchase Order
export const createPurchaseOrder = async (data) => {
    try {
        const response = await api.post("/purchases/purchase-orders", data);
        return response.data;
    } catch (error) {
        console.error("Error creating purchase order:", error);
        throw error;
    }
};

// UPDATE Purchase Order by ID
export const updatePurchaseOrder = async (id, data) => {
    try {
        const response = await api.put(`/purchases/purchase-orders/${id}`, data);
        return response.data;
    } catch (error) {
        console.error(`Error updating purchase order with ID ${id}:`, error);
        throw error;
    }
};

// DELETE Purchase Order by ID
export const deletePurchaseOrder = async (id) => {
    try {
        const response = await api.delete(`/purchases/purchase-orders/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting purchase order with ID ${id}:`, error);
        return null;
    }
};

// ==================== 📥 PURCHASE RECEIVES APIs ====================

export const getPurchaseReceives = async (params = {}) => {
    try {
        const response = await api.get("/purchases/purchasereceives", { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching purchase receives:", error);
        return null;
    }
};

export const deletePurchaseReceive = async (id) => {
    try {
        const response = await api.delete(`/purchases/purchasereceives/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting purchase receive with ID ${id}:`, error);
        return null;
    }
};
// ==================== 🔁 RECURRING BILLS APIs ====================

// GET all recurring bills (paged)
export const getRecurringBills = async (params = {}) => {
    try {
        const response = await api.get("/purchases/recurring-bills/paged", { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching recurring bills:", error);
        return null;
    }
};

// GET recurring bill by ID
export const getRecurringBillById = async (id) => {
    try {
        const response = await api.get(`/purchases/recurring-bills/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching recurring bill with ID ${id}:`, error);
        return null;
    }
};

// CREATE recurring bill
export const createRecurringBill = async (data) => {
    try {
        const response = await api.post("/purchases/recurring-bills", data);
        return response.data;
    } catch (error) {
        console.error("Error creating recurring bill:", error);
        throw error;
    }
};

// UPDATE recurring bill
export const updateRecurringBill = async (id, data) => {
    try {
        const response = await api.put(`/purchases/recurring-bills/${id}`, data);
        return response.data;
    } catch (error) {
        console.error(`Error updating recurring bill ID ${id}:`, error);
        throw error;
    }
};

// DELETE recurring bill
export const deleteRecurringBill = async (id) => {
    try {
        const response = await api.delete(`/purchases/recurring-bills/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting recurring bill ID ${id}:`, error);
        throw error;
    }
};



// ==================== 🔁 RECURRING EXPENSES APIs ====================

// GET all recurring expenses (paged)
export const getRecurringExpenses = async (params = {}) => {
    try {
        const response = await api.get("/purchases/recurring-expenses/paged", { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching recurring expenses:", error);
        return null;
    }
};

// GET recurring expense by ID
export const getRecurringExpenseById = async (id) => {
    try {
        const response = await api.get(`/purchases/recurring-expenses/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching recurring expense with ID ${id}:`, error);
        return null;
    }
};

// CREATE recurring expense
export const createRecurringExpense = async (data) => {
    try {
        const response = await api.post("/purchases/recurring-expenses", data);
        return response.data;
    } catch (error) {
        console.error("Error creating recurring expense:", error);
        throw error;
    }
};

// UPDATE recurring expense
export const updateRecurringExpense = async (id, data) => {
    try {
        const response = await api.put(`/purchases/recurring-expenses/${id}`, data);
        return response.data;
    } catch (error) {
        console.error(`Error updating recurring expense ID ${id}:`, error);
        throw error;
    }
};

// DELETE recurring expense
export const deleteRecurringExpense = async (id) => {
    try {
        const response = await api.delete(`/purchases/recurring-expenses/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting recurring expense ID ${id}:`, error);
        throw error;
    }
};



// ==================== 🧾 VENDOR CREDITS APIs ====================

// GET all vendor credits (paged)
export const getVendorCredits = async (params = {}) => {
    try {
        const response = await api.get("/purchases/vendor-credits/paged", { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching vendor credits:", error);
        return null;
    }
};

// GET vendor credit by ID
export const getVendorCreditById = async (id) => {
    try {
        const response = await api.get(`/purchases/vendor-credits/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching vendor credit ${id}:`, error);
        return null;
    }
};

// CREATE vendor credit
export const createVendorCredit = async (data) => {
    try {
        const response = await api.post("/purchases/vendor-credits", data);
        return response.data;
    } catch (error) {
        console.error("Error creating vendor credit:", error);
        throw error;
    }
};

// UPDATE vendor credit
export const updateVendorCredit = async (id, data) => {
    try {
        const response = await api.put(`/purchases/vendor-credits/${id}`, data);
        return response.data;
    } catch (error) {
        console.error(`Error updating vendor credit ${id}:`, error);
        throw error;
    }
};

// DELETE vendor credit
export const deleteVendorCredit = async (id) => {
    try {
        const response = await api.delete(`/purchases/vendor-credits/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting vendor credit ${id}:`, error);
        throw error;
    }
};


// ==================== 🏪 VENDORS APIs ====================

export const getVendors = async (params = {}) => {
    try {
        const response = await api.get("/purchases/vendors/paged", { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching vendors:", error);
        return null;
    }
};

export const getVendorById = async (id) => {
    try {
        const response = await api.get(`/purchases/vendors/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching vendor with ID ${id}:`, error);
        return null;
    }
};

export const createVendor = async (data) => {
    try {
        const response = await api.post("/purchases/vendors", data);
        return response.data;
    } catch (error) {
        console.error("Error creating vendor:", error);
        throw error;
    }
};

export const updateVendor = async (id, data) => {
    try {
        const response = await api.put(`/purchases/vendors/${id}`, data);
        return response.data;
    } catch (error) {
        console.error(`Error updating vendor with ID ${id}:`, error);
        throw error;
    }
};

export const deleteVendor = async (id) => {
    try {
        const response = await api.delete(`/purchases/vendors/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting vendor with ID ${id}:`, error);
        return null;
    }
};
