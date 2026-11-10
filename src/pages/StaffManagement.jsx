
import { useEffect, useState } from "react";
import {
    getAllStaff,
    createStaff,
    updateStaff,
    deleteStaff
} from "../services/staffService";

import "./StaffManagement.css";

const initialForm = {
    name: "",
    email: "",
    password: "",
    phone: ""
};

function StaffManagement() {
    const [staff, setStaff] = useState([]);
    const [form, setForm] = useState(initialForm);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    // GET ALL STAFF
    const fetchStaff = async () => {
        try {
            setLoading(true);

            const response = await getAllStaff();
            const staffData = response.staff || response;

            setStaff(Array.isArray(staffData) ? staffData : []);
        } catch (err) {
            setError(
                err.response?.data?.message || "Failed to load staff."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStaff();
    }, []);

    // HANDLE INPUT
    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    // ADD / UPDATE STAFF
    const handleSubmit = async (e) => {
        e.preventDefault();

        setMessage("");
        setError("");

        if (!form.name.trim() || !form.email.trim()) {
            setError("Name and email are required.");
            return;
        }

        if (!editingId && form.password.length < 6) {
            setError("Password must contain at least 6 characters.");
            return;
        }

        const staffData = {
            name: form.name.trim(),
            email: form.email.trim(),
            phone: form.phone.trim()
        };

        try {
            setSubmitting(true);

            if (editingId) {
                await updateStaff(editingId, staffData);
                setMessage("Staff updated successfully!");
            } else {
                await createStaff({
                    ...staffData,
                    password: form.password
                });

                setMessage("Staff added successfully!");
            }

            setForm(initialForm);
            setEditingId(null);

            await fetchStaff();

        } catch (err) {
            setError(
                err.response?.data?.message || "Operation failed."
            );
        } finally {
            setSubmitting(false);
        }
    };

    // EDIT STAFF
    const handleEdit = (member) => {
        setEditingId(member._id || member.id);

        setForm({
            name: member.name || "",
            email: member.email || "",
            password: "",
            phone: member.phone || ""
        });

        setMessage("");
        setError("");

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };

    // DELETE STAFF
    const handleDelete = async (id) => {
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this staff member?"
        );

        if (!confirmDelete) return;

        setMessage("");
        setError("");

        try {
            await deleteStaff(id);
            setMessage("Staff deleted successfully!");

            await fetchStaff();

        } catch (err) {
            setError(
                err.response?.data?.message || "Failed to delete staff."
            );
        }
    };

    // CANCEL EDIT
    const handleCancelEdit = () => {
        setEditingId(null);
        setForm(initialForm);
        setMessage("");
        setError("");
    };

    return (
        <div className="staff-management-page">

            <div className="staff-page-heading">
                <h1>Staff Management</h1>
                <p>Manage your hotel staff members from here.</p>
            </div>

            {/* STAFF FORM */}
            <form className="staff-form" onSubmit={handleSubmit}>

                <h2>
                    {editingId ? "Update Staff Details" : "Add New Staff"}
                </h2>

                <div className="staff-form-grid">

                    <input
                        type="text"
                        name="name"
                        placeholder="Full Name"
                        value={form.name}
                        onChange={handleChange}
                        required
                    />

                    <input
                        type="email"
                        name="email"
                        placeholder="Email Address"
                        value={form.email}
                        onChange={handleChange}
                        required
                    />

                    {!editingId && (
                        <input
                            type="password"
                            name="password"
                            placeholder="Password (minimum 6 characters)"
                            value={form.password}
                            onChange={handleChange}
                            minLength="6"
                            required
                        />
                    )}

                    <input
                        type="tel"
                        name="phone"
                        placeholder="Phone Number (optional)"
                        value={form.phone}
                        onChange={handleChange}
                    />

                </div>

                <div className="staff-form-actions">

                    <button type="submit" disabled={submitting}>
                        {submitting
                            ? "Please wait..."
                            : editingId
                                ? "Update Staff"
                                : "Add Staff"}
                    </button>

                    {editingId && (
                        <button
                            type="button"
                            className="staff-cancel-btn"
                            onClick={handleCancelEdit}
                        >
                            Cancel
                        </button>
                    )}

                </div>

                {message && (
                    <p className="staff-success">{message}</p>
                )}

                {error && (
                    <p className="staff-error">{error}</p>
                )}

            </form>

            {/* STAFF LIST */}
            <section className="staff-list-section">

                <h2>All Staff ({staff.length})</h2>

                {loading ? (
                    <p>Loading staff members...</p>
                ) : staff.length === 0 ? (
                    <p>No staff members found.</p>
                ) : (

                    <div className="staff-grid">

                        {staff.map((member) => (

                            <div
                                className="staff-card"
                                key={member._id || member.id}
                            >

                                <div className="staff-avatar">
                                    {member.name?.charAt(0).toUpperCase()}
                                </div>

                                <h3>{member.name}</h3>

                                <p>
                                    <strong>Email:</strong> {member.email}
                                </p>

                                <p>
                                    <strong>Phone:</strong>{" "}
                                    {member.phone || "Not provided"}
                                </p>

                                <span className="staff-role">
                                    {member.role}
                                </span>

                                <div className="staff-card-actions">

                                    <button
                                        onClick={() => handleEdit(member)}
                                    >
                                        Edit
                                    </button>

                                    <button
                                        className="staff-delete-btn"
                                        onClick={() =>
                                            handleDelete(member._id || member.id)
                                        }
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

export default StaffManagement;
