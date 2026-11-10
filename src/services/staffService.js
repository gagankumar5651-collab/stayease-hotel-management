import api from "./api";

// Get all staff
export const getAllStaff = async () => {
    const response = await api.get("/staff");
    return response.data;
};

// Create staff
export const createStaff = async (staffData) => {
    const response = await api.post("/staff", staffData);
    return response.data;
};

// Update staff
export const updateStaff = async (id, staffData) => {
    const response = await api.put(`/staff/${id}`, staffData);
    return response.data;
};

// Delete staff
export const deleteStaff = async (id) => {
    const response = await api.delete(`/staff/${id}`);
    return response.data;
};