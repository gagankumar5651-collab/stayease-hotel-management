import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const MyAccount = () => {
    const { user } = useAuth();

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (user.role === "admin") {
        return <Navigate to="/admin/dashboard" replace />;
    }

    if (user.role === "staff") {
        return <Navigate to="/staff/dashboard" replace />;
    }

    if (user.role === "customer") {
        return <Navigate to="/my-account/dashboard" replace />;
    }

    return <Navigate to="/" replace />;
};

export default MyAccount;