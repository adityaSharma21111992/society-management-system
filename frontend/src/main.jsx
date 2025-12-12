import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import Login from './pages/Login'  // adjust path if needed
import Dashboard from './pages/Dashboard'
import Flats from './pages/Flats'
import Payments from './pages/Payments'
import Expenses from './pages/Expenses'
import Reports from './pages/Reports'
import Users from './pages/Users'
import UniqueReports from './pages/UniqueReports'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Default route */}
        <Route path="/" element={<App />} />
        {/* Login route */}
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/flats" element={<Flats />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/users" element={<Users />} />  
        <Route path="/uniqueReports" element={<UniqueReports/>} />  
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
