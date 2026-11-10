import { createContext, useContext, useState } from "react";
import {
    loginUser,
    registerUser,
    logoutUser
} from "../services/authService";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem("user");
        return savedUser ? JSON.parse(savedUser) : null;
    });

    const login = async (credentials) => {
        const data = await loginUser(credentials);

        if (data.user) {
            setUser(data.user);
            localStorage.setItem("user", JSON.stringify(data.user));
        }

        return data;
    };

    const register = async (userData) => {
        return await registerUser(userData);
    };

    const logout = () => {
        logoutUser();
        localStorage.removeItem("user");
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{ user, login, register, logout }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);