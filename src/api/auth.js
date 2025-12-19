// import api from "./client";
// import { jwtDecode } from "jwt-decode";

// export const login = async (username, password) => {
//   const res = await api.post("/auth/login", { username, password });

//   const token = res.data.access_token;
//   localStorage.setItem("access_token", token);

//   // 🔥 Decode user from token
//   const decoded = jwtDecode(token);

//   // Adjust key based on backend ("sub" is most common)
//   const user = {
//     id: decoded.sub || decoded.user_id,
//     username: decoded.username || username,
//   };

//   localStorage.setItem("user", JSON.stringify(user));
//   return user;
// };

// export const getCurrentUser = () => {
//   const user = localStorage.getItem("user");
//   return user ? JSON.parse(user) : null;
// };

const BYPASS_AUTH = import.meta.env.VITE_BYPASS_AUTH === "true";

export const getCurrentUser = () => {
  if (BYPASS_AUTH) {
    // TEMP AUTH BYPASS USER
    return {
      id: "test-user",
      username: "Guest",
    };
  }

  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};

