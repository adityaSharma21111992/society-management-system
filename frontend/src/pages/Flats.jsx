import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { getAuth } from '../services/auth';
import { useNavigate } from 'react-router-dom';
import Nav from '../components/Nav';

export default function Flats() {
  const navigate = useNavigate();
  const [auth, setAuth] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const initialForm = {
    flat_number: '',
    owner_name: '',
    phone_number: '',
    floor: '',
    flat_type: '1BHK',
    ownership_type: 'Owned',
    maintenance_amount: '',
    status: 'Active',
  };

  const [flats, setFlats] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Auth check
  useEffect(() => {
    const user = getAuth();
    if (!user || !user.token) {
      navigate('/login');
    } else {
      setAuth(user);
    }
    setCheckingAuth(false);
  }, [navigate]);

  // Load flats after auth
  useEffect(() => {
    if (auth) loadFlats();
  }, [auth]);

  if (checkingAuth) return <div className="loading">Loading...</div>;

  const loadFlats = () => {
    api
      .get('/flats')
      .then(res => setFlats(res.data))
      .catch(err => console.error(err));
  };

  const openAddModal = () => {
    setForm(initialForm);
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (editingId) {
        await api.put(`/flats/${editingId}`, form);
      } else {
        await api.post('/flats', form);
      }
      setForm(initialForm);
      setEditingId(null);
      setIsModalOpen(false);
      loadFlats();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = flat => {
    setForm({ ...flat });
    setEditingId(flat.flat_id);
    setIsModalOpen(true);
  };

  const handleDelete = async id => {
    if (window.confirm('Are you sure you want to delete this flat?')) {
      try {
        await api.delete(`/flats/${id}`);
        loadFlats();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="flats-container">
      <Nav />

      <header className="flats-header">
        <h2>Flats Management</h2>
        <button className="btn-add" onClick={openAddModal}>
          + Add Flat
        </button>
      </header>

      <div className="flats-table-card">
        <h3>All Flats</h3>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Flat</th>
                <th>Owner</th>
                <th>Phone</th>
                <th>Floor</th>
                <th>Type</th>
                <th>Ownership</th>
                <th>Status</th>
                <th>Maintenance</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {flats.map(flat => (
                <tr key={flat.flat_id}>
                  <td>{flat.flat_number}</td>
                  <td>{flat.owner_name || '-'}</td>
                  <td>{flat.phone_number || '-'}</td>
                  <td>{flat.floor}</td>
                  <td>{flat.flat_type}</td>
                  <td>{flat.ownership_type}</td>
                  <td>{flat.status}</td>
                  <td>{flat.maintenance_amount}</td>
                  <td className="actions">
                    <button className="btn-edit" onClick={() => handleEdit(flat)}>
                      Edit
                    </button>
                    <button className="btn-delete" onClick={() => handleDelete(flat.flat_id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{editingId ? 'Edit Flat' : 'Add New Flat'}</h3>
            <div className="modal-body">
              {[
                { label: 'Flat No', name: 'flat_number' },
                { label: 'Owner Name', name: 'owner_name' },
                { label: 'Phone', name: 'phone_number' },
                { label: 'Floor', name: 'floor', type: 'number' },
                { label: 'Maintenance Amount', name: 'maintenance_amount' },
              ].map(field => (
                <div className="form-row" key={field.name}>
                  <label>{field.label}</label>
                  <input
                    type={field.type || 'text'}
                    value={form[field.name]}
                    onChange={e => setForm({ ...form, [field.name]: e.target.value })}
                  />
                </div>
              ))}

              <div className="form-row">
                <label>Flat Type</label>
                <select value={form.flat_type} onChange={e => setForm({ ...form, flat_type: e.target.value })}>
                  <option>1BHK</option>
                  <option>2BHK</option>
                  <option>3BHK</option>
                </select>
              </div>

              <div className="form-row">
                <label>Ownership</label>
                <select
                  value={form.ownership_type}
                  onChange={e => setForm({ ...form, ownership_type: e.target.value })}
                >
                  <option>Owned</option>
                  <option>Rented</option>
                  <option>Vacant</option>
                </select>
              </div>

              <div className="form-row">
                <label>Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn" onClick={handleSubmit}>
                {editingId ? 'Update' : 'Add'}
              </button>
              <button
                className="btn-secondary"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingId(null);
                  setForm(initialForm);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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

        .flats-container {
          padding: 20px;
          padding-top: 80px; /* leave space for fixed navbar */
          font-family: 'Segoe UI', sans-serif;
          background: #f4f6f8;
          min-height: 100vh;
        }

        .flats-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .btn-add {
          padding: 10px 18px;
          background: #4f46e5;
          color: #fff;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: bold;
          transition: 0.2s;
        }

        .btn-add:hover { background: #4338ca; }

        .flats-table-card {
          background: #fff;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        }

        .table { width: 100%; border-collapse: collapse; }

        .table th, .table td { padding: 12px 8px; text-align: left; }
        .table th { background: #f3f4f6; font-weight: 600; }
        .table tr:nth-child(even) { background: #f9fafb; }

        .actions button {
          margin-right: 6px;
          padding: 6px 12px;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          font-size: 0.85rem;
        }

        .btn-edit { background: #10b981; color: white; }
        .btn-edit:hover { background: #059669; }

        .btn-delete { background: #ef4444; color: white; }
        .btn-delete:hover { background: #dc2626; }

        .modal-overlay {
          position: fixed;
          top: 0; left: 0;
          width: 100%; height: 100%;
          background: rgba(0,0,0,0.4);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1100; /* above navbar */
        }

        .modal {
          background: #fff;
          padding: 25px;
          border-radius: 12px;
          width: 100%;
          max-width: 500px;
          box-shadow: 0 6px 20px rgba(0,0,0,0.2);
          animation: fadeIn 0.2s ease-in-out;
        }

        .modal h3 { margin-bottom: 15px; font-size: 1.25rem; }

        .form-row { margin-bottom: 12px; display: flex; flex-direction: column; }
        .form-row label { margin-bottom: 4px; font-weight: 500; }
        .form-row input, .form-row select {
          padding: 8px 10px;
          border-radius: 8px;
          border: 1px solid #d1d5db;
          font-size: 0.95rem;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 20px;
        }

        .modal-actions .btn {
          background: #4f46e5;
          color: white;
          padding: 8px 16px;
          border-radius: 8px;
          border: none;
          margin-right: 10px;
          cursor: pointer;
        }

        .modal-actions .btn:hover { background: #4338ca; }

        .modal-actions .btn-secondary {
          background: #e5e7eb;
          color: #111827;
        }

        .modal-actions .btn-secondary:hover { background: #d1d5db; }

        .loading { text-align: center; margin-top: 50px; font-size: 1.2rem; color: #374151; }

        @keyframes fadeIn {
          from {opacity: 0; transform: translateY(-10px);}
          to {opacity: 1; transform: translateY(0);}
        }
      `}</style>
    </div>
  );
}
