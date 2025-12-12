import React, { useEffect, useState } from "react";
import api from "../services/api";
import { getAuth } from "../services/auth";
import { Bar } from "react-chartjs-2";
import 'chart.js/auto';

export default function UniqueReports() {
  const [flatReport, setFlatReport] = useState({});
  const [expensesReport, setExpensesReport] = useState([]);
  const [userReport, setUserReport] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [monthYear, setMonthYear] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear() });

  const auth = getAuth();
  const token = auth?.token;

  useEffect(() => {
    fetchFlatReport();
    fetchExpensesReport();
    fetchUserReport();
  }, [selectedUser, monthYear]);

  const fetchFlatReport = async () => {
    const res = await api.get("/reports/flats", { headers: { Authorization: `Bearer ${token}` } });
    setFlatReport(res.data);
  };

  const fetchExpensesReport = async () => {
    const res = await api.get("/reports/expenses", { headers: { Authorization: `Bearer ${token}` } });
    setExpensesReport(res.data);
  };

  const fetchUserReport = async () => {
    let query = [];
    if (selectedUser) query.push(`user_id=${selectedUser}`);
    if (monthYear.month) query.push(`month=${monthYear.month}`);
    if (monthYear.year) query.push(`year=${monthYear.year}`);
    const url = `/reports/users${query.length ? "?" + query.join("&") : ""}`;

    const res = await api.get(url, { headers: { Authorization: `Bearer ${token}` } });
    setUserReport(res.data);
  };

  const handleMonthYearChange = (e) => {
    const { name, value } = e.target;
    setMonthYear(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="reports-container">
      <h2>Unique Reports</h2>

      {/* Flat Report */}
      <div className="card">
        <h3>Flat Summary</h3>
        <div className="flat-summary">
          {flatReport.ownership?.map(o => (
            <div className="stat" key={o.ownership_type}>
              <h4>{o.ownership_type}</h4>
              <p>{o.count}</p>
            </div>
          ))}
          <div className="stat">
            <h4>Paid Properly</h4>
            <p>{flatReport.paid_properly} / {flatReport.total_flats}</p>
          </div>
        </div>
      </div>

      {/* Expenses Trends */}
      <div className="card">
        <h3>Expenses Trends</h3>
        <Bar
          data={{
            labels: expensesReport.map(e => e.month),
            datasets: [{
              label: 'Expenses',
              data: expensesReport.map(e => e.total_amount),
              backgroundColor: '#4f46e5'
            }]
          }}
          options={{ responsive: true, plugins: { legend: { display: false } } }}
        />
      </div>

      {/* User Report */}
      <div className="card">
        <h3>User Activity</h3>
        <div style={{ display:'flex', gap:'12px', alignItems:'center', marginBottom:'12px' }}>
          <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
            <option value="">All Users</option>
            {userReport.map(u => <option key={u.user_id} value={u.user_id}>{u.name}</option>)}
          </select>

          <input type="number" name="month" min="1" max="12" value={monthYear.month} onChange={handleMonthYearChange} placeholder="Month" />
          <input type="number" name="year" value={monthYear.year} onChange={handleMonthYearChange} placeholder="Year" />
        </div>

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
            {userReport.map(u => (
              <tr key={u.user_id}>
                <td>{u.name}</td>
                <td>₹ {Number(u.total_payments).toFixed(2)}</td>
                <td>₹ {Number(u.total_expenses).toFixed(2)}</td>
                <td>{u.expenses_created_by || '-'}</td>
                <td>{u.expenses_updated_by || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style>{`
        .reports-container { padding: 24px; font-family: 'Segoe UI', sans-serif; background: #f0f2f5; }
        h2 { margin-bottom: 24px; }
        .card { background: rgba(255,255,255,0.95); border-radius: 16px; padding: 24px; margin-bottom: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
        .flat-summary { display:flex; gap:24px; margin-top:12px; }
        .stat { background: rgba(79,70,229,0.05); padding:16px; border-radius:12px; text-align:center; flex:1; }
        .stat h4 { font-weight:600; margin-bottom:8px; }
        .table { width:100%; border-collapse:collapse; margin-top:12px; }
        .table th, .table td { padding:12px; border-bottom:1px solid #eee; text-align:left; }
        select, input { padding:8px 12px; border-radius:8px; border:1px solid #ccc; }
      `}</style>
    </div>
  );
}
