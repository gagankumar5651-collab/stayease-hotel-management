import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Hotel, Eye, EyeOff } from "lucide-react";

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });

    const [showPassword, setShowPassword] = useState(false);
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
            const data = await login(formData);
            console.log("LOGIN USER:", data.user);
            const role = data.user?.role;

            if (role === "admin") {
                navigate("/admin/dashboard");
            } else if (role === "staff") {
                navigate("/staff/dashboard");
            } else {
                navigate("/my-account");
            }
        } catch (err) {
            setError(
                err.response?.data?.message || "Login failed. Please try again."
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

                <h1>Welcome Back</h1>
                <p>Login to continue your StayEase experience.</p>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleSubmit}>
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
                    <div className="password-field">
                        <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            placeholder="Enter your password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />

                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <EyeOff /> : <Eye />}
                        </button>
                    </div>

                    <button
                        type="submit"
                        className="auth-submit"
                        disabled={loading}
                    >
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </form>

                <p className="auth-footer">
                    Don't have an account? <Link to="/register">Register</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;