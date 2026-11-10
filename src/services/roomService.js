import api from "./api";

// Get all rooms
export const getAllRooms = async () => {
    const response = await api.get("/rooms");
    return response.data;
};

// Add new room (Admin)
export const addRoom = async (roomData) => {
    const response = await api.post("/rooms/add", roomData);
    return response.data;
};

// Update room (Admin)
export const updateRoom = async (id, roomData) => {
    const response = await api.put(`/rooms/update/${id}`, roomData);
    return response.data;
};

// Delete room (Admin)
export const deleteRoom = async (id) => {
    const response = await api.delete(`/rooms/delete/${id}`);
    return response.data;
};