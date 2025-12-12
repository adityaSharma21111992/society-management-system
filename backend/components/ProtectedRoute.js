// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { getAuth } from "../services/auth";

const ProtectedRoute = ({ children }) => {
  const auth = getAuth();
  if (!auth?.token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default ProtectedRoute;
