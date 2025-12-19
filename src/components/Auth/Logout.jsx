import http from "../../services/http";
import { API_ENDPOINTS } from "../../config/api";

export default function Logout({ onLogout }) {
  const handleLogout = async () => {
    try {
      await http.post(API_ENDPOINTS.LOGOUT);
    } catch (e) {
      // even if backend fails, clear local token
    }

    localStorage.removeItem("access_token");
    onLogout();
  };

  return (
    <button onClick={handleLogout} className="logout-btn">
      Logout
    </button>
  );
}
