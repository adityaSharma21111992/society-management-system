// src/pages/Login.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { setAuth, getAuth } from "../services/auth";
import logo from "../assets/logo.png";

export default function Login() {
  const navigate = useNavigate();
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    const auth = getAuth();
    if (auth && auth.token) navigate("/dashboard", { replace: true });
  }, [navigate]);

  const login = async () => {
    if (!id || !password) {
      setStatus("⚠️ Please enter Email / Username / Phone and Password");
      return;
    }
    setLoading(true);
    setStatus("⏳ Logging in...");

    try {
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

      setAuth({ id: userId, token, role, email: user.email || id });

      if (userId && token) {
        localStorage.setItem("token", token);
        localStorage.setItem("user_id", userId);
        localStorage.setItem("user_name", user.name || "User");
        localStorage.setItem("role", role);
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("user_role", role);
      }

      setStatus("✅ Login successful!");
      navigate("/dashboard", { replace: true });
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
        <h2 className="login-title">Welcome</h2>
        <p className="login-subtitle">Sign in to your Society Portal</p>

        <input
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder="Email / Username / Phone"
          className="login-input"
          disabled={loading}
        />

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
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
          background: rgba(255,255,255,0.05);
          backdrop-filter: blur(14px);
          border-radius: 22px;
          padding: 45px 35px;
          width: 400px;
          text-align: center;
          color: #fff;
          animation: fadeIn 0.7s ease-in-out;
          box-shadow: 0 12px 28px rgba(0,0,0,0.35);
          border: 1px solid rgba(255,255,255,0.12);
        }
        .login-logo { width: 180px; margin-bottom: 20px; user-select: none; filter: brightness(1) contrast(1.2); }
        .login-title { font-size: 2rem; font-weight: 700; margin-bottom: 6px; color: #fff; }
        .login-subtitle { font-size: 1rem; color:#ccc; margin-bottom: 28px; }
        .login-input {
          width:100%; padding:14px 18px; border:none; border-radius:10px;
          background: rgba(255,255,255,0.12); color:#fff; font-size:1rem; margin-bottom:18px; outline:none;
          transition: all 0.25s ease;
        }
        .login-input:focus { background: rgba(255,255,255,0.2); box-shadow: 0 0 0 3px rgba(79,70,229,0.5); }
        .login-btn {
          width:100%; background:#4f46e5; color:white; padding:14px; border:none; border-radius:10px; font-weight:600; cursor:pointer;
          transition: all 0.25s ease;
        }
        .login-btn:hover { background:#3e3ac9; transform: scale(1.03); }
        .login-btn:disabled { background:#777; cursor:not-allowed; }
        .login-status { margin-top:18px; font-size:0.95rem; color:#ffe066; min-height:20px; }
        @keyframes fadeIn { from { opacity:0; transform: translateY(15px);} to { opacity:1; transform: translateY(0);} }
        @media (max-width:480px) { .login-card { width:90%; padding:35px 25px; } .login-logo { width:140px; } }
      `}</style>
    </div>
  );
}
