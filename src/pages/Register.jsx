import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Hotel } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Register = () => {
    const { register } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: ""
    });

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await register(formData);
            navigate("/login");
        } catch (err) {
            setError(
                err.response?.data?.message || "Registration failed."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <Link to="/" className="auth-logo">
                    <Hotel size={30} />
                    <span>StayEase</span>
                </Link>

                <h1>Create Account</h1>
                <p>Join StayEase and enjoy a comfortable stay.</p>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <label>Full Name</label>
                    <input
                        type="text"
                        name="name"
                        placeholder="Enter your full name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />

                    <label>Email Address</label>
                    <input
                        type="email"
                        name="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />

                    <label>Password</label>
                    <input
                        type="password"
                        name="password"
                        placeholder="Create a password"
                        value={formData.password}
                        onChange={handleChange}
                        minLength={6}
                        required
                    />

                    <button
                        type="submit"
                        className="auth-submit"
                        disabled={loading}
                    >
                        {loading ? "Creating Account..." : "Create Account"}
                    </button>
                </form>

                <p className="auth-footer">
                    Already have an account? <Link to="/login">Login</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;