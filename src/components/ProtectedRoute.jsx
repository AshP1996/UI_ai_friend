import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading, BYPASS_AUTH } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner">
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
        </div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user && !BYPASS_AUTH) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
