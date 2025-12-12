import React, { useEffect, useState } from "react";
import api from "../services/api";
import { getAuth } from "../services/auth";
import { Navigate } from "react-router-dom";
import Nav from "../components/Nav";

export default function Users() {
  const auth = getAuth();
  const token = auth?.token;

  if (!token) return <Navigate to="/login" replace />;

  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    name: "",
    username: "",
    mobile: "",
    email: "",
    password: "",
    role: "manager", // default manager
  });

  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const loadUsers = async () => {
    try {
      const res = await api.get("/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      alert("Unauthorized. Please login again.");
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleSubmit = async () => {
    try {
      const payload = { ...form, role: "manager" }; // enforce manager role

      if (editingId) {
        await api.put(`/users/${editingId}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await api.post("/users", payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      setShowModal(false);
      setEditingId(null);
      setForm({
        name: "",
        username: "",
        mobile: "",
        email: "",
        password: "",
        role: "manager",
      });
      loadUsers();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Error saving user");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    try {
      await api.delete(`/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      loadUsers();
    } catch (err) {
      console.error(err);
      alert("Failed to delete user");
    }
  };

  return (
    <div className="users-container">
      <Nav />

      <div className="header">
        <h2>User Management</h2>
        <button className="btn-add" onClick={() => setShowModal(true)}>
          + Add User
        </button>
      </div>

      <div className="table-wrapper">
        {users.length === 0 ? (
          <p className="no-users">No users found.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Mobile</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {users.map((u) => {
                const isAdminUser = u.role === "admin"; // check admin

                return (
                  <tr key={u.user_id}>
                    <td>{u.name}</td>
                    <td>{u.username}</td>
                    <td>{u.mobile}</td>
                    <td>{u.email}</td>
                    <td>{u.role}</td>
                    <td>{u.status || "active"}</td>

                    <td>
                      {/* Hide actions if admin user */}
                      {!isAdminUser && (
                        <>
                          <button
                            className="btn btn-edit"
                            onClick={() => {
                              setForm({ ...u, password: "" });
                              setEditingId(u.user_id);
                              setShowModal(true);
                            }}
                          >
                            Edit
                          </button>

                          <button
                            className="btn btn-delete"
                            onClick={() => handleDelete(u.user_id)}
                          >
                            Delete
                          </button>
                        </>
                      )}

                      {/* Show nothing for admin user */}
                      {isAdminUser && <span>—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>{editingId ? "Edit User" : "Add User"}</h3>
            <div className="modal-body">
              <input
                placeholder="Name"
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
              />
              <input
                placeholder="Username"
                value={form.username}
                onChange={(e) =>
                  setForm({ ...form, username: e.target.value })
                }
              />
              <input
                placeholder="Mobile"
                value={form.mobile}
                onChange={(e) =>
                  setForm({ ...form, mobile: e.target.value })
                }
              />
              <input
                placeholder="Email"
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
              />

              {!editingId && (
                <input
                  placeholder="Password"
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                />
              )}

              {/* Read-only role field */}
              <input
                type="text"
                value="Manager"
                readOnly
                className="form-control"
              />
            </div>

            <div className="modal-actions">
              <button className="btn btn-primary" onClick={handleSubmit}>
                {editingId ? "Update" : "Add"}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Your styles unchanged */}
      <style>{`
        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 60px;
          background: #4f46e5;
          color: #fff;
          display: flex;
          align-items: center;
          padding: 0 20px;
          z-index: 1000;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }

        .users-container {
          padding: 24px;
          padding-top: 80px;
          font-family: 'Segoe UI', sans-serif;
          background: linear-gradient(135deg, #f5f7fa, #c3cfe2);
          min-height: 100vh;
        }

        .header { display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; }

        .btn-add {
          background: #4f46e5; color:#fff; border:none; border-radius:8px;
          padding:10px 16px; cursor:pointer; font-weight:600;
          box-shadow: 0 6px 15px rgba(0,0,0,0.1); transition: all 0.2s ease;
        }
        .btn-add:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(0,0,0,0.15); }

        .table-wrapper { overflow-x:auto; }
        .table { width:100%; border-collapse:collapse; background: rgba(255,255,255,0.95); border-radius:12px; overflow:hidden; box-shadow: 0 4px 25px rgba(0,0,0,0.05); }
        .table th, .table td { padding:14px 16px; text-align:left; }
        .table th { background: rgba(79,70,229,0.1); font-weight:600; }
        .table tr:hover { background: rgba(79,70,229,0.05); transition: all 0.2s ease; }

        .btn { padding:6px 12px; border:none; border-radius:6px; cursor:pointer; font-weight:500; margin-right:6px; transition: all 0.2s ease; }
        .btn-edit { background:#10b981; color:#fff; }
        .btn-edit:hover { background:#0f9f70; transform: translateY(-2px); }
        .btn-delete { background:#ef4444; color:#fff; }
        .btn-delete:hover { background:#dc2626; transform: translateY(-2px); }

        .modal {
          position:fixed; inset:0; display:flex; justify-content:center; align-items:center;
          background: rgba(0,0,0,0.6); backdrop-filter: blur(5px); z-index:1000; padding:20px;
        }
        .modal-content {
          background: rgba(255,255,255,0.95); border-radius:16px; width:400px; max-width:100%; padding:24px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.1); display:flex; flex-direction:column; gap:12px;
          animation: slideIn 0.3s ease;
        }
        @keyframes slideIn { from { opacity:0; transform: translateY(-20px); } to { opacity:1; transform: translateY(0); } }
        .modal-body input, .modal-body select { padding:12px; border-radius:10px; border:1px solid #ccc; margin-bottom:12px; font-size:14px; width:100%; background: rgba(255,255,255,0.9); transition: all 0.2s ease; }
        .modal-body input:focus, .modal-body select:focus { outline:none; border-color:#4f46e5; box-shadow:0 0 8px rgba(79,70,229,0.3); }
        .modal-actions { display:flex; justify-content:flex-end; gap:10px; margin-top:8px; }
        .btn-primary { background:#4f46e5; color:#fff; }
        .btn-primary:hover { background:#4338ca; transform: translateY(-2px); }
        .btn-secondary { background:#e5e7eb; color:#111; }
        .btn-secondary:hover { background:#d1d5db; transform: translateY(-2px); }

        .no-users { text-align:center; font-size:16px; color:#666; margin-top:40px; }

        @media (max-width:700px) {
          .table th, .table td { padding:10px; }
          .header { flex-direction:column; gap:12px; align-items:flex-start; }
        }
      `}</style>
    </div>
  );
}
