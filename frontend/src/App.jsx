import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Flats from './pages/Flats'
import Payments from './pages/Payments'
import Expenses from './pages/Expenses'
import Reports from './pages/Reports'
import Documents from './pages/Documents'
import Meetings from './pages/Meetings'
import Nav from './components/Nav'
import { getAuth } from './services/auth'


function PrivateRoute({ children }) {
return getAuth() ? children : <Navigate to="/login" replace />
}


export default function App() {
return (
<div className="app-root">
<Nav />
<main className="main-area">
<Routes>
<Route path="/login" element={<Login />} />
<Route
path="/"
element={<PrivateRoute><Dashboard /></PrivateRoute>}
/>
<Route path="/flats" element={<PrivateRoute><Flats /></PrivateRoute>} />
<Route path="/payments" element={<PrivateRoute><Payments /></PrivateRoute>} />
<Route path="/expenses" element={<PrivateRoute><Expenses /></PrivateRoute>} />
<Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
<Route path="/documents" element={<PrivateRoute><Documents /></PrivateRoute>} />
<Route path="/meetings" element={<PrivateRoute><Meetings /></PrivateRoute>} />
</Routes>
</main>
</div>
)
}