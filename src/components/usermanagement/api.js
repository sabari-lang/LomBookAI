import { api } from "../../lib/httpClient";

export const getUsers = () => api.get("/users").then(r => r.data);
export const getUserById = (id) => api.get(`/users/${id}`).then(r => r.data);

export const createUser = (payload) => api.post("/users", payload).then(r => r.data);
export const updateUser = (id, payload) => api.put(`/users/${id}`, payload).then(r => r.data);
export const deleteUser = (id) => api.delete(`/users/${id}`).then(r => r.data);
