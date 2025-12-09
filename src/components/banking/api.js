import { api } from "../../lib/httpClient";

// ==================== 🏦 BANKING APIs ====================
// NOTE: The backend uses /banking/transactions endpoint for Bank Accounts (Bank Master).
// The fields in BankTransactionCreateDto match Bank Account fields:
// AccountType, AccountName, AccountCode, Currency, AccountNumber, BankName, Ifsc, Description, Primary

// Get all Banking Transactions (GET) - paged
export const getBankingTransactions = async (params = {}) => {
    try {
        const response = await api.get("/banking/transactions/paged", { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching banking transactions:", error);
        return null;
    }
};

// Get Banking Transaction by ID (GET)
export const getBankingTransactionById = async (id) => {
    try {
        const response = await api.get(`/banking/transactions/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching banking transaction with ID ${id}:`, error);
        return null;
    }
};

// Create a new Banking Transaction (POST)
export const createBankingTransaction = async (data) => {
    try {
        const response = await api.post("/banking/transactions", data);
        return response.data;
    } catch (error) {
        console.error("Error creating banking transaction:", error);
        throw error;
    }
};

// Update Banking Transaction details (PUT)
export const updateBankingTransaction = async (id, data) => {
    try {
        const response = await api.put(`/banking/transactions/${id}`, data);
        return response.data;
    } catch (error) {
        console.error(`Error updating banking transaction with ID ${id}:`, error);
        throw error;
    }
};

// Delete Banking Transaction (DELETE)
export const deleteBankingTransaction = async (id) => {
    try {
        const response = await api.delete(`/banking/transactions/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting banking transaction with ID ${id}:`, error);
        return null;
    }
};
