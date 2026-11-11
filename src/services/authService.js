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

// Upload profile photo
export const uploadProfileImage = async (imageFile) => {
    const formData = new FormData();

    formData.append("profileImage", imageFile);

    const response = await api.post("/auth/profile-image", formData, {
        headers: {
            "Content-Type": "multipart/form-data"
        }
    });

    return response.data;
};

export const logoutUser = () => {
    sessionStorage.removeItem("token");
};