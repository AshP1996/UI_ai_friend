import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Navigation.css";

export default function Navigation() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="main-navigation">
      <div className="nav-brand">
        <span className="brand-icon">🤖</span>
        <span className="brand-text">AI Friend</span>
      </div>

      <div className="nav-links">
        <Link
          to="/dashboard"
          className={`nav-link ${isActive("/dashboard") ? "active" : ""}`}
        >
          <span className="nav-icon">📊</span>
          <span>Dashboard</span>
        </Link>
        <Link
          to="/chat"
          className={`nav-link ${isActive("/chat") ? "active" : ""}`}
        >
          <span className="nav-icon">💬</span>
          <span>Chat</span>
        </Link>
        <Link
          to="/analytics"
          className={`nav-link ${isActive("/analytics") ? "active" : ""}`}
        >
          <span className="nav-icon">📈</span>
          <span>Analytics</span>
        </Link>
      </div>

      <div className="nav-user">
        <div className="user-info">
          <span className="user-icon">👤</span>
          <span className="username">{user?.username || "Guest"}</span>
        </div>
        <button onClick={logout} className="logout-btn">
          <span>🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
}
