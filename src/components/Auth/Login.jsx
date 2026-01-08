import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import http from "../../services/http";
import { API_ENDPOINTS } from "../../config/api";
import { useAuth } from "../../context/AuthContext";
import "./Auth.css";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await http.post(API_ENDPOINTS.LOGIN, {
        username,
        password,
      });

      const userData = {
        id: res.data.user_id || username,
        username: username,
        ...res.data.user
      };

      login(userData, res.data.access_token);
      localStorage.setItem("user", JSON.stringify(userData));
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed. Please check your credentials.");
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
            <div className="auth-icon">🤖</div>
            <h1>Welcome Back</h1>
            <p>Sign in to your AI Friend</p>
          </div>

          {error && (
            <div className="error-message">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="auth-form">
            <div className="input-group">
              <span className="input-icon">👤</span>
        <input
          required
                type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                className="auth-input"
        />
            </div>

            <div className="input-group">
              <span className="input-icon">🔒</span>
        <input
          required
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="auth-input"
        />
            </div>

            <button type="submit" disabled={loading} className="auth-button">
              {loading ? (
                <>
                  <span className="spinner"></span>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>🚀</span>
                  <span>Sign In</span>
                </>
              )}
            </button>
      </form>

          <div className="auth-footer">
            <p>Don't have an account?</p>
            <Link to="/register" className="auth-link">
              Create Account →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
