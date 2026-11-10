import api from "./api";

// Create request (Customer)
export const createRequest = async (requestData) => {
    const response = await api.post("/requests", requestData);
    return response.data;
};

// Get my requests (Customer)
export const getMyRequests = async () => {
    const response = await api.get("/requests/my");
    return response.data;
};

// Get all requests (Staff/Admin)
export const getAllRequests = async () => {
    const response = await api.get("/requests");
    return response.data;
};

// Update request status (Staff/Admin)
export const updateRequestStatus = async (id, statusData) => {
    const response = await api.put(`/requests/status/${id}`, statusData);
    return response.data;
};

// Cancel request (Customer)
export const cancelRequest = async (id) => {
    const response = await api.put(`/requests/cancel/${id}`);
    return response.data;
};