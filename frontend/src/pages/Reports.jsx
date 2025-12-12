import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { getAuth } from '../services/auth';
import { useNavigate } from 'react-router-dom';

export default function Reports() {
  const navigate = useNavigate();
  const [auth, setAuth] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true); // wait for auth
  const [data, setData] = useState([]);

  // Auth check on mount
  useEffect(() => {
    const user = getAuth();
    if (!user || !user.token) {
      navigate('/login'); // redirect if not logged in
    } else {
      setAuth(user);
    }
    setCheckingAuth(false);
  }, [navigate]);

  // Fetch reports after auth is confirmed
  useEffect(() => {
    if (!auth) return;

    // fetch last 6 months summary
    const today = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
    }

    Promise.all(
      months.map((m) =>
        api
          .get(`/reports/summary/${m.year}/${m.month}`)
          .then((r) => ({ ...r.data, label: `${m.month}-${m.year}` }))
          .catch(() => ({ total_income: 0, total_expense: 0, net: 0, label: `${m.month}-${m.year}` }))
      )
    ).then(setData);
  }, [auth]);

  if (checkingAuth) return <div>Loading...</div>;

  return (
    <div className="reports-container">
      <div className="header"><h2>Reports</h2></div>

      <div className="card" style={{ height: 320 }}>
        <h4>Income vs Expense (last 6 months)</h4>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data}>
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="total_income" name="Income" />
            <Bar dataKey="total_expense" name="Expense" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
