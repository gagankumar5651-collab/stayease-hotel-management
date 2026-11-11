import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { uploadProfileImage } from "../services/authService";

import {
    createBooking,
    getMyBookings,
    cancelBooking
} from "../services/bookingService";

import { getAllRooms } from "../services/roomService";

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
    AlertCircle,
    CalendarCheck,
    BookOpen
} from "lucide-react";

import "./CustomerDashboard.css";

const CustomerDashboard = () => {
    const { user, logout, updateUser } = useAuth();
    const navigate = useNavigate();

    const [bookings, setBookings] = useState([]);
    const [requests, setRequests] = useState([]);
    const [notifications, setNotifications] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [profilePhotoError, setProfilePhotoError] = useState("");

    const handleProfileImageUpload = async (e) => {
        const file = e.target.files?.[0];

        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setProfilePhotoError("Please select a valid image.");
            e.target.value = "";
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setProfilePhotoError("Image size must be less than 5 MB.");
            e.target.value = "";
            return;
        }

        try {
            setUploadingPhoto(true);
            setProfilePhotoError("");

            const response = await uploadProfileImage(file);

            updateUser(response.user);

        } catch (err) {
            setProfilePhotoError(
                err.response?.data?.message ||
                "Unable to upload profile photo."
            );
        } finally {
            setUploadingPhoto(false);
            e.target.value = "";
        }
    };

    const [search, setSearch] = useState("");
    const [bookingFilter, setBookingFilter] = useState("all");
    const [requestFilter, setRequestFilter] = useState("all");
    const [notificationFilter, setNotificationFilter] = useState("all");

    const [cancellingId, setCancellingId] = useState(null);
    const [cancellingRequestId, setCancellingRequestId] = useState(null);

    // Room booking states
    const [rooms, setRooms] = useState([]);
    const [roomLoading, setRoomLoading] = useState(false);

    const [bookingDates, setBookingDates] = useState({
        checkIn: "",
        checkOut: ""
    });

    const [guests, setGuests] = useState(1);
    const [bookingRoomId, setBookingRoomId] = useState(null);

    const [bookingMessage, setBookingMessage] = useState("");
    const [bookingMessageType, setBookingMessageType] = useState("");

    // Service request form
    const [requestForm, setRequestForm] = useState({
        roomNumber: "",
        requestType: "Extra Pillow",
        description: ""
    });

    const [submittingRequest, setSubmittingRequest] = useState(false);
    const [requestMessage, setRequestMessage] = useState("");
    const [requestMessageType, setRequestMessageType] = useState("");

    // Today's date in local timezone
    const getToday = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    };

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
                setBookings(
                    Array.isArray(data) ? data : data.bookings || []
                );
            }

            if (requestResult.status === "fulfilled") {
                const data = requestResult.value;
                setRequests(
                    Array.isArray(data) ? data : data.requests || []
                );
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

    // Fetch available rooms
    const fetchAvailableRooms = async () => {
        try {
            setRoomLoading(true);

            // If both dates are empty, show all available rooms
            if (!bookingDates.checkIn && !bookingDates.checkOut) {
                const data = await getAllRooms();
                setRooms(data.rooms || []);
                return;
            }

            // If only one date is selected, wait for the other date
            if (!bookingDates.checkIn || !bookingDates.checkOut) {
                setRooms([]);
                return;
            }

            // Fetch rooms according to selected dates
            const data = await getAllRooms(
                bookingDates.checkIn,
                bookingDates.checkOut
            );

            setRooms(data.rooms || []);

        } catch (err) {
            setRooms([]);

            setBookingMessage(
                err.response?.data?.message ||
                "Unable to load available rooms."
            );

            setBookingMessageType("error");

        } finally {
            setRoomLoading(false);
        }
    };
    // Initial dashboard loading
    useEffect(() => {
        fetchDashboardData();
    }, []);

    // Refresh available rooms when dates change
    useEffect(() => {
        fetchAvailableRooms();
    }, [bookingDates.checkIn, bookingDates.checkOut]);

    // Logout
    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    // Create room booking
    const handleBookRoom = async (room) => {
        setBookingMessage("");
        setBookingMessageType("");

        if (!bookingDates.checkIn || !bookingDates.checkOut) {
            setBookingMessage(
                "Please select both check-in and check-out dates."
            );
            setBookingMessageType("error");
            return;
        }

        if (bookingDates.checkIn < getToday()) {
            setBookingMessage("Check-in date cannot be in the past.");
            setBookingMessageType("error");
            return;
        }

        if (bookingDates.checkOut <= bookingDates.checkIn) {
            setBookingMessage("Check-out must be after check-in.");
            setBookingMessageType("error");
            return;
        }

        if (!Number.isInteger(Number(guests)) || Number(guests) < 1) {
            setBookingMessage("Please enter a valid guest count.");
            setBookingMessageType("error");
            return;
        }

        if (Number(guests) > room.capacity) {
            setBookingMessage(
                `This room allows a maximum of ${room.capacity} guests.`
            );
            setBookingMessageType("error");
            return;
        }

        try {
            setBookingRoomId(room._id);

            const response = await createBooking({
                roomId: room._id,
                checkIn: bookingDates.checkIn,
                checkOut: bookingDates.checkOut,
                guests: Number(guests)
            });

            setBookingMessage(
                response.message || "Room booked successfully!"
            );

            setBookingMessageType("success");

            // Refresh bookings and available rooms
            await Promise.all([
                fetchDashboardData(),
                fetchAvailableRooms()
            ]);

        } catch (err) {
            setBookingMessage(
                err.response?.data?.message ||
                "Unable to book this room."
            );

            setBookingMessageType("error");

            // Refresh availability in case another customer booked it
            await fetchAvailableRooms();

        } finally {
            setBookingRoomId(null);
        }
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

            // Cancelled room may become available again
            await fetchAvailableRooms();

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

    // Mark notification as read
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

        } catch (err) {
            alert(
                err.response?.data?.message ||
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
                    <div className="customer-profile">
                        <label
                            htmlFor="profile-image-input"
                            className="profile-image-label"
                            title="Change profile photo"
                        >
                            {user?.profileImage ? (
                                <img
                                    src={user.profileImage}
                                    alt="Profile"
                                    className="customer-profile-image"
                                />
                            ) : (
                                <div className="customer-profile-placeholder">
                                    {user?.name?.charAt(0)?.toUpperCase() || "G"}
                                </div>
                            )}
                        </label>

                        <input
                            id="profile-image-input"
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={handleProfileImageUpload}
                            disabled={uploadingPhoto}
                        />

                        <label
                            htmlFor="profile-image-input"
                            className="profile-upload-info"
                        >
                            <span>
                                {uploadingPhoto ? "Uploading..." : "Change Photo"}
                            </span>

                            {profilePhotoError && (
                                <small>{profilePhotoError}</small>
                            )}
                        </label>
                    </div>
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

                {/* BOOK A ROOM */}

                <section className="customer-section">
                    <div className="section-title">
                        <div className="section-title-icon">
                            <BookOpen />
                        </div>

                        <div>
                            <h2>Book a Room</h2>
                            <p>Choose your dates and find an available room.</p>
                        </div>
                    </div>

                    <div className="room-booking-filters">
                        <div className="form-group">
                            <label>Check-in Date</label>

                            <input
                                type="date"
                                min={getToday()}
                                value={bookingDates.checkIn}
                                onChange={e => {
                                    setBookingDates(previous => ({
                                        ...previous,
                                        checkIn: e.target.value
                                    }));

                                    setBookingMessage("");
                                }}
                            />
                        </div>

                        <div className="form-group">
                            <label>Check-out Date</label>

                            <input
                                type="date"
                                min={bookingDates.checkIn || getToday()}
                                value={bookingDates.checkOut}
                                onChange={e => {
                                    setBookingDates(previous => ({
                                        ...previous,
                                        checkOut: e.target.value
                                    }));

                                    setBookingMessage("");
                                }}
                            />
                        </div>

                        <div className="form-group">
                            <label>Number of Guests</label>

                            <input
                                type="number"
                                min="1"
                                max="20"
                                value={guests}
                                onChange={e => setGuests(e.target.value)}
                            />
                        </div>
                    </div>

                    {bookingMessage && (
                        <div className={`booking-message ${bookingMessageType}`}>
                            {bookingMessageType === "success"
                                ? <CheckCircle size={18} />
                                : <AlertCircle size={18} />
                            }

                            <span>{bookingMessage}</span>
                        </div>
                    )}

                    <div className="available-rooms-heading">
                        <h3>Available Rooms</h3>
                    </div>

                    {roomLoading ? (
                        <div className="customer-empty">
                            <RefreshCw className="loading-icon" size={30} />
                            <h3>Finding available rooms...</h3>
                        </div>
                    ) : rooms.length === 0 ? (
                        <div className="customer-empty">
                            <BedDouble size={35} />
                            <h3>No available rooms</h3>
                            <p>
                                Try selecting different dates or check again later.
                            </p>
                        </div>
                    ) : (
                        <div className="available-rooms-grid">
                            {rooms.map(room => (
                                <article
                                    className="available-room-card"
                                    key={room._id}
                                >
                                    <div className="available-room-icon">
                                        <Hotel size={35} />
                                    </div>

                                    <div className="available-room-info">
                                        <span className="available-label">
                                            AVAILABLE
                                        </span>

                                        <h3>{room.roomType} Room</h3>

                                        <p>Room Number: {room.roomNumber}</p>

                                        <p>
                                            {room.description ||
                                                "Comfortable room with essential facilities."}
                                        </p>
                                    </div>

                                    <div className="available-room-details">
                                        <span>
                                            <Users size={16} />
                                            {room.capacity} Guests
                                        </span>

                                        <strong>
                                            <IndianRupee size={17} />
                                            {room.pricePerNight}
                                            <small>/ night</small>
                                        </strong>
                                    </div>

                                    <button
                                        type="button"
                                        className="book-room-button"
                                        onClick={() => handleBookRoom(room)}
                                        disabled={bookingRoomId !== null}
                                    >
                                        {bookingRoomId === room._id
                                            ? "Booking..."
                                            : "Book Now"}
                                    </button>
                                </article>
                            ))}
                        </div>
                    )}
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
                                                    onClick={() =>
                                                        handleMarkAsRead(notification._id)
                                                    }
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