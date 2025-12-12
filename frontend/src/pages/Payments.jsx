import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { getAuth } from "../services/auth";
import Nav from '../components/Nav';

export default function Payments() {
  const navigate = useNavigate();

  // ------------------- AUTH -------------------
  const auth = getAuth();
  const token = auth?.token;
  const currentUserId = Number(auth?.id);
  const currentUserRole = auth?.role;
  const currentUserEmail = auth?.email;

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
    }
  }, [token, navigate]);

  // ------------------- STATE -------------------
  const initialForm = {
    payment_id: null,
    flat_id: "",
    amount: "",
    mode: "Cash",
    month: "",
    year: "",
    paid_date: "",
    remark: "",
  };

  const [form, setForm] = useState(initialForm);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [payments, setPayments] = useState([]);
  const [flats, setFlats] = useState([]);
  const [canDeletePayment, setCanDeletePayment] = useState(false);
  const [search, setSearch] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, total: 0, limit: 10 });

  // ------------------- DATA LOAD -------------------
  useEffect(() => { if (token) loadPayments(); }, [search, month, year, page, token]);
  useEffect(() => { if (token) { loadFlats(); loadConfig(); } }, [token]);

  const loadPayments = async () => {
    try {
      const res = await api.get("/payments", {
        params: { search, month, year, page, limit: 10 },
      });
      setPayments(res.data.data || []);
      setPagination(res.data.pagination || { totalPages: 1, total: 0, limit: 10 });
    } catch (err) {
      console.error(err);
      setPayments([]);
      setPagination({ totalPages: 1, total: 0, limit: 10 });
    }
  };

  const loadFlats = async () => {
    try {
      const res = await api.get("/flats");
      setFlats(res.data || []);
    } catch (err) {
      console.error(err);
      setFlats([]);
    }
  };

  const loadConfig = async () => {
    try {
      const res = await api.get("/payments/config/delete-payment");
      setCanDeletePayment(res.data.isDeletePayment === 1);
    } catch (err) {
      console.error(err);
    }
  };

  // ------------------- HANDLERS -------------------
  const handleFlatChange = (flatId) => {
    const selectedFlat = flats.find(f => f.flat_id === parseInt(flatId));
    setForm({ ...form, flat_id: flatId, amount: selectedFlat ? selectedFlat.maintenance_amount : "" });
  };

  const openEditModal = (payment) => {
    setForm({
      payment_id: payment.payment_id,
      flat_id: payment.flat_id || "",
      amount: payment.amount_paid || "",
      mode: payment.payment_mode || "Cash",
      month: payment.month || "",
      year: payment.year || "",
      paid_date: payment.payment_date ? payment.payment_date.slice(0, 10) : "",
      remark: payment.remarks || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.flat_id || !form.amount || !form.month || !form.year || !form.paid_date) {
      alert("Please fill all required fields (Flat, Amount, Month, Year, Payment Date)");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        flat_id: parseInt(form.flat_id),
        amount: parseFloat(form.amount),
        mode: form.mode,
        month: parseInt(form.month),
        year: parseInt(form.year),
        paid_date: form.paid_date,
        remark: form.remark,
        user_id: currentUserId,
      };
      if (form.payment_id) await api.put(`/payments/${form.payment_id}`, payload);
      else await api.post("/payments", payload);
      setForm(initialForm);
      setIsModalOpen(false);
      setPage(1);
      loadPayments();
    } catch (err) {
      console.error(err);
      alert("Failed to save payment");
    } finally { setIsSubmitting(false); }
  };

  const deletePayment = async (payment_id) => {
    if (!window.confirm("Are you sure you want to delete this payment?")) return;
    try {
      await api.delete(`/payments/${payment_id}`);
      const isLastOnPage = payments.length === 1 && page > 1;
      if (isLastOnPage) setPage(page - 1);
      else loadPayments();
    } catch (err) {
      console.error(err);
      alert("Failed to delete payment");
    }
  };

  const downloadInvoice = async (payment_id) => {
    try {
      const res = await api.post("/payments/invoice", { payment_id }, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `invoice_${payment_id}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Failed to download invoice");
    }
  };

  // ------------------- PAGINATION -------------------
  const goPrev = () => { if (page > 1) setPage(page - 1); };
  const goNext = () => { if (page < pagination.totalPages) setPage(page + 1); };
  useEffect(() => { setPage(1); }, [search, month, year]);

  // ------------------- RENDER -------------------
  return (
    <div className="payments-container">
      <Nav />

      <header className="payments-header">
        <h2>Payments</h2>
        <button className="btn btn-add" onClick={() => { setForm(initialForm); setIsModalOpen(true); }}>
          + Add Payment
        </button>
      </header>

      <div style={{ marginBottom: "10px", color: "#666" }}>
        Logged in as <b>{currentUserRole || "User"}</b> ({currentUserEmail || "unknown"})
      </div>

      {/* Filters */}
      <div className="filters">
        <input type="text" placeholder="Search flat number or owner..." value={search} onChange={e => setSearch(e.target.value)} />
        <select value={month} onChange={e => setMonth(e.target.value)}>
          <option value="">All Months</option>
          {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
        </select>
        <select value={year} onChange={e => setYear(e.target.value)}>
          <option value="">All Years</option>
          {[2023,2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Payments Table */}
      <div className="card table-card">
        <table className="table">
          <thead>
            <tr>
              <th>Flat</th>
              <th>Owner</th>
              <th>Contact</th>
              <th>Amount</th>
              <th>Mode</th>
              <th>Month</th>
              <th>Year</th>
              <th>Payment Date</th>
              <th>Remark</th>
              <th>Created By</th>
              <th>Created At</th>
              <th>Updated By</th>
              <th>Updated At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr><td colSpan="14" style={{ textAlign: "center" }}>No payments found</td></tr>
            ) : (
              payments.map(p => (
                <tr key={p.payment_id}>
                  <td>{p.flat_number || "-"}</td>
                  <td>{p.owner_name || "-"}</td>
                  <td>{p.phone_number || "-"}</td>
                  <td>₹ {p.amount_paid}</td>
                  <td>{p.payment_mode}</td>
                  <td>{p.month}</td>
                  <td>{p.year}</td>
                  <td>{p.payment_date ? new Date(p.payment_date).toLocaleDateString() : "-"}</td>
                  <td>{p.remarks || "-"}</td>
                  <td>{p.created_by_name || "-"}</td>
                  <td>{p.created_at ? new Date(p.created_at).toLocaleString() : "-"}</td>
                  <td>{p.updated_by_name || "-"}</td>
                  <td>{p.updated_at ? new Date(p.updated_at).toLocaleString() : "-"}</td>
                  <td>
                    <button className="btn btn-edit" onClick={() => openEditModal(p)}>Edit</button>
                    <button className="btn btn-download" onClick={() => downloadInvoice(p.payment_id)}>Download</button>
                    {canDeletePayment && <button className="btn btn-delete" onClick={() => deletePayment(p.payment_id)}>Delete</button>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="pagination">
        <button onClick={goPrev} disabled={page <= 1}>Prev</button>
        <span>Page {pagination.currentPage || page} of {pagination.totalPages || 1}</span>
        <button onClick={goNext} disabled={page >= (pagination.totalPages || 1)}>Next</button>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{form.payment_id ? "Edit Payment" : "Add Payment"}</h3>

            <div className="form-row">
              <label>Flat*</label>
              <select value={form.flat_id} onChange={e => handleFlatChange(e.target.value)}>
                <option value="">-- Select Flat --</option>
                {flats.map(f => <option key={f.flat_id} value={f.flat_id}>{f.flat_number} ({f.owner_name})</option>)}
              </select>
            </div>

            <div className="form-row">
              <label>Amount*</label>
              <input type="number" value={form.amount} readOnly />
            </div>

            <div className="form-row">
              <label>Payment Mode</label>
              <select value={form.mode} onChange={e => setForm({...form, mode: e.target.value})}>
                <option>Cash</option>
                <option>Online</option>
                <option>Cheque</option>
              </select>
            </div>

            <div className="form-row">
              <label>Month*</label>
              <input type="number" min="1" max="12" value={form.month} onChange={e => setForm({...form, month: e.target.value})}/>
            </div>

            <div className="form-row">
              <label>Year*</label>
              <input type="number" min="2000" max="2100" value={form.year} onChange={e => setForm({...form, year: e.target.value})}/>
            </div>

            <div className="form-row">
              <label>Payment Date*</label>
              <input type="date" value={form.paid_date} onChange={e => setForm({...form, paid_date: e.target.value})}/>
            </div>

            <div className="form-row">
              <label>Remark</label>
              <textarea value={form.remark} onChange={e => setForm({...form, remark: e.target.value})}/>
            </div>

            <div className="modal-actions">
              <button className="btn" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : form.payment_id ? "Update Payment" : "Add Payment"}
              </button>
              <button className="btn btn-secondary" onClick={() => { setIsModalOpen(false); setForm(initialForm); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Styles */}
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

        .payments-container {
          padding: 20px;
          padding-top: 80px; /* offset for fixed navbar */
          font-family: 'Segoe UI', sans-serif;
          background: #f4f6f8;
          min-height: 100vh;
        }

        .payments-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }
        .btn { padding:8px 12px; border:none; border-radius:6px; cursor:pointer; margin-right:6px; }
        .btn-add { background:#007bff; color:#fff; }
        .btn-edit { background:#0a84ff; color:#fff; }
        .btn-download { background:#34c759; color:#fff; }
        .btn-delete { background:#ff3b30; color:#fff; }

        .filters { display:flex; gap:10px; margin-bottom:12px; }
        .filters input, .filters select { padding:8px; border-radius:6px; border:1px solid #ccc; }

        .card.table-card { background:#fff; padding:16px; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.05); margin-bottom:12px; overflow:auto; }
        .table { width:100%; border-collapse:collapse; min-width:1100px; }
        .table th, .table td { padding:10px; border-bottom:1px solid #eee; text-align:left; }

        .pagination { display:flex; gap:10px; align-items:center; justify-content:center; margin-top:10px; }
        .pagination button { padding:6px 10px; border-radius:6px; border:none; background:#007bff; color:#fff; cursor:pointer; }
        .pagination button:disabled { background:#ccc; cursor:not-allowed; }

        /* Modal */
        .modal-overlay { position:fixed; inset:0; display:flex; justify-content:center; align-items:center; background:rgba(0,0,0,0.5); padding:20px; z-index:1100; }
        .modal { background:#fff; padding:18px; border-radius:8px; width:420px; max-width:100%; }
        .form-row { margin-bottom:10px; display:flex; flex-direction:column; }
        .form-row label { margin-bottom:6px; font-weight:600; }
        .form-row input, .form-row select, .form-row textarea { padding:8px; border-radius:6px; border:1px solid #ccc; width:100%; box-sizing:border-box; }
        .modal-actions { display:flex; justify-content:flex-end; gap:8px; margin-top:8px; }

        @media (max-width:700px) {
          .table { min-width:100%; font-size:14px; }
          .modal { width:100%; }
        }
      `}</style>
    </div>
  );
}
