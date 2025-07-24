// src/components/AdminRoute.jsx
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const AdminRoute = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  return isAuthenticated && isAdmin ? <Outlet /> : <Navigate to="/" />;
};

export default AdminRoute;
