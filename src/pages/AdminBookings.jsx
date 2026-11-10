
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw, XCircle, CalendarDays } from "lucide-react";

import { getAllBookings, cancelBooking } from "../services/bookingService";
import "./AdminBookings.css";

function AdminBookings() {
    const navigate = useNavigate();

    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [updatingId, setUpdatingId] = useState(null);
    const [filter, setFilter] = useState("all");

    const fetchBookings = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await getAllBookings();
            setBookings(response.bookings || []);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to load bookings."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    const handleCancel = async (id) => {
        const confirmed = window.confirm(
            "Are you sure you want to cancel this booking?"
        );

        if (!confirmed) return;

        try {
            setUpdatingId(id);
            await cancelBooking(id);
            await fetchBookings();
        } catch (err) {
            alert(
                err.response?.data?.message ||
                "Unable to cancel booking."
            );
        } finally {
            setUpdatingId(null);
        }
    };

    const filteredBookings = bookings.filter((booking) => {
        if (filter === "all") return true;
        return booking.status === filter;
    });

    const pendingCount = bookings.filter(
        (b) => b.status === "pending"
    ).length;

    const confirmedCount = bookings.filter(
        (b) => b.status === "confirmed"
    ).length;

    const cancelledCount = bookings.filter(
        (b) => b.status === "cancelled"
    ).length;

    if (loading) {
        return <div className="admin-bookings-loading">Loading bookings...</div>;
    }

    if (error) {
        return (
            <div className="admin-bookings-error">
                <h2>{error}</h2>
                <button onClick={fetchBookings}>Try Again</button>
                <button onClick={() => navigate("/admin/dashboard")}>
                    Back to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="admin-bookings-page">

            <header className="bookings-header">
                <div>
                    <h1>Booking Management</h1>
                    <p>Manage all customer hotel bookings</p>
                </div>

                <div className="bookings-header-actions">
                    <button onClick={fetchBookings}>
                        <RefreshCw size={16} /> Refresh
                    </button>

                    <button onClick={() => navigate("/admin/dashboard")}>
                        <ArrowLeft size={16} /> Dashboard
                    </button>
                </div>
            </header>

            <main className="bookings-content">

                <div className="booking-summary-grid">
                    <div className="booking-summary-card">
                        <span>Total Bookings</span>
                        <h2>{bookings.length}</h2>
                    </div>

                    <div className="booking-summary-card">
                        <span>Pending</span>
                        <h2>{pendingCount}</h2>
                    </div>

                    <div className="booking-summary-card">
                        <span>Confirmed</span>
                        <h2>{confirmedCount}</h2>
                    </div>

                    <div className="booking-summary-card">
                        <span>Cancelled</span>
                        <h2>{cancelledCount}</h2>
                    </div>
                </div>

                <section className="bookings-list-section">

                    <div className="bookings-list-header">
                        <h2>All Bookings</h2>

                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        >
                            <option value="all">All Bookings</option>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>

                    {filteredBookings.length > 0 ? (
                        <div className="admin-bookings-table-wrapper">
                            <table className="admin-bookings-table">
                                <thead>
                                    <tr>
                                        <th>Customer</th>
                                        <th>Room</th>
                                        <th>Dates</th>
                                        <th>Guests</th>
                                        <th>Amount</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredBookings.map((booking) => (
                                        <tr key={booking._id}>
                                            <td>
                                                <strong>
                                                    {booking.user?.name || "Unknown"}
                                                </strong>
                                                <small>
                                                    {booking.user?.email || "No email"}
                                                </small>
                                            </td>

                                            <td>
                                                {booking.room
                                                    ? `${booking.room.roomType} - ${booking.room.roomNumber}`
                                                    : "Room unavailable"}
                                            </td>

                                            <td>
                                                <div className="booking-date">
                                                    <CalendarDays size={14} />
                                                    {new Date(booking.checkIn).toLocaleDateString()}
                                                </div>
                                                <small>
                                                    To: {new Date(booking.checkOut).toLocaleDateString()}
                                                </small>
                                            </td>

                                            <td>{booking.guests}</td>

                                            <td>₹{booking.totalAmount}</td>

                                            <td>
                                                <span className={`admin-booking-status ${booking.status}`}>
                                                    {booking.status}
                                                </span>
                                            </td>

                                            <td>
                                                {booking.status !== "cancelled" ? (
                                                    <button
                                                        className="cancel-booking-btn"
                                                        disabled={updatingId === booking._id}
                                                        onClick={() => handleCancel(booking._id)}
                                                    >
                                                        <XCircle size={15} />
                                                        {updatingId === booking._id
                                                            ? "Cancelling..."
                                                            : "Cancel"}
                                                    </button>
                                                ) : (
                                                    <span className="booking-action-disabled">
                                                        No Action
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="no-admin-bookings">
                            <CalendarDays size={35} />
                            <h3>No bookings found</h3>
                            <p>There are no bookings in this category.</p>
                        </div>
                    )}

                </section>
            </main>
        </div>
    );
}

export default AdminBookings;
