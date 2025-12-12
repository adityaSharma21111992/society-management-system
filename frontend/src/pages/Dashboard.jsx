import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import api from '../services/api';
import { backendUrl, currencySymbol } from '../config';
import { requireAuth } from '../services/auth';
import Nav from '../components/Nav';

export default function Dashboard() {
  const navigate = useNavigate();

  // ---------------- AUTH STATE ----------------
  const [auth, setAuth] = useState(undefined); // undefined = checking, null = not logged in

  useEffect(() => {
    const user = requireAuth(navigate);
    setAuth(user || null);
  }, [navigate]);

  // ---------------- DASHBOARD DATA ----------------
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!auth) return; // only fetch once user verified
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/dashboard/analytics');
        setDashboardData(res.data);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [auth]);

  // ---------------- HELPERS ----------------
  const isAdmin = auth?.id === 'admin' || auth?.role === 'admin';
  const BACKEND_URL = backendUrl || 'http://localhost:5000';
  const formatAmount = (amount) => Number(amount || 0).toFixed(2);

  // Last 3 months
  const getLastThreeMonths = () => {
    const months = [];
    const today = new Date();
    for (let i = 0; i < 3; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthName = d.toLocaleString('default', { month: 'long', year: 'numeric' });
      months.push({ key, monthName, year: d.getFullYear(), month: d.getMonth() + 1 });
    }
    return months;
  };

  const lastThreeMonths = getLastThreeMonths();

  const getPendingFlatsForMonth = (year, month) => {
    return (
      dashboardData?.pendingFlatsByMonth?.[`${year}-${String(month).padStart(2, '0')}`] || []
    );
  };

  // ---------------- REPORTS ----------------
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedYearly, setSelectedYearly] = useState(new Date().getFullYear());

  const downloadMonthly = () => {
    if (!selectedMonth || !selectedYear)
      return alert('Please select both month and year');
    window.open(
      `${backendUrl}/api/reports/monthly?month=${encodeURIComponent(selectedMonth)}&year=${encodeURIComponent(selectedYear)}`,
      '_blank'
    );
  };

  const downloadYearly = () => {
    if (!selectedYearly) return alert('Please select a year');
    window.open(
      `${BACKEND_URL}/api/reports/yearly?year=${encodeURIComponent(selectedYearly)}`,
      '_blank'
    );
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  // ---------------- CHANGE PASSWORD ----------------
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  const handleChangePassword = async () => {
    if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmNewPassword) {
      return alert('Please fill all password fields');
    }
    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      return alert('New password and confirm password do not match');
    }

    setIsSubmittingPassword(true);
    try {
      await api.post('/users/change-password', {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword
      });
      alert('Password changed successfully');
      setIsChangePasswordOpen(false);
      setPasswordForm({ oldPassword: '', newPassword: '', confirmNewPassword: '' });
    } catch (err) {
      console.error('Password change error:', err);
      alert(err.response?.data?.message || 'Failed to change password');
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  // ---------------- CONDITIONAL RENDER STATES ----------------
  if (auth === undefined) return <div>Checking login...</div>;
  if (auth === null) return null;
  if (loading) return <div className="loading">Loading dashboard...</div>;
  if (error) return <div className="error">{error}</div>;

  const { monthly, pendingFlatsByMonth, yearly } = dashboardData || {};

  // ---------------- MAIN RENDER ----------------
  return (
    <div className="dashboard-container">
      <Nav />

      <div className="dashboard-content">
        <h1>Dashboard</h1>
        <p>Welcome to Orion Pride Society Management System</p>

        {/* ✅ Admin-only button */}
        {isAdmin && (
          <div style={{ marginBottom: 20 }}>
            <button onClick={() => navigate('/users')} className="btn">
              👥 Manage Users
            </button>
          </div>
        )}

        {/* Yearly Summary */}
        <div className="summary-cards">
          <div className="card income-card">
            <h4>Total Income (Year)</h4>
            <p>
              {currencySymbol} {formatAmount(yearly?.total_income)}
            </p>
          </div>
          <div className="card expense-card">
            <h4>Total Expense (Year)</h4>
            <p>
              {currencySymbol} {formatAmount(yearly?.total_expense)}
            </p>
          </div>
          <div className="card net-card">
            <h4>Net Balance (Year)</h4>
            <p>
              {currencySymbol} {formatAmount(yearly?.net)}
            </p>
          </div>
        </div>

        {/* Monthly Chart */}
        <div className="card chart-card">
          <h3>Monthly Income vs Expense</h3>
          {monthly && monthly.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart
                data={monthly}
                margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month_name" />
                <YAxis />
                <Tooltip formatter={(value) => `${currencySymbol} ${formatAmount(value)}`} />
                <Legend />
                <Bar dataKey="total_income" fill="#0a84ff" name="Income" />
                <Bar dataKey="total_expense" fill="#ff3b30" name="Expense" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p>No monthly data found</p>
          )}
        </div>

        {/* Pending Flats */}
        <div className="card">
          <h3>Pending Flats (Last 3 Months)</h3>
          <div className="pending-flats-columns">
            {lastThreeMonths.map(({ key, monthName, year, month }) => {
              const flats = getPendingFlatsForMonth(year, month);
              return (
                <div key={key} className="pending-flats-column">
                  <h4>{monthName}</h4>
                  <div className="table-scroll">
                    {flats.length > 0 ? (
                      <table>
                        <thead>
                          <tr>
                            <th>Flat Number</th>
                            <th>Owner</th>
                            <th>Pending Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {flats.map((f) => (
                            <tr key={f.flat_id}>
                              <td>{f.flat_number}</td>
                              <td>{f.owner_name}</td>
                              <td>
                                {currencySymbol} {formatAmount(f.pending_amount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p>All paid</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card actions-card">
          <h3>Quick Actions</h3>
          <div className="actions-buttons">
            <button className="btn" onClick={() => navigate('/flats')}>Manage Flats</button>
            <button className="btn" onClick={() => navigate('/payments')}>Add Payment</button>
            <button className="btn" onClick={() => navigate('/expenses')}>Add Expense</button>
            <button className="btn btn-secondary" onClick={() => (window.location.href = '/UniqueReports')}>View Unique Reports</button>
            <button className="btn btn-secondary" onClick={() => setIsChangePasswordOpen(true)}>Change Password</button>
          </div>
        </div>

        {/* Reports Section */}
        <div className="card reports-card">
          <h3>Reports</h3>
          <div className="actions-buttons">
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option value={m} key={m}>
                  {new Date(0, m - 1).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
            <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
              {Array.from({ length: 5 }, (_, i) => 2025 - i).map((y) => (
                <option value={y} key={y}>{y}</option>
              ))}
            </select>
            <button className="btn" onClick={downloadMonthly}>Download Monthly PDF</button>

            <select value={selectedYearly} onChange={(e) => setSelectedYearly(e.target.value)}>
              {Array.from({ length: 5 }, (_, i) => 2025 - i).map((y) => (
                <option value={y} key={y}>{y}</option>
              ))}
            </select>
            <button className="btn" onClick={downloadYearly}>Download Yearly PDF</button>
          </div>
        </div>
      </div>

      {/* ---------------- CHANGE PASSWORD MODAL ---------------- */}
      {isChangePasswordOpen && (
        <div className="modal">
          <div className="modal-content">
            <h3>Change Password</h3>
            <div className="form-row">
              <label>Old Password</label>
              <input
                type="password"
                value={passwordForm.oldPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
              />
            </div>
            <div className="form-row">
              <label>New Password</label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              />
            </div>
            <div className="form-row">
              <label>Confirm New Password</label>
              <input
                type="password"
                value={passwordForm.confirmNewPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmNewPassword: e.target.value })}
              />
            </div>
            <div className="modal-actions">
              <button className="btn" onClick={handleChangePassword} disabled={isSubmittingPassword}>
                {isSubmittingPassword ? 'Saving...' : 'Save'}
              </button>
              <button className="btn btn-secondary" onClick={() => setIsChangePasswordOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- STYLES ---------------- */}
      <style>{`
        body { margin: 0; background: #f4f6f8; }
        .dashboard-container { font-family: 'Segoe UI', sans-serif; }
        .dashboard-content { padding: 20px; }
        .summary-cards { display: flex; gap: 20px; margin-bottom: 20px; flex-wrap: wrap; }
        .card { background: #fff; border-radius: 12px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); flex: 1; min-width: 180px; margin-bottom: 20px; }
        .income-card { border-left: 4px solid #0a84ff; }
        .expense-card { border-left: 4px solid #ff3b30; }
        .net-card { border-left: 4px solid #34c759; }
        .summary-cards .card h4 { margin: 0 0 10px 0; font-weight: 600; }
        .summary-cards .card p { font-size: 1.3em; font-weight: bold; }
        .chart-card { min-height: 350px; }
        .pending-flats-columns { display: flex; gap: 20px; flex-wrap: wrap; overflow-x: auto; }
        .pending-flats-column { flex: 1; min-width: 250px; background: #f9f9f9; border-radius: 8px; padding: 10px; }
        .table-scroll { max-height: 300px; overflow-y: auto; }
        .table-scroll table { width: 100%; border-collapse: collapse; }
        .table-scroll th, .table-scroll td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        .table-scroll th { background-color: #eaeaea; font-weight: 600; }
        .table-scroll tr:hover { background-color: #f1faff; }
        .actions-card, .reports-card { display: flex; flex-direction: column; gap: 10px; }
        .actions-buttons { display: flex; gap: 12px; flex-wrap: wrap; }
        .btn { padding: 10px 16px; background-color: #0a84ff; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; }
        .btn.logout { background-color: #ff3b30; }
        .btn.logout:hover { background-color: #c1271f; }
        .btn:hover { background-color: #006fd6; }
        .btn-secondary { background-color: #6c757d; }
        .btn-secondary:hover { background-color: #565e64; }
        .modal { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; }
        .modal-content { background: #fff; padding: 20px; border-radius: 8px; width: 400px; max-width: 90%; }
        .form-row { margin-bottom: 12px; display: flex; flex-direction: column; }
        .form-row label { margin-bottom: 6px; font-weight: 600; }
        .form-row input { padding: 8px; border-radius: 6px; border: 1px solid #ccc; }
        .modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 12px; }
        @media (max-width: 768px) {
          .summary-cards { flex-direction: column; }
          .actions-buttons { flex-direction: column; }
          .pending-flats-columns { flex-direction: column; }
        }
      `}</style>
    </div>
  );
}
