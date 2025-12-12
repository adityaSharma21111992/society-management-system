import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function Flats() {
  const initialForm = {
    flat_number: '',
    owner_name: '',
    phone_number: '',
    floor: '',
    flat_type: '1BHK',
    ownership_type: 'Owned', // Owned | Rented | Vacant
    maintenance_amount: '',
    status: 'Active',
  };

  const [flats, setFlats] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadFlats();
  }, []);

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

  const handleEdit = (flat) => {
    setForm({
      flat_number: flat.flat_number,
      owner_name: flat.owner_name,
      phone_number: flat.phone_number,
      floor: flat.floor,
      flat_type: flat.flat_type,
      ownership_type: flat.ownership_type,
      maintenance_amount: flat.maintenance_amount,
      status: flat.status,
    });
    setEditingId(flat.flat_id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
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
      {/* Header */}
      <div className="header">
        <h2>Flats Management</h2>
        <button className="btn-add" onClick={openAddModal}>+ Add Flat</button>
      </div>

      {/* Flats Table */}
      <div className="card table-card">
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
                  <td>
                    <button className="btn btn-edit" onClick={() => handleEdit(flat)}>Edit</button>
                    <button className="btn btn-delete" onClick={() => handleDelete(flat.flat_id)}>Delete</button>
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
            <h3>{editingId ? 'Edit Flat' : 'Add New Flat'}</h3>
            <div className="modal-body">
              <div className="form-row">
                <label>Flat No</label>
                <input
                  value={form.flat_number}
                  onChange={e => setForm({ ...form, flat_number: e.target.value })}
                />
              </div>
              <div className="form-row">
                <label>Owner Name</label>
                <input
                  value={form.owner_name}
                  onChange={e => setForm({ ...form, owner_name: e.target.value })}
                />
              </div>
              <div className="form-row">
                <label>Phone</label>
                <input
                  value={form.phone_number}
                  onChange={e => setForm({ ...form, phone_number: e.target.value })}
                />
              </div>
              <div className="form-row">
                <label>Floor</label>
                <input
                  type="number"
                  value={form.floor}
                  onChange={e => setForm({ ...form, floor: e.target.value })}
                />
              </div>
              <div className="form-row">
                <label>Flat Type</label>
                <select
                  value={form.flat_type}
                  onChange={e => setForm({ ...form, flat_type: e.target.value })}
                >
                  <option>1BHK</option>
                  <option>2BHK</option>
                  <option>3BHK</option>
                </select>
              </div>

              {/* Ownership Type updated with Vacant */}
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
                <label>Maintenance Amount</label>
                <input
                  value={form.maintenance_amount}
                  onChange={e => setForm({ ...form, maintenance_amount: e.target.value })}
                />
              </div>
              <div className="form-row">
                <label>Status</label>
                <select
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value })}
                >
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn" onClick={handleSubmit}>{editingId ? 'Update' : 'Add'}</button>
              <button
                className="btn btn-secondary"
                onClick={() => { setIsModalOpen(false); setEditingId(null); setForm(initialForm); }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Styles */}
      <style>{`
        .flats-container {
          padding: 20px;
          font-family: 'Segoe UI', sans-serif;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .btn-add {
          background-color: #0a84ff;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
        }
        .btn-add:hover { background-color: #006fd6; }

        .card {
          background: #fff;
          border-radius: 10px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.05);
        }

        .table-responsive { overflow-x: auto; }

        table {
          width: 100%;
          border-collapse: collapse;
          min-width: 700px;
        }
        th, td {
          padding: 12px 10px;
          text-align: left;
        }
        th {
          background-color: #f5f5f5;
          font-weight: 600;
        }
        tr:nth-child(even) { background-color: #f9f9f9; }

        .btn { 
          padding: 6px 12px; 
          border-radius: 6px; 
          border: none; 
          cursor: pointer; 
        }
        .btn-edit { background-color: #0a84ff; color: white; margin-right: 5px; }
        .btn-edit:hover { background-color: #006fd6; }
        .btn-delete { background-color: #ff3b30; color: white; }
        .btn-delete:hover { background-color: #c1271f; }
        .btn-secondary { background-color: #ccc; color: #333; }

        /* Modal */
        .modal {
          position: fixed;
          top: 0; left: 0;
          width: 100%; height: 100%;
          background: rgba(0,0,0,0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 10px;
          z-index: 1000;
        }
        .modal-content {
          background: #fff;
          padding: 20px;
          width: 100%;
          max-width: 500px;
          border-radius: 10px;
          max-height: 90vh;
          overflow-y: auto;
        }
        .modal-body { display: flex; flex-direction: column; gap: 12px; }
        .form-row { display: flex; flex-direction: column; gap: 4px; }
        .modal-actions { margin-top: 15px; display: flex; justify-content: flex-end; gap: 10px; }

        @media (max-width: 600px) {
          table { font-size: 14px; }
          .btn-add { padding: 8px 12px; font-size: 14px; }
          .modal-content { padding: 15px; }
          .form-row input, .form-row select { font-size: 14px; padding: 6px; }
        }
      `}</style>
    </div>
  );
}
