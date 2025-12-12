import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { clearAuth } from '../services/auth';

export default function Navbar() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("User");

  // ✅ Load user info from localStorage on mount
  useEffect(() => {
    const storedName = localStorage.getItem("user_name");
    if (storedName) setUserName(storedName);
  }, []);

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <>
      <nav className="navbar">
        <h2 className="society-name">🏢 Orion Pride Society</h2>
        <div className="nav-right">
          {/* ✅ Dynamically show user name */}
          <span>Welcome, {userName}</span>
          <button className="btn logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      {/* Styles */}
      <style>{`
        .navbar {
          background-color: #0a84ff;
          color: white;
          padding: 15px 25px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: sticky;
          top: 0;
          z-index: 1000;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        }
        .society-name {
          margin: 0;
          font-size: 1.4em;
          font-weight: 600;
        }
        .nav-right {
          display: flex;
          gap: 15px;
          align-items: center;
        }
        .btn {
          border: none;
          padding: 6px 14px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
        }
        .btn.logout {
          background-color: #ff3b30;
          color: white;
        }
        .btn.logout:hover {
          background-color: #c1271f;
        }
      `}</style>
    </>
  );
}
