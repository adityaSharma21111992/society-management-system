// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { getAuth } from '../services/auth';

export default function ProtectedRoute({ children }) {
  const auth = getAuth();
  if (!auth || !auth.token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
