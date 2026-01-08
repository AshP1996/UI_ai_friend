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

