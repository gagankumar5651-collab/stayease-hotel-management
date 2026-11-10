
import api from "./api";

// Create booking
export const createBooking = async (bookingData) => {
    const response = await api.post("/bookings/create", bookingData);
    return response.data;
};

// Get customer bookings
export const getMyBookings = async () => {
    const response = await api.get("/bookings/my-bookings");
    return response.data;
};

// Get all bookings (Admin / Staff)
export const getAllBookings = async () => {
    const response = await api.get("/bookings/all");
    return response.data;
};

// Cancel booking
export const cancelBooking = async (id) => {
    const response = await api.patch(`/bookings/cancel/${id}`);
    return response.data;
};
