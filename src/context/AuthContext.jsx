import React, { createContext, useState, useEffect } from "react";
import { account } from "../services/appwrite.js";

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

  const login = async (email, password) => {
    await account.createEmailPasswordSession(email, password);
    await checkSession();
  };

  const logout = async () => {
    await account.deleteSession("current");
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    checkSession, // <-- Add this line to export the function
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
