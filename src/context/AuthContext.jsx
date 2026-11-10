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

    const logout = () => {
        logoutUser();

        sessionStorage.removeItem("user");
        sessionStorage.removeItem("token");

        // Clear old saved login data
        localStorage.removeItem("user");
        localStorage.removeItem("token");

        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);