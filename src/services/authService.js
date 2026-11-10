import api from "./api";

export const registerUser = async (userData) => {
    const response = await api.post("/auth/register", userData);
    return response.data;
};

export const loginUser = async (credentials) => {
    const response = await api.post("/auth/login", credentials);

    if (response.data.token) {
        sessionStorage.setItem("token", response.data.token);
    }

    return response.data;
};

export const logoutUser = () => {
    sessionStorage.removeItem("token");
};