import React, { createContext, useState, useEffect } from "react";
import { account } from "../services/appwrite.js";
import { toast } from "react-toastify";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    setLoading(true);
    try {
      const currentUser = await account.get();
      const prefs = await account.getPrefs();
      setUser({ ...currentUser, role: prefs.role || "player" });
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // ⬇⬇⬇ UPDATED
  const login = async (email, password) => {
    await account.createEmailPasswordSession(email, password);

    const currentUser = await account.get();
    const prefs = await account.getPrefs();
    const userObj = { ...currentUser, role: prefs.role || "player" };

    setUser(userObj);

    return { isAdmin: userObj.role === "admin" }; // <-- return something the caller can use
  };

  const logout = async () => {
  try {
    await account.deleteSession("current");
    setUser(null);
    toast.success("Logout Successful");
  } catch (error) {
    toast.error("Error during logout");
  }
};



  const value = {
    user,
    login,
    logout,
    checkSession,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    loading,
  };

  if (loading) {
    return (
      <p style={{ textAlign: "center", marginTop: "2rem" }}>
        Loading session...
      </p>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
