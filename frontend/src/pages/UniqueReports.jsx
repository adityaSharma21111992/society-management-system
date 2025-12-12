import React, { useEffect, useState, useMemo } from "react";
import api from "../services/api";
import { getAuth } from "../services/auth";
import { Bar } from "react-chartjs-2";
import "chart.js/auto";
import { Navigate } from "react-router-dom";
import Nav from "../components/Nav";

export default function UniqueReports() {
  const auth = getAuth();
  const token = auth?.token;

  if (!token) return <Navigate to="/login" replace />;

  const [flatReport, setFlatReport] = useState({});
  const [expensesReport, setExpensesReport] = useState([]);
  const [userReport, setUserReport] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [userList, setUserList] = useState([]);
  const [monthYear, setMonthYear] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });

  const [loading, setLoading] = useState(false);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [loadingFlat, setLoadingFlat] = useState(false);

  useEffect(() => {
    fetchFlatReport();
    fetchExpensesReport();
  }, []); // only once

  useEffect(() => {
    fetchUserReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUser, monthYear]);

  const fetchFlatReport = async () => {
    setLoadingFlat(true);
    try {
      const res = await api.get("/reports/flats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFlatReport(res.data || {});
    } catch (err) {
      console.error("Flat report error:", err);
      setFlatReport({});
    } finally {
      setLoadingFlat(false);
    }
  };

  const fetchExpensesReport = async () => {
    setLoadingExpenses(true);
    try {
      const res = await api.get("/reports/expenses", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setExpensesReport(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Expenses report error:", err);
      setExpensesReport([]);
    } finally {
      setLoadingExpenses(false);
    }
  };

  const fetchUserReport = async () => {
    setLoading(true);
    try {
      const query = [];
      if (selectedUser) query.push(`user_id=${selectedUser}`);
      if (monthYear.month) query.push(`month=${encodeURIComponent(monthYear.month)}`);
      if (monthYear.year) query.push(`year=${encodeURIComponent(monthYear.year)}`);
      const url = `/reports/users${query.length ? "?" + query.join("&") : ""}`;

      const res = await api.get(url, { headers: { Authorization: `Bearer ${token}` } });

      let data = res.data;
      let safeData = [];

      // Normalize response shapes:
      if (Array.isArray(data)) safeData = data;
      else if (data && Array.isArray(data.data)) safeData = data.data;
      else if (data && typeof data === "object") safeData = [data];

      // Ensure numeric fields exist
      safeData = safeData.map((r) => ({
        user_id: r.user_id,
        name: r.name || "Unknown",
        total_payments: Number(r.total_payments || 0),
        total_expenses: Number(r.total_expenses || 0),
        expenses_created_by: r.expenses_created_by || "-",
        expenses_updated_by: r.expenses_updated_by || "-",
      }));

      setUserReport(safeData);

      // Build user list for dropdown from fetched data + include existing list items if any
      const users = safeData
        .map((u) => ({ user_id: u.user_id, name: u.name }))
        .filter((v, i, a) => a.findIndex((x) => x.user_id === v.user_id) === i)
        .sort((a, b) => (a.name || "").localeCompare(b.name || ""));

      setUserList(users);
    } catch (err) {
      console.error("User report error:", err);
      setUserReport([]);
      setUserList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMonthYearChange = (e) => {
    const { name, value } = e.target;
    // Convert to number or empty string
    setMonthYear((prev) => ({ ...prev, [name]: value ? Number(value) : "" }));
  };

  // totals computed locally
  const totals = useMemo(() => {
    const tPayments = userReport.reduce((s, r) => s + Number(r.total_payments || 0), 0);
    const tExpenses = userReport.reduce((s, r) => s + Number(r.total_expenses || 0), 0);
    return { tPayments, tExpenses };
  }, [userReport]);

  return (
    <div className="reports-container">
      <Nav />

      <header className="reports-header">
        <h2>Unique Reports</h2>
      </header>

      {/* Flat Summary */}
      <div className="card">
        <h3>Flat Summary</h3>
        {loadingFlat ? (
          <p>Loading...</p>
        ) : (
          <div className="flat-summary">
            {(flatReport.ownership || []).map((o) => (
              <div className="stat" key={o.ownership_type}>
                <h4>{o.ownership_type}</h4>
                <p>{o.count}</p>
              </div>
            ))}
            <div className="stat">
              <h4>Paid Properly</h4>
              <p>
                {flatReport.paid_properly || 0} / {flatReport.total_flats || 0}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Expenses Trends */}
      <div className="card">
        <h3>Expenses Trends</h3>
        {loadingExpenses ? (
          <p>Loading...</p>
        ) : (
          <Bar
            data={{
              labels: expensesReport.map((e) => e.month || "-"),
              datasets: [
                {
                  label: "Expenses",
                  data: expensesReport.map((e) => Number(e.total_amount || 0)),
                  backgroundColor: "#4f46e5",
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: { legend: { display: false } },
            }}
          />
        )}
      </div>

      {/* User Report */}
      <div className="card">
        <h3>User Activity</h3>

        <div className="filters">
          <label>
            User:&nbsp;
            <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
              <option value="">All Users</option>
              {userList.map((u) => (
                <option key={u.user_id} value={u.user_id}>
                  {u.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Month:&nbsp;
            <input
              type="number"
              name="month"
              min="1"
              max="12"
              value={monthYear.month}
              onChange={handleMonthYearChange}
            />
          </label>

          <label>
            Year:&nbsp;
            <input type="number" name="year" value={monthYear.year} onChange={handleMonthYearChange} />
          </label>

          <button className="btn" onClick={fetchUserReport} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        <div style={{ marginTop: 12, marginBottom: 8 }}>
          <strong>Totals:</strong>&nbsp; Payments: ₹ {totals.tPayments.toFixed(2)} &nbsp; | &nbsp; Expenses: ₹{" "}
          {totals.tExpenses.toFixed(2)}
        </div>

        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th style={{ textAlign: "right" }}>Total Payments</th>
                <th style={{ textAlign: "right" }}>Total Expenses</th>
                <th>Expenses Created By</th>
                <th>Expenses Updated By</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center", padding: 12 }}>
                    Loading...
                  </td>
                </tr>
              ) : userReport.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center", padding: 12 }}>
                    No data found
                  </td>
                </tr>
              ) : (
                userReport.map((u) => (
                  <tr key={u.user_id}>
                    <td>{u.name}</td>
                    <td style={{ textAlign: "right" }}>₹ {Number(u.total_payments || 0).toFixed(2)}</td>
                    <td style={{ textAlign: "right" }}>₹ {Number(u.total_expenses || 0).toFixed(2)}</td>
                    <td>{u.expenses_created_by || "-"}</td>
                    <td>{u.expenses_updated_by || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        /* Navbar fix */
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

        .reports-container {
          padding: 24px;
          padding-top: 80px;
          font-family: 'Segoe UI', sans-serif;
          background: #f4f6f8;
          min-height: 100vh;
        }

        .reports-header { margin-bottom: 24px; }

        .card {
          background: #fff;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }

        .flat-summary { display:flex; gap:24px; flex-wrap:wrap; margin-top:12px; }
        .stat { flex:1; background: rgba(79,70,229,0.05); padding:16px; border-radius:12px; text-align:center; }
        .stat h4 { font-weight:600; margin-bottom:8px; }

        .filters { display:flex; gap:12px; align-items:center; margin-bottom:12px; flex-wrap:wrap; }
        .filters select, .filters input { padding:8px 12px; border-radius:8px; border:1px solid #ccc; }

        .table { width:100%; border-collapse:collapse; margin-top:12px; }
        .table th, .table td { padding:12px; border-bottom:1px solid #eee; text-align:left; }

        .table-responsive { overflow-x:auto; }

        .btn { padding:8px 12px; border-radius:8px; border:none; background:#4f46e5; color:#fff; cursor:pointer; font-weight:600; }
        .btn:disabled { background:#a3a3f0; cursor:not-allowed; }

        @media (max-width:700px) {
          .flat-summary { flex-direction:column; }
          .filters { flex-direction:column; align-items:flex-start; }
        }
      `}</style>
    </div>
  );
}
