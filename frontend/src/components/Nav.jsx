import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { clearAuth } from '../services/auth';


export default function Navbar() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState("User");

  // ✅ Load user info from localStorage on mount
  useEffect(() => {
    const storedName = localStorage.getItem("user_name");
    if (storedName) setUserName(storedName);
  }, []);

  const user_id = localStorage.getItem("user_id");

  // inside component
  const handleLogout = () => {
  clearAuth();
  navigate('/login');
};


  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!oldPassword || !newPassword || !confirmPassword) {
      return setMessage("All fields are required");
    }
    if (newPassword !== confirmPassword) {
      return setMessage("New passwords do not match");
    }

    try {
      setLoading(true);
      const res = await axios.post("http://localhost:5000/api/users/change-password", {
        user_id,
        old_password: oldPassword,
        new_password: newPassword,
      });

      setMessage(res.data.message || "Password updated successfully");
      setLoading(false);

      // Clear form and auto-close
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setShowModal(false), 2000);
    } catch (err) {
      setLoading(false);
      setMessage(err.response?.data?.error || "Failed to change password");
    }
  };

  return (
    <>
      <nav className="navbar">
        <h2 className="society-name">🏢 Orion Pride Society</h2>
        <div className="nav-right">
          {/* ✅ Dynamically show user name */}
          <span>Welcome, {userName}</span>
          <button className="btn change" onClick={() => setShowModal(true)}>
            Change Password
          </button>
          <button className="btn logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      {/* Change Password Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Change Password</h3>
            <form onSubmit={handleChangePassword}>
              <input
                type="password"
                placeholder="Old Password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
              />
              <input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <input
                type="password"
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />

              {message && <p className="msg">{message}</p>}

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn cancel"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn save"
                  disabled={loading}
                >
                  {loading ? "Updating..." : "Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Styles (same as yours) */}
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
        .btn.change {
          background-color: #ffffff;
          color: #0a84ff;
        }
        .btn.change:hover {
          background-color: #e4e4e4;
        }
      `}</style>
    </>
  );
}
