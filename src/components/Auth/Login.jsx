import { useState } from "react";
import http from "../../services/http";
import { API_ENDPOINTS } from "../../config/api";
import "./Auth.css";

export default function Login({ onSuccess, switchToRegister }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await http.post(API_ENDPOINTS.LOGIN, {
        username,
        password,
      });

      localStorage.setItem("access_token", res.data.access_token);
      onSuccess();
    } catch (err) {
      setError("Login failed");
    }
  };

  return (
    <div className="auth-card">
      <h2>Login</h2>

      {error && <p className="error">{error}</p>}

      <form onSubmit={handleLogin}>
        <input
          required
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          required
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit">Login</button>
      </form>

      <p className="link" onClick={switchToRegister}>
        Create account
      </p>
    </div>
  );
}
