// src/pages/Login.jsx
import React, { useState } from "react";
import api from "../services/api";
import { setAuth } from "../services/auth";
import logo from "../assets/logo.png";

export default function Login() {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async () => {
    if (!id || !password) {
      setStatus("⚠️ Please enter Email / Username / Phone and Password");
      return;
    }

    setLoading(true);
    setStatus("⏳ Logging in...");

    try {
      // ✅ Choose endpoint based on user type
      let endpoint = "/login";
      const idLower = id.toLowerCase();
      if (
        idLower.includes("admin") ||
        idLower === "superadmin" ||
        idLower.endsWith("@admin.com")
      ) {
        endpoint = "/admin/login";
      }

      const res = await api.post(endpoint, { id, password });

      const token = res.data.token;
      const user = res.data.user || {};
      const role = res.data.role || user.role || "user";
      const userId = user.user_id || user.id || null;
      const email = user.email || id;

      console.log("🔹 Token used:", token);


      // ✅ Save login data in both localStorage & helper
      setAuth({ id: userId, token, role, email });

      console.log("🔹 Token after setting:", token);


      if (userId && token) {
        localStorage.setItem("token", token);
        localStorage.setItem("user_id", userId);
        localStorage.setItem("user_name", res.data.user.name);
        localStorage.setItem("role", res.data.user.role);
        localStorage.setItem("user", JSON.stringify(user));
      }

      if (user.name) {
        localStorage.setItem("user_name", user.name);
      }
      localStorage.setItem("user_role", role);

      setStatus("✅ Login successful!");
      setTimeout(() => (window.location.href = "/dashboard"), 800);
    } catch (err) {
      console.error("Login error:", err);
      setStatus(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "❌ Invalid credentials or server error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <img src={logo} alt="Orion Pride Logo" className="login-logo" />
        <h2 className="login-title">Welcome Back 👋</h2>
        <p className="login-subtitle">Sign in to your Society Portal</p>

        <input
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder="Enter Email / Username / Phone"
          className="login-input"
          disabled={loading}
        />

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter Password"
          className="login-input"
          disabled={loading}
        />

        <button className="login-btn" onClick={login} disabled={loading}>
          {loading ? "Please wait..." : "Login"}
        </button>

        <p className="login-status">{status}</p>
      </div>

      <style>{`
        .login-wrapper {
          height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          background: linear-gradient(135deg, #0f2027, #203a43, #2c5364);
          font-family: "Poppins", sans-serif;
        }
        .login-card {
          background: rgba(255,255,255,0.08);
          backdrop-filter: blur(12px);
          border-radius: 20px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.25);
          padding: 40px 30px;
          width: 380px;
          text-align: center;
          color: #fff;
          animation: fadeIn 0.7s ease-in-out;
        }
        .login-logo { width: 180px; margin-bottom: 15px; user-select: none; }
        .login-title { font-size: 1.9rem; font-weight: 600; margin-bottom: 6px; }
        .login-subtitle { font-size: 0.95rem; color:#ddd; margin-bottom: 25px; }
        .login-input {
          width:100%; padding:12px 15px; border:none; border-radius:8px;
          background: rgba(255,255,255,0.12); color:#fff; font-size:1rem; margin-bottom:15px; outline:none;
        }
        .login-input:focus { background: rgba(255,255,255,0.18); box-shadow: 0 0 0 2px rgba(10,132,255,0.5); }
        .login-btn {
          width:100%; background:#0a84ff; color:white; padding:12px; border:none; border-radius:8px; font-weight:600; cursor:pointer;
        }
        .login-btn:hover { background:#006fe0; transform: scale(1.02); }
        .login-btn:disabled { background:#777; cursor:not-allowed; }
        .login-status { margin-top:15px; font-size:0.9rem; color:#ffeb3b; min-height:20px; }
        @keyframes fadeIn { from { opacity:0; transform: translateY(15px);} to { opacity:1; transform: translateY(0);} }
        @media (max-width:480px) { .login-card { width:90%; padding:30px 20px; } .login-logo { width:140px; } }
      `}</style>
    </div>
  );
}
