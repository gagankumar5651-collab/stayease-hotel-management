
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    CalendarDays,
    ClipboardList,
    RefreshCw,
    LogOut,
    CheckCircle,
    Clock,
    Search,
    XCircle
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import {
    getAllBookings,
    cancelBooking
} from "../services/bookingService";
import {
    getAllRequests,
    updateRequestStatus
} from "../services/requestService";

import "./StaffDashboard.css";

function StaffDashboard() {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const [bookings, setBookings] = useState([]);
    const [requests, setRequests] = useState([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [updatingId, setUpdatingId] = useState(null);
    const [cancellingId, setCancellingId] = useState(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [bookingFilter, setBookingFilter] = useState("all");
    const [requestFilter, setRequestFilter] = useState("all");

    // Fetch dashboard data
    const fetchData = async (showLoader = true) => {
        try {
            if (showLoader) {
                setLoading(true);
            } else {
                setRefreshing(true);
            }

            setError("");

            const [bookingResponse, requestResponse] =
                await Promise.all([
                    getAllBookings(),
                    getAllRequests()
                ]);

            setBookings(bookingResponse.bookings || []);
            setRequests(requestResponse.requests || []);

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to load staff dashboard."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Update customer request status
    const handleStatusUpdate = async (id, status) => {
        try {
            setUpdatingId(id);

            await updateRequestStatus(id, { status });

            await fetchData(false);

        } catch (err) {
            alert(
                err.response?.data?.message ||
                "Unable to update request."
            );
        } finally {
            setUpdatingId(null);
        }
    };

    // Cancel booking
    const handleCancelBooking = async (id) => {
        const confirmed = window.confirm(
            "Are you sure you want to cancel this booking?"
        );

        if (!confirmed) return;

        try {
            setCancellingId(id);

            await cancelBooking(id);

            alert("Booking cancelled successfully.");

            await fetchData(false);

        } catch (err) {
            alert(
                err.response?.data?.message ||
                "Unable to cancel booking."
            );
        } finally {
            setCancellingId(null);
        }
    };

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    // Request statistics
    const pendingRequests = requests.filter(
        (r) => r.status === "Pending"
    ).length;

    const acceptedRequests = requests.filter(
        (r) => r.status === "Accepted"
    ).length;

    const completedRequests = requests.filter(
        (r) => r.status === "Completed"
    ).length;

    // Booking statistics
    const confirmedBookings = bookings.filter(
        (b) => b.status === "confirmed"
    ).length;

    const cancelledBookings = bookings.filter(
        (b) => b.status === "cancelled"
    ).length;

    // Filter customer requests
    const filteredRequests = requests.filter((request) => {
        return (
            requestFilter === "all" ||
            request.status === requestFilter
        );
    });

    // Search and filter bookings
    const filteredBookings = bookings.filter((booking) => {
        const customerName =
            booking.user?.name?.toLowerCase() || "";

        const customerEmail =
            booking.user?.email?.toLowerCase() || "";

        const roomNumber = String(
            booking.room?.roomNumber || ""
        );

        const search = searchTerm.toLowerCase().trim();

        const matchesSearch =
            customerName.includes(search) ||
            customerEmail.includes(search) ||
            roomNumber.includes(search);

        const matchesStatus =
            bookingFilter === "all" ||
            booking.status === bookingFilter;

        return matchesSearch && matchesStatus;
    });

    if (loading) {
        return (
            <div className="staff-loading">
                Loading dashboard...
            </div>
        );
    }

    if (error) {
        return (
            <div className="staff-error">
                <h2>{error}</h2>
                <button onClick={() => fetchData()}>
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="staff-dashboard">

            {/* HEADER */}
            <header className="staff-header">
                <div>
                    <h1>StayEase Staff</h1>
                    <p>Hotel Operations Dashboard</p>
                </div>

                <div className="staff-header-actions">
                    <button
                        onClick={() => fetchData(false)}
                        disabled={refreshing}
                    >
                        <RefreshCw
                            size={16}
                            className={refreshing ? "staff-spinning" : ""}
                        />
                        {refreshing ? "Refreshing..." : "Refresh"}
                    </button>

                    <button onClick={handleLogout}>
                        <LogOut size={16} />
                        Logout
                    </button>
                </div>
            </header>

            <main className="staff-content">

                {/* STATISTICS */}
                <section className="staff-stats-grid">

                    <div className="staff-stat-card">
                        <CalendarDays size={24} />
                        <p>Total Bookings</p>
                        <h2>{bookings.length}</h2>
                    </div>

                    <div className="staff-stat-card">
                        <ClipboardList size={24} />
                        <p>Total Requests</p>
                        <h2>{requests.length}</h2>
                    </div>

                    <div className="staff-stat-card">
                        <Clock size={24} />
                        <p>Pending Requests</p>
                        <h2>{pendingRequests}</h2>
                    </div>

                    <div className="staff-stat-card">
                        <CheckCircle size={24} />
                        <p>Completed Requests</p>
                        <h2>{completedRequests}</h2>
                    </div>

                </section>

                {/* CUSTOMER REQUESTS */}
                <section className="staff-section">

                    <div className="staff-section-header">
                        <h2>Customer Requests</h2>

                        <span>
                            {acceptedRequests} Accepted
                        </span>
                    </div>

                    <div className="staff-request-filter">
                        <select
                            value={requestFilter}
                            onChange={(e) =>
                                setRequestFilter(e.target.value)
                            }
                        >
                            <option value="all">All Requests</option>
                            <option value="Pending">Pending</option>
                            <option value="Accepted">Accepted</option>
                            <option value="Rejected">Rejected</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                    </div>

                    {filteredRequests.length > 0 ? (
                        <div className="staff-request-list">

                            {filteredRequests.map((request) => (
                                <div
                                    className="staff-request-card"
                                    key={request._id}
                                >
                                    <div className="staff-request-info">
                                        <h3>{request.requestType}</h3>

                                        <p>
                                            Room: {request.roomNumber}
                                        </p>

                                        <p>
                                            Customer:{" "}
                                            {request.customerId?.name || "Customer"}
                                        </p>

                                        <p>
                                            {request.description ||
                                                "No description provided"}
                                        </p>

                                        <span
                                            className={`staff-request-status ${request.status.toLowerCase()}`}
                                        >
                                            {request.status}
                                        </span>
                                    </div>

                                    <div className="staff-request-actions">

                                        {request.status === "Pending" && (
                                            <>
                                                <button
                                                    disabled={
                                                        updatingId === request._id
                                                    }
                                                    onClick={() =>
                                                        handleStatusUpdate(
                                                            request._id,
                                                            "Accepted"
                                                        )
                                                    }
                                                    className="staff-accept-btn"
                                                >
                                                    Accept
                                                </button>

                                                <button
                                                    disabled={
                                                        updatingId === request._id
                                                    }
                                                    onClick={() =>
                                                        handleStatusUpdate(
                                                            request._id,
                                                            "Rejected"
                                                        )
                                                    }
                                                    className="staff-reject-btn"
                                                >
                                                    Reject
                                                </button>
                                            </>
                                        )}

                                        {request.status === "Accepted" && (
                                            <button
                                                disabled={
                                                    updatingId === request._id
                                                }
                                                onClick={() =>
                                                    handleStatusUpdate(
                                                        request._id,
                                                        "Completed"
                                                    )
                                                }
                                                className="staff-complete-btn"
                                            >
                                                Mark Completed
                                            </button>
                                        )}

                                        {updatingId === request._id && (
                                            <small>Updating...</small>
                                        )}

                                    </div>
                                </div>
                            ))}

                        </div>
                    ) : (
                        <p className="staff-empty">
                            No requests found for this filter.
                        </p>
                    )}

                </section>

                {/* CUSTOMER BOOKINGS */}
                <section className="staff-section">

                    <div className="staff-section-header">
                        <h2>Customer Bookings</h2>
                        <span>
                            {filteredBookings.length} Bookings
                        </span>
                    </div>

                    {/* SEARCH AND FILTER */}
                    <div className="staff-booking-filters">

                        <div className="staff-search-box">
                            <Search size={18} />

                            <input
                                type="text"
                                placeholder="Search customer, email or room..."
                                value={searchTerm}
                                onChange={(e) =>
                                    setSearchTerm(e.target.value)
                                }
                            />

                            {searchTerm && (
                                <button
                                    type="button"
                                    onClick={() => setSearchTerm("")}
                                    title="Clear search"
                                >
                                    <XCircle size={18} />
                                </button>
                            )}
                        </div>

                        <select
                            value={bookingFilter}
                            onChange={(e) =>
                                setBookingFilter(e.target.value)
                            }
                        >
                            <option value="all">All Bookings</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="pending">Pending</option>
                        </select>

                    </div>

                    {filteredBookings.length > 0 ? (
                        <div className="staff-booking-table-wrapper">

                            <table>
                                <thead>
                                    <tr>
                                        <th>Customer</th>
                                        <th>Room</th>
                                        <th>Check In</th>
                                        <th>Check Out</th>
                                        <th>Guests</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredBookings.map((booking) => (
                                        <tr key={booking._id}>

                                            <td>
                                                {booking.user?.name || "Unknown"}
                                                <small>
                                                    {booking.user?.email}
                                                </small>
                                            </td>

                                            <td>
                                                {booking.room
                                                    ? `${booking.room.roomType} - ${booking.room.roomNumber}`
                                                    : "Unavailable"}
                                            </td>

                                            <td>
                                                {new Date(
                                                    booking.checkIn
                                                ).toLocaleDateString()}
                                            </td>

                                            <td>
                                                {new Date(
                                                    booking.checkOut
                                                ).toLocaleDateString()}
                                            </td>

                                            <td>{booking.guests}</td>

                                            <td>
                                                <span
                                                    className={`staff-booking-status ${booking.status}`}
                                                >
                                                    {booking.status}
                                                </span>
                                            </td>

                                            <td>
                                                {["confirmed", "pending"].includes(
                                                    booking.status
                                                ) ? (
                                                    <button
                                                        className="staff-cancel-btn"
                                                        disabled={
                                                            cancellingId === booking._id
                                                        }
                                                        onClick={() =>
                                                            handleCancelBooking(
                                                                booking._id
                                                            )
                                                        }
                                                    >
                                                        {cancellingId === booking._id
                                                            ? "Cancelling..."
                                                            : "Cancel"}
                                                    </button>
                                                ) : (
                                                    <span className="staff-no-action">
                                                        —
                                                    </span>
                                                )}
                                            </td>

                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                        </div>
                    ) : (
                        <p className="staff-empty">
                            No bookings found. Try changing your search or filter.
                        </p>
                    )}

                </section>

            </main>
        </div>
    );
}

export default StaffDashboard;
