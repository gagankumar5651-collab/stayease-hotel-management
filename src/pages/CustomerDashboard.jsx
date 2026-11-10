
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import {
    getMyBookings,
    cancelBooking
} from "../services/bookingService";

import {
    createRequest,
    getMyRequests,
    cancelRequest
} from "../services/requestService";

import {
    getNotifications,
    markNotificationRead
} from "../services/notificationService";

import {
    CalendarDays,
    Bell,
    ConciergeBell,
    LogOut,
    Hotel,
    IndianRupee,
    Users,
    XCircle,
    Search,
    RefreshCw,
    Clock,
    CheckCircle,
    BedDouble,
    ClipboardList,
    AlertCircle
} from "lucide-react";

import "./CustomerDashboard.css";

const CustomerDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [bookings, setBookings] = useState([]);
    const [requests, setRequests] = useState([]);
    const [notifications, setNotifications] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [bookingFilter, setBookingFilter] = useState("all");
    const [requestFilter, setRequestFilter] = useState("all");
    const [notificationFilter, setNotificationFilter] = useState("all");

    const [cancellingId, setCancellingId] = useState(null);
    const [cancellingRequestId, setCancellingRequestId] = useState(null);

    // Service request form
    const [requestForm, setRequestForm] = useState({
        roomNumber: "",
        requestType: "Extra Pillow",
        description: ""
    });

    const [submittingRequest, setSubmittingRequest] = useState(false);
    const [requestMessage, setRequestMessage] = useState("");
    const [requestMessageType, setRequestMessageType] = useState("");

    // Fetch dashboard data
    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError("");

            const results = await Promise.allSettled([
                getMyBookings(),
                getMyRequests(),
                getNotifications()
            ]);

            const [bookingResult, requestResult, notificationResult] = results;

            if (bookingResult.status === "fulfilled") {
                const data = bookingResult.value;
                setBookings(Array.isArray(data) ? data : data.bookings || []);
            }

            if (requestResult.status === "fulfilled") {
                const data = requestResult.value;
                setRequests(Array.isArray(data) ? data : data.requests || []);
            }

            if (notificationResult.status === "fulfilled") {
                const data = notificationResult.value;
                setNotifications(
                    Array.isArray(data) ? data : data.notifications || []
                );
            }

            if (results.every(result => result.status === "rejected")) {
                setError("Unable to load dashboard data. Please try again.");
            }
        } catch (err) {
            setError("Something went wrong while loading your dashboard.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    // Logout
    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    // Cancel booking
    const handleCancelBooking = async (bookingId) => {
        if (!window.confirm("Are you sure you want to cancel this booking?")) {
            return;
        }

        try {
            setCancellingId(bookingId);

            const response = await cancelBooking(bookingId);

            setBookings(previous =>
                previous.map(booking =>
                    booking._id === bookingId
                        ? { ...booking, status: "cancelled" }
                        : booking
                )
            );

            alert(response.message || "Booking cancelled successfully!");
        } catch (err) {
            alert(
                err.response?.data?.message ||
                "Unable to cancel booking."
            );
        } finally {
            setCancellingId(null);
        }
    };

    // Cancel service request
    const handleCancelRequest = async (requestId) => {
        if (!window.confirm("Are you sure you want to cancel this request?")) {
            return;
        }

        try {
            setCancellingRequestId(requestId);

            const response = await cancelRequest(requestId);

            setRequests(previous =>
                previous.map(request =>
                    request._id === requestId
                        ? { ...request, status: "Cancelled" }
                        : request
                )
            );

            alert(response.message || "Request cancelled successfully!");
        } catch (err) {
            alert(
                err.response?.data?.message ||
                "Unable to cancel this request."
            );
        } finally {
            setCancellingRequestId(null);
        }
    };

    // Create service request
    const handleCreateRequest = async (e) => {
        e.preventDefault();

        setRequestMessage("");
        setRequestMessageType("");

        if (!requestForm.roomNumber.trim()) {
            setRequestMessage("Please enter your room number.");
            setRequestMessageType("error");
            return;
        }

        try {
            setSubmittingRequest(true);

            await createRequest({
                roomNumber: Number(requestForm.roomNumber),
                requestType: requestForm.requestType,
                description: requestForm.description.trim()
            });

            setRequestMessage("Service request submitted successfully!");
            setRequestMessageType("success");

            setRequestForm({
                roomNumber: "",
                requestType: "Extra Pillow",
                description: ""
            });

            const updatedRequests = await getMyRequests();

            setRequests(
                Array.isArray(updatedRequests)
                    ? updatedRequests
                    : updatedRequests.requests || []
            );

        } catch (err) {
            setRequestMessage(
                err.response?.data?.message ||
                "Failed to submit service request."
            );
            setRequestMessageType("error");
        } finally {
            setSubmittingRequest(false);
        }
    };
    const handleMarkAsRead = async (notificationId) => {
    try {
        await markNotificationRead(notificationId);

        setNotifications(previous =>
            previous.map(notification =>
                notification._id === notificationId
                    ? { ...notification, isRead: true }
                    : notification
            )
        );
    } catch (error) {
        alert(
            error.response?.data?.message ||
            "Unable to mark notification as read."
        );
    }
};

    // Filter bookings
    const filteredBookings = useMemo(() => {
        return bookings.filter(booking => {
            const status = booking.status?.toLowerCase() || "";
            const roomNumber =
                booking.room?.roomNumber || booking.roomNumber || "";

            const matchesFilter =
                bookingFilter === "all" || status === bookingFilter;

            const matchesSearch =
                String(roomNumber).toLowerCase().includes(search.toLowerCase()) ||
                String(booking._id).toLowerCase().includes(search.toLowerCase()) ||
                String(booking.room?.roomType || "")
                    .toLowerCase()
                    .includes(search.toLowerCase());

            return matchesFilter && matchesSearch;
        });
    }, [bookings, bookingFilter, search]);

    // Filter requests
    const filteredRequests = requests.filter(request =>
        requestFilter === "all" ||
        request.status?.toLowerCase() === requestFilter
    );

    // Filter notifications
    const filteredNotifications = notifications.filter(notification => {
        if (notificationFilter === "all") return true;

        return notificationFilter === "read"
            ? notification.isRead
            : !notification.isRead;
    });

    const pendingBookings = bookings.filter(booking =>
        ["pending", "confirmed"].includes(booking.status?.toLowerCase())
    ).length;

    const unreadNotifications = notifications.filter(
        notification => !notification.isRead
    ).length;

    const getStatusClass = status =>
        status?.toLowerCase().replace(/\s+/g, "-") || "unknown";

    const formatDate = date => {
        if (!date) return "N/A";

        return new Date(date).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    };

    if (loading) {
        return (
            <div className="customer-loading">
                <RefreshCw className="loading-icon" size={32} />
                <h3>Loading your dashboard...</h3>
                <p>Please wait a moment.</p>
            </div>
        );
    }

    return (
        <div className="customer-dashboard">

            {/* HEADER */}

            <header className="customer-header">
                <div className="customer-brand">
                    <div className="brand-icon">
                        <Hotel size={25} />
                    </div>

                    <div>
                        <h2>StayEase</h2>
                        <span>Hotel Management</span>
                    </div>
                </div>

                <div className="header-actions">
                    <span className="customer-name">
                        Hello, {user?.name || "Guest"}
                    </span>

                    <button className="logout-button" onClick={handleLogout}>
                        <LogOut size={17} />
                        Logout
                    </button>
                </div>
            </header>

            <main className="customer-content">

                {/* WELCOME */}

                <section className="customer-welcome">
                    <div>
                        <span className="welcome-label">CUSTOMER DASHBOARD</span>

                        <h1>Welcome back, {user?.name || "Guest"}!</h1>

                        <p>
                            Manage your bookings, room services and notifications
                            from one place.
                        </p>
                    </div>

                    <div className="welcome-icon">
                        <Hotel size={65} />
                    </div>
                </section>

                {error && (
                    <div className="customer-error">
                        <AlertCircle size={19} />
                        {error}
                        <button onClick={fetchDashboardData}>Retry</button>
                    </div>
                )}

                {/* OVERVIEW */}

                <div className="customer-section-heading">
                    <div>
                        <h2>Your Overview</h2>
                        <p>A quick summary of your hotel activity.</p>
                    </div>

                    <button className="refresh-button" onClick={fetchDashboardData}>
                        <RefreshCw size={16} />
                        Refresh
                    </button>
                </div>

                <section className="customer-stats">

                    <div className="customer-stat-card">
                        <div className="stat-icon blue"><CalendarDays /></div>
                        <div>
                            <h3>{bookings.length}</h3>
                            <p>Total Bookings</p>
                        </div>
                    </div>

                    <div className="customer-stat-card">
                        <div className="stat-icon purple"><Clock /></div>
                        <div>
                            <h3>{pendingBookings}</h3>
                            <p>Active Bookings</p>
                        </div>
                    </div>

                    <div className="customer-stat-card">
                        <div className="stat-icon orange"><ConciergeBell /></div>
                        <div>
                            <h3>{requests.length}</h3>
                            <p>Service Requests</p>
                        </div>
                    </div>

                    <div className="customer-stat-card">
                        <div className="stat-icon green"><Bell /></div>
                        <div>
                            <h3>{unreadNotifications}</h3>
                            <p>Unread Notifications</p>
                        </div>
                    </div>

                </section>

                {/* MY BOOKINGS */}

                <section className="customer-section">
                    <div className="section-title">
                        <div className="section-title-icon"><BedDouble /></div>

                        <div>
                            <h2>My Bookings</h2>
                            <p>View and manage your hotel reservations.</p>
                        </div>
                    </div>

                    <div className="customer-toolbar">
                        <div className="customer-search">
                            <Search size={18} />

                            <input
                                type="text"
                                placeholder="Search room or booking ID..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>

                        <select
                            value={bookingFilter}
                            onChange={e => setBookingFilter(e.target.value)}
                        >
                            <option value="all">All Bookings</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="pending">Pending</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>

                    {filteredBookings.length === 0 ? (
                        <div className="customer-empty">
                            <CalendarDays size={35} />
                            <h3>No bookings found</h3>
                            <p>Your bookings will appear here.</p>
                        </div>
                    ) : (
                        <div className="customer-card-list">
                            {filteredBookings.map(booking => (
                                <article
                                    className="customer-item booking-item"
                                    key={booking._id}
                                >
                                    <div className="item-top">
                                        <div>
                                            <h3>{booking.room?.roomType || "Hotel Room"}</h3>

                                            <span className="item-subtitle">
                                                Room {booking.room?.roomNumber || booking.roomNumber || "N/A"}
                                            </span>
                                        </div>

                                        <span className={`status-badge ${getStatusClass(booking.status)}`}>
                                            {booking.status || "Unknown"}
                                        </span>
                                    </div>

                                    <div className="booking-details">
                                        <div>
                                            <CalendarDays size={17} />
                                            <span>
                                                <small>Check-in</small>
                                                <strong>{formatDate(booking.checkIn)}</strong>
                                            </span>
                                        </div>

                                        <div>
                                            <CalendarDays size={17} />
                                            <span>
                                                <small>Check-out</small>
                                                <strong>{formatDate(booking.checkOut)}</strong>
                                            </span>
                                        </div>

                                        <div>
                                            <Users size={17} />
                                            <span>
                                                <small>Guests</small>
                                                <strong>{booking.guests ?? "N/A"}</strong>
                                            </span>
                                        </div>

                                        <div>
                                            <IndianRupee size={17} />
                                            <span>
                                                <small>Total Amount</small>
                                                <strong>₹{booking.totalAmount ?? "N/A"}</strong>
                                            </span>
                                        </div>
                                    </div>

                                    <div className="item-footer">
                                        <small>Booking ID: {booking._id}</small>

                                        {["pending", "confirmed"].includes(
                                            booking.status?.toLowerCase()
                                        ) && (
                                                <button
                                                    className="danger-button"
                                                    onClick={() => handleCancelBooking(booking._id)}
                                                    disabled={cancellingId === booking._id}
                                                >
                                                    <XCircle size={16} />
                                                    {cancellingId === booking._id
                                                        ? "Cancelling..."
                                                        : "Cancel Booking"}
                                                </button>
                                            )}
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>

                {/* CREATE SERVICE REQUEST */}

                <section className="customer-section">
                    <div className="section-title">
                        <div className="section-title-icon">
                            <ConciergeBell />
                        </div>

                        <div>
                            <h2>Create Service Request</h2>
                            <p>Request extra items or hotel services.</p>
                        </div>
                    </div>

                    <form
                        className="service-request-form"
                        onSubmit={handleCreateRequest}
                    >
                        <div className="form-group">
                            <label>Room Number</label>

                            <input
                                type="number"
                                min="1"
                                required
                                placeholder="Enter your room number"
                                value={requestForm.roomNumber}
                                onChange={e =>
                                    setRequestForm({
                                        ...requestForm,
                                        roomNumber: e.target.value
                                    })
                                }
                            />
                        </div>

                        <div className="form-group">
                            <label>Request Type</label>

                            <select
                                value={requestForm.requestType}
                                onChange={e =>
                                    setRequestForm({
                                        ...requestForm,
                                        requestType: e.target.value
                                    })
                                }
                            >
                                <option>Extra Pillow</option>
                                <option>Extra Towel</option>
                                <option>Room Cleaning</option>
                                <option>Drinking Water</option>
                                <option>Food Service</option>
                                <option>Other</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Description</label>

                            <textarea
                                placeholder="Describe your request..."
                                value={requestForm.description}
                                onChange={e =>
                                    setRequestForm({
                                        ...requestForm,
                                        description: e.target.value
                                    })
                                }
                            />
                        </div>

                        {requestMessage && (
                            <p className={`request-message ${requestMessageType}`}>
                                {requestMessage}
                            </p>
                        )}

                        <button type="submit" disabled={submittingRequest}>
                            {submittingRequest
                                ? "Submitting..."
                                : "Submit Request"}
                        </button>
                    </form>
                </section>

                {/* MY SERVICE REQUESTS */}

                <section className="customer-section">
                    <div className="section-title">
                        <div className="section-title-icon"><ClipboardList /></div>

                        <div>
                            <h2>My Service Requests</h2>
                            <p>Track your requests for hotel services.</p>
                        </div>
                    </div>

                    <div className="customer-toolbar">
                        <div className="toolbar-description">
                            {requests.length} total requests
                        </div>

                        <select
                            value={requestFilter}
                            onChange={e => setRequestFilter(e.target.value)}
                        >
                            <option value="all">All Requests</option>
                            <option value="pending">Pending</option>
                            <option value="accepted">Accepted</option>
                            <option value="rejected">Rejected</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>

                    {filteredRequests.length === 0 ? (
                        <div className="customer-empty">
                            <ConciergeBell size={35} />
                            <h3>No service requests found</h3>
                            <p>Your service requests will appear here.</p>
                        </div>
                    ) : (
                        <div className="customer-card-list">
                            {filteredRequests.map(request => (
                                <article className="customer-item" key={request._id}>
                                    <div className="item-top">
                                        <div>
                                            <h3>{request.requestType}</h3>

                                            <span className="item-subtitle">
                                                Room {request.roomNumber || "N/A"}
                                            </span>
                                        </div>

                                        <span className={`status-badge ${getStatusClass(request.status)}`}>
                                            {request.status}
                                        </span>
                                    </div>

                                    <p className="request-description">
                                        {request.description || "No description provided."}
                                    </p>

                                    <div className="item-footer">
                                        <small>{formatDate(request.createdAt)}</small>

                                        {request.status?.toLowerCase() === "pending" && (
                                            <button
                                                className="danger-button"
                                                onClick={() => handleCancelRequest(request._id)}
                                                disabled={cancellingRequestId === request._id}
                                            >
                                                <XCircle size={16} />
                                                {cancellingRequestId === request._id
                                                    ? "Cancelling..."
                                                    : "Cancel Request"}
                                            </button>
                                        )}
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>

                {/* NOTIFICATIONS */}

                <section className="customer-section">
                    <div className="section-title">
                        <div className="section-title-icon"><Bell /></div>

                        <div>
                            <h2>Notifications</h2>
                            <p>Stay updated about your bookings and services.</p>
                        </div>
                    </div>

                    <div className="customer-toolbar">
                        <div className="toolbar-description">
                            {unreadNotifications} unread notifications
                        </div>

                        <select
                            value={notificationFilter}
                            onChange={e => setNotificationFilter(e.target.value)}
                        >
                            <option value="all">All Notifications</option>
                            <option value="unread">Unread</option>
                            <option value="read">Read</option>
                        </select>
                    </div>

                    {filteredNotifications.length === 0 ? (
                        <div className="customer-empty">
                            <Bell size={35} />
                            <h3>No notifications found</h3>
                            <p>New updates will appear here.</p>
                        </div>
                    ) : (
                        <div className="customer-card-list">
                            {filteredNotifications.map(notification => (
                                <article
                                    className={`customer-item notification-item ${notification.isRead ? "is-read" : "is-unread"
                                        }`}
                                    key={notification._id}
                                >
                                    <div className="notification-content">
                                        <div className="notification-icon">
                                            {notification.isRead
                                                ? <CheckCircle size={20} />
                                                : <Bell size={20} />
                                            }
                                        </div>

                                        <div>
                                            <p>{notification.message}</p>
                                            <small>
                                                {notification.isRead ? "Read" : "Unread"}
                                            </small>

                                            {!notification.isRead && (
                                                <button
                                                    className="mark-read-button"
                                                    onClick={() => handleMarkAsRead(notification._id)}
                                                >
                                                    Mark as Read
                                                </button>
                                            )}



                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>

                <footer className="customer-footer">
                    <p>
                        © {new Date().getFullYear()} StayEase. All rights reserved.
                    </p>
                </footer>

            </main>
        </div>
    );
};

export default CustomerDashboard;
