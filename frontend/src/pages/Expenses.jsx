import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { getAuth } from '../services/auth';
import Nav from '../components/Nav';


export default function Expenses() {
  const navigate = useNavigate();
  const [auth, setAuth] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true); // to wait for auth check

  const initialForm = {
    title: '',
    description: '',
    amount: '',
    date: '',
    paid_by: '',
  };

  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [monthlyExpense, setMonthlyExpense] = useState(0);
  const [monthYear, setMonthYear] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });

  // Check authentication on mount
  useEffect(() => {
    const user = getAuth();
    if (!user || !user.token) {
      navigate('/login'); // redirect if not logged in
    } else {
      setAuth(user);
    }
    setCheckingAuth(false);
  }, [navigate]);

  // Load expenses after auth is confirmed
  useEffect(() => {
    if (auth) {
      refreshData();
    }
  }, [auth]);

  if (checkingAuth) return <div>Loading...</div>; // show while checking auth

  const currentUserId = Number(auth?.id);
  const currentUserRole = auth?.role;
  const currentUserEmail = auth?.email;

  const refreshData = async () => {
    await loadExpenses();
    await fetchMonthlyExpense(monthYear.year, monthYear.month);
  };

  const loadExpenses = async () => {
    try {
      const res = await api.get('/expenses');
      const normalized = res.data.map((exp) => ({
        ...exp,
        created_by_name: exp.created_by_name || '-',
        updated_by_name: exp.updated_by_name || '-',
        date: exp.date ? new Date(exp.date).toISOString().split('T')[0] : '-',
        created_at: exp.created_at
          ? new Date(exp.created_at).toISOString().replace('T', ' ').split('.')[0]
          : '-',
        updated_at: exp.updated_at
          ? new Date(exp.updated_at).toISOString().replace('T', ' ').split('.')[0]
          : '-',
      }));
      setExpenses(normalized);
    } catch (err) {
      console.error('Failed to load expenses:', err);
    }
  };

  const fetchMonthlyExpense = async (year, month) => {
    try {
      const res = await api.get(`/expenses/monthly/${year}/${month}`);
      setMonthlyExpense(Number(res.data?.total_expense || 0));
    } catch (err) {
      console.error('Failed to fetch monthly expense:', err);
      setMonthlyExpense(0);
    }
  };

  const openAddModal = () => {
    setForm(initialForm);
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleEdit = (expense) => {
    setForm({
      title: expense.title,
      description: expense.description,
      amount: expense.amount,
      date: expense.date,
      paid_by: expense.paid_by,
      created_by_name: expense.created_by_name,
      created_at: expense.created_at,
      updated_by_name: expense.updated_by_name,
      updated_at: expense.updated_at,
    });
    setEditingId(expense.expense_id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;

    try {
      await api.delete(`/expenses/${id}`);
      await refreshData();
    } catch (err) {
      console.error(err);
      alert('Failed to delete expense');
    }
  };

  const handleSubmit = async () => {
    if (!form.title || !form.amount || !form.date) {
      alert('Please fill all required fields (Title, Amount, Date)');
      return;
    }

    const payload = {
      ...form,
      amount: parseFloat(form.amount),
      user_id: currentUserId,
    };

    try {
      if (editingId) {
        await api.put(`/expenses/${editingId}`, payload);
      } else {
        await api.post('/expenses', payload);
      }

      setForm(initialForm);
      setEditingId(null);
      setIsModalOpen(false);
      await refreshData();
    } catch (err) {
      console.error('Failed to save expense:', err);
      alert('Failed to save expense');
    }
  };

  const handleMonthYearChange = (e) => {
    const { name, value } = e.target;
    setMonthYear((prev) => ({ ...prev, [name]: value }));
  };

  const handleFilterMonthly = async () => {
    await fetchMonthlyExpense(monthYear.year, monthYear.month);
  };

  return (
    <div className="expenses-container">
      <Nav />
      {/* Header */}
      <div className="header">
        <h2>Expenses Management</h2>
        <div>
          Logged in as <b>{currentUserRole || 'User'}</b> ({currentUserEmail || 'unknown'})
        </div>
        <button className="btn-add" onClick={openAddModal}>+ Add Expense</button>
      </div>

      {/* Monthly Filter */}
      <div className="card filter-card">
        <label>Month:</label>
        <input type="number" min="1" max="12" name="month" value={monthYear.month} onChange={handleMonthYearChange} />
        <label>Year:</label>
        <input type="number" name="year" value={monthYear.year} onChange={handleMonthYearChange} />
        <button className="btn" onClick={handleFilterMonthly}>Show</button>
        <span className="monthly-total">Total Expense: ₹ {monthlyExpense.toFixed(2)}</span>
      </div>

      {/* Expenses Table */}
      <div className="card table-card">
        <h3>All Expenses</h3>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Paid By</th>
                <th>Created By</th>
                <th>Created At</th>
                <th>Updated By</th>
                <th>Updated At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((exp) => (
                <tr key={exp.expense_id}>
                  <td>{exp.title}</td>
                  <td>{exp.description}</td>
                  <td>₹ {Number(exp.amount).toFixed(2)}</td>
                  <td>{exp.date}</td>
                  <td>{exp.paid_by}</td>
                  <td>{exp.created_by_name}</td>
                  <td>{exp.created_at}</td>
                  <td>{exp.updated_by_name}</td>
                  <td>{exp.updated_at}</td>
                  <td>
                    <button className="btn btn-edit" onClick={() => handleEdit(exp)}>Edit</button>
                    <button className="btn btn-delete" onClick={() => handleDelete(exp.expense_id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h3>{editingId ? 'Edit Expense' : 'Add New Expense'}</h3>
            <div className="modal-body">
              <div className="form-row">
                <label>Title*</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="form-row">
                <label>Description</label>
                <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="form-row">
                <label>Amount*</label>
                <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div className="form-row">
                <label>Date*</label>
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className="form-row">
                <label>Paid By</label>
                <input value={form.paid_by} onChange={(e) => setForm({ ...form, paid_by: e.target.value })} />
              </div>

              {editingId && (
                <>
                  <div className="form-row">
                    <label>Created By / At</label>
                    <span>{form.created_by_name} / {form.created_at}</span>
                  </div>
                  <div className="form-row">
                    <label>Updated By / At</label>
                    <span>{form.updated_by_name} / {form.updated_at}</span>
                  </div>
                </>
              )}
            </div>

            <div className="modal-actions">
              <button className="btn" onClick={handleSubmit}>{editingId ? 'Update' : 'Add'}</button>
              <button className="btn btn-secondary" onClick={() => { setIsModalOpen(false); setForm(initialForm); setEditingId(null); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Styles */}
      <style>{/* keep your existing styles */}</style>
    </div>
  );
}
