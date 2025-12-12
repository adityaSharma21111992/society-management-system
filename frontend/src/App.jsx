// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Nav from "./components/Nav";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Flats from "./pages/Flats";
import Payments from "./pages/Payments";
import Expenses from "./pages/Expenses";
import Reports from "./pages/Reports";
import Documents from "./pages/Documents";
import Meetings from "./pages/Meetings";
import UniqueReports from "./pages/UniqueReports";

import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <Router>
      <div className="app-root">
        <Nav />
        <main className="main-area">
          <Routes>
            {/* Public route */}
            <Route path="/login" element={<Login />} />

            {/* Protected routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/flats"
              element={
                <ProtectedRoute>
                  <Flats />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payments"
              element={
                <ProtectedRoute>
                  <Payments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/expenses"
              element={
                <ProtectedRoute>
                  <Expenses />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <Reports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/documents"
              element={
                <ProtectedRoute>
                  <Documents />
                </ProtectedRoute>
              }
            />
            <Route
              path="/meetings"
              element={
                <ProtectedRoute>
                  <Meetings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/unique-reports"
              element={
                <ProtectedRoute>
                  <UniqueReports />
                </ProtectedRoute>
              }
            />

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
