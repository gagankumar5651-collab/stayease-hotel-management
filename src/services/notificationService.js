import api from "./api";

// Get all notifications
export const getNotifications = async () => {
    const response = await api.get("/notifications");
    return response.data;
};

// Mark one notification as read
export const markNotificationRead = async (id) => {
    const response = await api.put(`/notifications/read/${id}`);
    return response.data;
};

// Mark all notifications as read
export const markAllNotificationsRead = async () => {
    const response = await api.put("/notifications/read-all");
    return response.data;
};