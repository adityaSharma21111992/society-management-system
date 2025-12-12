import React, { useEffect, useState } from "react";
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

  useEffect(() => {
    fetchFlatReport();
    fetchExpensesReport();
    fetchUserReport();
  }, [selectedUser, monthYear]);

  const fetchFlatReport = async () => {
    try {
      const res = await api.get("/reports/flats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFlatReport(res.data || {});
    } catch (err) {
      console.error(err);
      setFlatReport({});
    }
  };

  const fetchExpensesReport = async () => {
    try {
      const res = await api.get("/reports/expenses", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setExpensesReport(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setExpensesReport([]);
    }
  };

  const fetchUserReport = async () => {
    try {
      let query = [];
      if (selectedUser) query.push(`user_id=${selectedUser}`);
      if (monthYear.month) query.push(`month=${monthYear.month}`);
      if (monthYear.year) query.push(`year=${monthYear.year}`);
      const url = `/reports/users${query.length ? "?" + query.join("&") : ""}`;
      const res = await api.get(url, { headers: { Authorization: `Bearer ${token}` } });

      let data = res.data;
      let safeData = [];
      if (Array.isArray(data)) safeData = data;
      else if (Array.isArray(data?.data)) safeData = data.data;
      else if (data && typeof data === "object") safeData = [data];
      setUserReport(safeData);

      const users = safeData
        .map((u) => ({ user_id: u.user_id, name: u.name }))
        .filter((v, i, a) => a.findIndex((x) => x.user_id === v.user_id) === i);
      setUserList(users);
    } catch (err) {
      console.error(err);
      setUserReport([]);
      setUserList([]);
    }
  };

  const handleMonthYearChange = (e) => {
    const { name, value } = e.target;
    setMonthYear((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="reports-container">
      <Nav />

      <header className="reports-header">
        <h2>Unique Reports</h2>
      </header>

      {/* Flat Summary */}
      <div className="card">
        <h3>Flat Summary</h3>
        <div className="flat-summary">
          {flatReport.ownership?.map((o) => (
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
      </div>

      {/* Expenses Trends */}
      <div className="card">
        <h3>Expenses Trends</h3>
        <Bar
          data={{
            labels: expensesReport.map((e) => e.month || "-"),
            datasets: [
              {
                label: "Expenses",
                data: expensesReport.map((e) => e.total_amount || 0),
                backgroundColor: "#4f46e5",
              },
            ],
          }}
          options={{
            responsive: true,
            plugins: { legend: { display: false } },
          }}
        />
      </div>

      {/* User Report */}
      <div className="card">
        <h3>User Activity</h3>
        <div className="filters">
          <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
            <option value="">All Users</option>
            {userList.map((u) => (
              <option key={u.user_id} value={u.user_id}>{u.name}</option>
            ))}
          </select>

          <input type="number" name="month" min="1" max="12" value={monthYear.month} onChange={handleMonthYearChange} placeholder="Month" />
          <input type="number" name="year" value={monthYear.year} onChange={handleMonthYearChange} placeholder="Year" />
        </div>

        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Total Payments</th>
                <th>Total Expenses</th>
                <th>Expenses Created By</th>
                <th>Expenses Updated By</th>
              </tr>
            </thead>
            <tbody>
              {userReport.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center", padding: "12px" }}>No data found</td>
                </tr>
              ) : (
                userReport.map((u) => (
                  <tr key={u.user_id}>
                    <td>{u.name}</td>
                    <td>₹ {Number(u.total_payments || 0).toFixed(2)}</td>
                    <td>₹ {Number(u.total_expenses || 0).toFixed(2)}</td>
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
          background: #4f46e5; /* same as Flats page */
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

        @media (max-width:700px) {
          .flat-summary { flex-direction:column; }
          .filters { flex-direction:column; align-items:flex-start; }
        }
      `}</style>
    </div>
  );
}
