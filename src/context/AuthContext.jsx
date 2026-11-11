import { createContext, useContext, useState } from "react";

import {
    loginUser,
    registerUser,
    logoutUser
} from "../services/authService";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

    const [user, setUser] = useState(() => {
        const savedUser = sessionStorage.getItem("user");
        return savedUser ? JSON.parse(savedUser) : null;
    });

    const login = async (credentials) => {
        const data = await loginUser(credentials);

        if (data.user) {
            setUser(data.user);
            sessionStorage.setItem("user", JSON.stringify(data.user));
        }

        return data;
    };

    const register = async (userData) => {
        return await registerUser(userData);
    };

    // Update user information
    const updateUser = (updatedData) => {
        setUser((previousUser) => {
            if (!previousUser) return null;

            const updatedUser = {
                ...previousUser,
                ...updatedData
            };

            sessionStorage.setItem(
                "user",
                JSON.stringify(updatedUser)
            );

            return updatedUser;
        });
    };

    const logout = () => {
        logoutUser();

        sessionStorage.removeItem("user");
        sessionStorage.removeItem("token");

        localStorage.removeItem("user");
        localStorage.removeItem("token");

        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                login,
                register,
                logout,
                updateUser
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);