
import { useEffect, useState } from "react";
import {
    getAllRequests,
    updateRequestStatus
} from "../services/requestService";

import "./AdminRequests.css";

function AdminRequests() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [filter, setFilter] = useState("All");

    const fetchRequests = async () => {
        try {
            setLoading(true);

            const response = await getAllRequests();
            const data = response.requests || response;

            setRequests(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(
                err.response?.data?.message || "Failed to load requests."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleStatusUpdate = async (id, status) => {
        setMessage("");
        setError("");

        try {
            setUpdatingId(id);

            await updateRequestStatus(id, { status });

            setMessage(`Request ${status.toLowerCase()} successfully!`);

            await fetchRequests();
        } catch (err) {
            setError(
                err.response?.data?.message || "Failed to update request."
            );
        } finally {
            setUpdatingId(null);
        }
    };

    const filteredRequests = requests.filter((request) => {
        if (filter === "All") return true;
        return request.status?.toLowerCase() === filter.toLowerCase();
    });

    const getStatusClass = (status) => {
        return status?.toLowerCase() || "pending";
    };

    return (
        <div className="admin-requests-page">

            <div className="requests-heading">
                <div>
                    <h1>Customer Requests</h1>
                    <p>Manage room service requests from customers.</p>
                </div>

                <button onClick={fetchRequests} className="refresh-btn">
                    Refresh
                </button>
            </div>

            <div className="request-stats">

                <div className="request-stat-card">
                    <h3>{requests.length}</h3>
                    <p>Total Requests</p>
                </div>

                <div className="request-stat-card">
                    <h3>
                        {requests.filter(r => r.status === "Pending").length}
                    </h3>
                    <p>Pending</p>
                </div>

                <div className="request-stat-card">
                    <h3>
                        {requests.filter(r => r.status === "Accepted").length}
                    </h3>
                    <p>Accepted</p>
                </div>

                <div className="request-stat-card">
                    <h3>
                        {requests.filter(r => r.status === "Rejected").length}
                    </h3>
                    <p>Rejected</p>
                </div>

            </div>

            <section className="requests-section">

                <div className="requests-toolbar">
                    <h2>All Requests</h2>

                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    >
                        <option value="All">All Requests</option>
                        <option value="Pending">Pending</option>
                        <option value="Accepted">Accepted</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Completed">Completed</option>
                    </select>
                </div>

                {message && (
                    <p className="request-success">{message}</p>
                )}

                {error && (
                    <p className="request-error">{error}</p>
                )}

                {loading ? (
                    <p>Loading requests...</p>
                ) : filteredRequests.length === 0 ? (
                    <p className="no-requests">No requests found.</p>
                ) : (

                    <div className="requests-grid">

                        {filteredRequests.map((request) => {

                            const requestId = request._id || request.id;

                            return (
                                <div className="request-card" key={requestId}>

                                    <div className="request-card-header">
                                        <h3>
                                            {request.requestType || "Room Service"}
                                        </h3>

                                        <span className={`request-status ${getStatusClass(request.status)}`}>
                                            {request.status}
                                        </span>
                                    </div>

                                    <p>
                                        <strong>Room Number:</strong>{" "}
                                        {request.roomNumber || request.room?.roomNumber || "N/A"}
                                    </p>

                                    <p>
                                        <strong>Customer:</strong>{" "}
                                        {request.user?.name || request.customer?.name || "Customer"}
                                    </p>

                                    <p>
                                        <strong>Description:</strong>{" "}
                                        {request.description || "No description"}
                                    </p>

                                    <p>
                                        <strong>Requested:</strong>{" "}
                                        {request.createdAt
                                            ? new Date(request.createdAt).toLocaleString()
                                            : "N/A"}
                                    </p>

                                    {request.status === "Pending" && (
                                        <div className="request-actions">

                                            <button
                                                className="accept-btn"
                                                disabled={updatingId === requestId}
                                                onClick={() =>
                                                    handleStatusUpdate(requestId, "Accepted")
                                                }
                                            >
                                                Accept
                                            </button>

                                            <button
                                                className="reject-btn"
                                                disabled={updatingId === requestId}
                                                onClick={() =>
                                                    handleStatusUpdate(requestId, "Rejected")
                                                }
                                            >
                                                Reject
                                            </button>

                                        </div>
                                    )}

                                    {request.status === "Accepted" && (
                                        <div className="request-actions">
                                            <button
                                                className="complete-btn"
                                                disabled={updatingId === requestId}
                                                onClick={() =>
                                                    handleStatusUpdate(requestId, "Completed")
                                                }
                                            >
                                                Mark Completed
                                            </button>
                                        </div>
                                    )}

                                </div>
                            );
                        })}

                    </div>
                )}

            </section>

        </div>
    );
}

export default AdminRequests;
