// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { getAuth } from "../services/auth";

export default function ProtectedRoute({ children }) {
  const auth = getAuth(); // this should return token/user info

  if (!auth || !auth.token) {
    // not logged in, redirect to login
    return <Navigate to="/login" replace />;
  }

  // logged in, render the children
  return children;
}
