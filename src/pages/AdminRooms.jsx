
import { useEffect, useState } from "react";
import {
    getAllRooms,
    addRoom,
    updateRoom,
    deleteRoom
} from "../services/roomService";

import "./AdminRooms.css";

const initialForm = {
    roomNumber: "",
    roomType: "Single",
    pricePerNight: "",
    capacity: "",
    status: "available",
    description: ""
};

function AdminRooms() {
    const [rooms, setRooms] = useState([]);
    const [form, setForm] = useState(initialForm);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const fetchRooms = async () => {
        try {
            setLoading(true);
            const response = await getAllRooms();
            const roomData = response.rooms || response;
            setRooms(Array.isArray(roomData) ? roomData : []);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load rooms.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRooms();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");

        const roomNumber = Number(form.roomNumber);
        const pricePerNight = Number(form.pricePerNight);
        const capacity = Number(form.capacity);

        if (
            !Number.isInteger(roomNumber) ||
            roomNumber <= 0
        ) {
            setError("Enter a valid positive room number.");
            return;
        }

        if (!Number.isFinite(pricePerNight) || pricePerNight <= 0) {
            setError("Enter a valid room price.");
            return;
        }

        if (!Number.isInteger(capacity) || capacity < 1) {
            setError("Guest capacity must be a positive integer.");
            return;
        }

        const roomData = {
            roomNumber,
            roomType: form.roomType,
            pricePerNight,
            capacity,
            status: form.status,
            description: form.description.trim()
        };

        try {
            setSubmitting(true);

            if (editingId) {
                await updateRoom(editingId, roomData);
                setMessage("Room updated successfully!");
            } else {
                await addRoom(roomData);
                setMessage("Room added successfully!");
            }

            setForm(initialForm);
            setEditingId(null);
            await fetchRooms();

        } catch (err) {
            console.error("Room submission error:", err.response?.data || err);

            setError(
                err.response?.data?.message ||
                "Operation failed. Please try again."
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (room) => {
        setEditingId(room._id);

        setForm({
            roomNumber: String(room.roomNumber),
            roomType: room.roomType,
            pricePerNight: String(room.pricePerNight),
            capacity: String(room.capacity),
            status: room.status,
            description: room.description || ""
        });

        setMessage("");
        setError("");

        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this room?")) {
            return;
        }

        setMessage("");
        setError("");

        try {
            await deleteRoom(id);
            setMessage("Room deleted successfully!");
            await fetchRooms();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to delete room."
            );
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setForm(initialForm);
        setMessage("");
        setError("");
    };

    return (
        <div className="admin-rooms-page">
            <h1>Room Management</h1>
            <p>Manage all hotel rooms from here.</p>

            <form className="room-form" onSubmit={handleSubmit}>
                <h2>{editingId ? "Update Room" : "Add New Room"}</h2>

                <div className="room-form-grid">
                    <input
                        type="number"
                        name="roomNumber"
                        placeholder="Room Number"
                        value={form.roomNumber}
                        onChange={handleChange}
                        min="1"
                        step="1"
                        required
                    />

                    <select
                        name="roomType"
                        value={form.roomType}
                        onChange={handleChange}
                    >
                        <option value="Single">Single</option>
                        <option value="Double">Double</option>
                        <option value="Deluxe">Deluxe</option>
                        <option value="Suite">Suite</option>
                    </select>

                    <input
                        type="number"
                        name="pricePerNight"
                        placeholder="Price per night"
                        value={form.pricePerNight}
                        onChange={handleChange}
                        min="1"
                        required
                    />

                    <input
                        type="number"
                        name="capacity"
                        placeholder="Guest Capacity"
                        value={form.capacity}
                        onChange={handleChange}
                        min="1"
                        step="1"
                        required
                    />

                    <select
                        name="status"
                        value={form.status}
                        onChange={handleChange}
                    >
                        <option value="available">Available</option>
                        <option value="booked">Booked</option>
                        <option value="maintenance">Maintenance</option>
                    </select>
                </div>

                <textarea
                    name="description"
                    placeholder="Room description"
                    value={form.description}
                    onChange={handleChange}
                    rows="3"
                />

                <div className="room-form-actions">
                    <button type="submit" disabled={submitting}>
                        {submitting
                            ? "Please wait..."
                            : editingId
                                ? "Update Room"
                                : "Add Room"}
                    </button>

                    {editingId && (
                        <button
                            type="button"
                            className="cancel-edit-btn"
                            onClick={handleCancelEdit}
                        >
                            Cancel
                        </button>
                    )}
                </div>

                {message && (
                    <p className="success-message">{message}</p>
                )}

                {error && (
                    <p className="error-message">{error}</p>
                )}
            </form>

            <section className="rooms-list">
                <h2>All Rooms ({rooms.length})</h2>

                {loading ? (
                    <p>Loading rooms...</p>
                ) : rooms.length === 0 ? (
                    <p>No rooms found.</p>
                ) : (
                    <div className="rooms-grid">
                        {rooms.map((room) => (
                            <div className="room-card" key={room._id}>
                                <h3>{room.roomType} Room</h3>
                                <p>Room Number: {room.roomNumber}</p>
                                <p>Price: ₹{room.pricePerNight} / night</p>
                                <p>Capacity: {room.capacity} guests</p>
                                <p>
                                    Description: {room.description || "N/A"}
                                </p>

                                <span className={`room-status ${room.status}`}>
                                    {room.status}
                                </span>

                                <div className="room-actions">
                                    <button onClick={() => handleEdit(room)}>
                                        Edit
                                    </button>

                                    <button
                                        className="delete-room-btn"
                                        onClick={() => handleDelete(room._id)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

export default AdminRooms;
