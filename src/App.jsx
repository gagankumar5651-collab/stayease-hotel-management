import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MyAccount from "./pages/MyAccount";

import CustomerDashboard from "./pages/CustomerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminRooms from "./pages/AdminRooms";
import StaffManagement from "./pages/StaffManagement";
import AdminRequests from "./pages/AdminRequests";
import AdminBookings from "./pages/AdminBookings";
import StaffDashboard from "./pages/StaffDashboard";

import ProtectedRoute from "./components/ProtectedRoute";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public Pages */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* My Account - Role Based Redirect */}
                <Route path="/my-account" element={<MyAccount />} />

                {/* Customer Pages */}
                <Route element={<ProtectedRoute allowedRoles={["customer"]} />}>
                    <Route
                        path="/my-account/dashboard"
                        element={<CustomerDashboard />}
                    />
                </Route>

                {/* Staff Pages */}
                <Route element={<ProtectedRoute allowedRoles={["staff"]} />}>
                    <Route
                        path="/staff/dashboard"
                        element={<StaffDashboard />}
                    />
                </Route>

                {/* Admin Pages */}
                <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
                    <Route
                        path="/admin/dashboard"
                        element={<AdminDashboard />}
                    />
                    <Route path="/admin/rooms" element={<AdminRooms />} />
                    <Route path="/admin/staff" element={<StaffManagement />} />
                    <Route path="/admin/requests" element={<AdminRequests />} />
                    <Route path="/admin/bookings" element={<AdminBookings />} />
                </Route>

                {/* 404 */}
                <Route
                    path="*"
                    element={<h1>404 - Page Not Found</h1>}
                />
            </Routes>
        </BrowserRouter>
    );
}

export default App;