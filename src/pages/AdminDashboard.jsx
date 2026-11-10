
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Users, BedDouble, CalendarDays, IndianRupee,
    CheckCircle, XCircle, Clock, LogOut, RefreshCw,
    Settings, ClipboardList
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { getDashboard } from "../services/dashboardService";
import "./AdminDashboard.css";

function AdminDashboard() {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchDashboard = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            const response = await getDashboard();
            setData(response);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to load dashboard data."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboard();
    }, [fetchDashboard]);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const stats = data?.dashboard;

    const statCards = stats ? [
        { title: "Total Customers", value: stats.totalUsers, icon: Users },
        { title: "Total Staff", value: stats.totalStaff, icon: Users },
        { title: "Total Rooms", value: stats.totalRooms, icon: BedDouble },
        { title: "Available Rooms", value: stats.availableRooms, icon: CheckCircle },
        { title: "Booked Rooms", value: stats.bookedRooms, icon: BedDouble },
        { title: "Maintenance Rooms", value: stats.maintenanceRooms, icon: Clock },
        { title: "Total Bookings", value: stats.totalBookings, icon: CalendarDays },
        { title: "Confirmed Bookings", value: stats.confirmedBookings, icon: CheckCircle },
        { title: "Cancelled Bookings", value: stats.cancelledBookings, icon: XCircle },
        { title: "Today's Bookings", value: stats.todaysBookings, icon: CalendarDays },
        { title: "Booking Revenue", value: `₹${stats.totalRevenue || 0}`, icon: IndianRupee }
    ] : [];

    const navigationItems = [
        {
            title: "Room Management",
            description: "Add, edit and manage hotel rooms",
            icon: BedDouble,
            path: "/admin/rooms"
        },
        {
            title: "Staff Management",
            description: "Manage hotel staff accounts",
            icon: Users,
            path: "/admin/staff"
        },
        {
            title: "Customer Requests",
            description: "View and manage customer requests",
            icon: ClipboardList,
            path: "/admin/requests"
        },
        {
            title: "Dashboard",
            description: "View hotel performance overview",
            icon: Settings,
            path: "/admin/dashboard"
        },
        {
            title: "Booking Management",
            description: "View and manage customer bookings",
            icon: CalendarDays,
            path: "/admin/bookings"
        },
    ];

    if (loading) {
        return <div className="admin-loading">Loading dashboard...</div>;
    }

    if (error) {
        return (
            <div className="admin-error">
                <h2>{error}</h2>
                <button onClick={fetchDashboard}>Try Again</button>
            </div>
        );
    }

    return (
        <div className="admin-dashboard">
            <header className="admin-header">
                <div>
                    <h1>StayEase Admin</h1>
                    <p>Hotel Management Dashboard</p>
                </div>

                <div className="admin-header-actions">
                    <button onClick={fetchDashboard}>
                        <RefreshCw size={16} /> Refresh
                    </button>
                    <button onClick={handleLogout}>
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            </header>

            <main className="admin-content">

                {/* MANAGEMENT NAVIGATION */}
                <section className="admin-navigation">
                    <h2>Management</h2>

                    <div className="admin-nav-grid">
                        {navigationItems.map((item) => {
                            const Icon = item.icon;

                            return (
                                <button
                                    className="admin-nav-card"
                                    key={item.path}
                                    onClick={() => navigate(item.path)}
                                >
                                    <Icon size={25} />
                                    <h3>{item.title}</h3>
                                    <p>{item.description}</p>
                                </button>
                            );
                        })}
                    </div>
                </section>

                <h2>Overview</h2>

                <div className="admin-stats-grid">
                    {statCards.map((item) => {
                        const Icon = item.icon;

                        return (
                            <div className="admin-stat-card" key={item.title}>
                                <div className="admin-stat-icon">
                                    <Icon size={22} />
                                </div>
                                <p>{item.title}</p>
                                <h3>{item.value}</h3>
                            </div>
                        );
                    })}
                </div>

                <section className="recent-bookings">
                    <h2>Recent Bookings</h2>

                    {data?.recentBookings?.length > 0 ? (
                        <div className="booking-table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Customer</th>
                                        <th>Room</th>
                                        <th>Check In</th>
                                        <th>Check Out</th>
                                        <th>Amount</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {data.recentBookings.map((booking) => (
                                        <tr key={booking._id}>
                                            <td>
                                                {booking.user?.name || "Unknown"}
                                                <small>{booking.user?.email}</small>
                                            </td>
                                            <td>
                                                {booking.room
                                                    ? `${booking.room.roomType} - ${booking.room.roomNumber}`
                                                    : "Room unavailable"}
                                            </td>
                                            <td>{new Date(booking.checkIn).toLocaleDateString()}</td>
                                            <td>{new Date(booking.checkOut).toLocaleDateString()}</td>
                                            <td>₹{booking.totalAmount}</td>
                                            <td>
                                                <span className={`booking-status ${booking.status}`}>
                                                    {booking.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="no-bookings">No bookings found.</p>
                    )}
                </section>
            </main>
        </div>
    );
}

export default AdminDashboard;
