import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ allowedRoles }) => {
    const { user } = useAuth();

    // Login nahi hai
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // User ka role allowed nahi hai
    if (!allowedRoles.includes(user.role)) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;