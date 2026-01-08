import { createContext, useContext, useState, useEffect } from "react";
import { getCurrentUser } from "../api/auth";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const BYPASS_AUTH = import.meta.env.VITE_BYPASS_AUTH === "true";

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (BYPASS_AUTH) {
          setUser({ id: "test-user", username: "Guest" });
          setLoading(false);
          return;
        }
        
        const token = localStorage.getItem("access_token");
        if (!token) {
          setUser(null);
          setLoading(false);
          return;
        }

        const currentUser = await getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        } else {
          // Try to get from localStorage as fallback
          const storedUser = localStorage.getItem("user");
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          } else {
            setUser(null);
          }
        }
      } catch (err) {
        console.error("Auth init error:", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = (userData, token) => {
    if (token) {
      localStorage.setItem("access_token", token);
    }
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, BYPASS_AUTH }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
