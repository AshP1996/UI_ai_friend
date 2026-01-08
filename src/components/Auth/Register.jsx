import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import http from "../../services/http";
import { API_ENDPOINTS } from "../../config/api";
import { useAuth } from "../../context/AuthContext";
import "./Auth.css";

export default function Register() {
  const [form, setForm] = useState({
    username: "",
    password: "",
    email: "",
    name: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
    const payload = {
      username: form.username.trim(),
      password: form.password.trim(),
      email: form.email.trim(),
      name: form.name.trim(),
    };

    const res = await http.post(API_ENDPOINTS.REGISTER, payload);

      const userData = {
        id: res.data.user_id || form.username,
        username: form.username,
        email: form.email,
        name: form.name,
        ...res.data.user
      };

      login(userData, res.data.access_token);
      localStorage.setItem("user", JSON.stringify(userData));
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-background">
        <div className="auth-gradient"></div>
        <div className="auth-particles">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="particle" style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`
            }}></div>
          ))}
        </div>
      </div>

      <div className="auth-container">
    <div className="auth-card">
          <div className="auth-header">
            <div className="auth-icon">✨</div>
            <h1>Create Account</h1>
            <p>Join your AI Friend today</p>
          </div>

          {error && (
            <div className="error-message">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="auth-form">
            <div className="input-group">
              <span className="input-icon">👤</span>
        <input
          name="name"
                type="text"
          placeholder="Full Name"
                value={form.name}
          onChange={handleChange}
          required
                disabled={loading}
                className="auth-input"
        />
            </div>

            <div className="input-group">
              <span className="input-icon">📧</span>
        <input
          name="email"
                type="email"
          placeholder="Email"
                value={form.email}
          onChange={handleChange}
          required
                disabled={loading}
                className="auth-input"
        />
            </div>

            <div className="input-group">
              <span className="input-icon">🔑</span>
        <input
          name="username"
                type="text"
          placeholder="Username"
                value={form.username}
          onChange={handleChange}
          required
                disabled={loading}
                className="auth-input"
        />
            </div>

            <div className="input-group">
              <span className="input-icon">🔒</span>
        <input
        name="password"
        type="password"
        placeholder="Password (min 6 characters)"
        minLength={6}
                value={form.password}
        onChange={handleChange}
        required
                disabled={loading}
                className="auth-input"
        />
            </div>

            <button type="submit" disabled={loading} className="auth-button">
              {loading ? (
                <>
                  <span className="spinner"></span>
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <span>🚀</span>
                  <span>Sign Up</span>
                </>
              )}
            </button>
      </form>

          <div className="auth-footer">
            <p>Already have an account?</p>
            <Link to="/login" className="auth-link">
              Sign In →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
