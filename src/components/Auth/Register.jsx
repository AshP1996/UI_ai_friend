import { useState } from "react";
import http from "../../services/http";
import { API_ENDPOINTS } from "../../config/api";
import "./Auth.css";

export default function Register({ onSuccess, switchToLogin }) {
  const [form, setForm] = useState({
    username: "",
    password: "",
    email: "",
    name: "",
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleRegister = async (e) => {
    e.preventDefault();

    if (form.password.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    const payload = {
      username: form.username.trim(),
      password: form.password.trim(),
      email: form.email.trim(),
      name: form.name.trim(),
    };

    const res = await http.post(API_ENDPOINTS.REGISTER, payload);

    localStorage.setItem("access_token", res.data.access_token);
    onSuccess();
  };

  return (
    <div className="auth-card">
      <h2>Register</h2>

      <form onSubmit={handleRegister}>
        <input
          name="name"
          placeholder="Full Name"
          onChange={handleChange}
          required
        />

        <input
          name="email"
          placeholder="Email"
          type="email"
          onChange={handleChange}
          required
        />

        <input
          name="username"
          placeholder="Username"
          onChange={handleChange}
          required
        />

        <input
        name="password"
        type="password"
        placeholder="Password (min 6 characters)"
        minLength={6}
        onChange={handleChange}
        required
        />

        <button type="submit">Register</button>
      </form>

      <p className="link" onClick={switchToLogin}>
        Back to login
      </p>
    </div>
  );
}
