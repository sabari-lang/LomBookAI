import { api } from "../../lib/httpClient";

// ==================== 🧾 ITEMS APIs ====================

// ==============================
// ITEMS API (UPDATED ENDPOINTS)
// ==============================

// Get all items with pagination
export const getItems = async (params = {}) => {
    try {
        const response = await api.get("/items/paged", { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching items:", error);
        return null;
    }
};

// Get item by ID
export const getItemById = async (id) => {
    try {
        const response = await api.get(`/items/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching item with ID ${id}:`, error);
        return null;
    }
};

// Create new item
export const createItem = async (data) => {
    try {
        const response = await api.post("/items", data);
        return response.data;
    } catch (error) {
        console.error("Error creating item:", error);
        throw error;
    }
};

// Update item
export const updateItem = async (id, data) => {
    try {
        const response = await api.put(`/items/${id}`, data);
        return response.data;
    } catch (error) {
        console.error(`Error updating item with ID ${id}:`, error);
        throw error;
    }
};

// Delete item
export const deleteItem = async (id) => {
    try {
        const response = await api.delete(`/items/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting item with ID ${id}:`, error);
        return null;
    }
};

// Search items
export const searchItems = async (params = {}) => {
    try {
        const response = await api.get("/items/search", { params });
        return response.data;
    } catch (error) {
        console.error("Error searching items:", error);
        return null;
    }
};

// ==================== 📦 ITEM GROUPS APIs ====================
// TODO: Item Groups endpoints (/inventory/itemgroups) may not exist in the backend yet.
// If these endpoints are not implemented, they should be commented out or backend should be updated.
// For now, keeping them but they may need to be adjusted based on actual backend routes.

// Get all Item Groups (GET)
export const getItemGroups = async (params = {}) => {
    try {
        const response = await api.get("/inventory/itemgroups", { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching item groups:", error);
        return null;
    }
};

// Get Item Group by ID (GET)
export const getItemGroupById = async (id) => {
    try {
        const response = await api.get(`/inventory/itemgroups/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching item group with ID ${id}:`, error);
        return null;
    }
};

// Create Item Group (POST)
export const createItemGroup = async (data) => {
    try {
        const response = await api.post("/inventory/itemgroups", data);
        return response.data;
    } catch (error) {
        console.error("Error creating item group:", error);
        throw error;
    }
};

// Update Item Group (PUT)
export const updateItemGroup = async (id, data) => {
    try {
        const response = await api.put(`/inventory/itemgroups/${id}`, data);
        return response.data;
    } catch (error) {
        console.error(`Error updating item group with ID ${id}:`, error);
        throw error;
    }
};

// Delete Item Group (DELETE)
export const deleteItemGroup = async (id) => {
    try {
        const response = await api.delete(`/inventory/itemgroups/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting item group with ID ${id}:`, error);
        return null;
    }
};
