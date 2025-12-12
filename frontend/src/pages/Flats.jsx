import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { getAuth } from '../services/auth';
import { useNavigate } from 'react-router-dom';
import Nav from '../components/Nav';


export default function Flats() {
  const navigate = useNavigate();
  const [auth, setAuth] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true); // wait for auth

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

  // Load flats after auth is confirmed
  useEffect(() => {
    if (auth) {
      loadFlats();
    }
  }, [auth]);

  if (checkingAuth) return <div>Loading...</div>;

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
      <Nav />
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
                <input value={form.flat_number} onChange={e => setForm({ ...form, flat_number: e.target.value })} />
              </div>
              <div className="form-row">
                <label>Owner Name</label>
                <input value={form.owner_name} onChange={e => setForm({ ...form, owner_name: e.target.value })} />
              </div>
              <div className="form-row">
                <label>Phone</label>
                <input value={form.phone_number} onChange={e => setForm({ ...form, phone_number: e.target.value })} />
              </div>
              <div className="form-row">
                <label>Floor</label>
                <input type="number" value={form.floor} onChange={e => setForm({ ...form, floor: e.target.value })} />
              </div>
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
                <select value={form.ownership_type} onChange={e => setForm({ ...form, ownership_type: e.target.value })}>
                  <option>Owned</option>
                  <option>Rented</option>
                  <option>Vacant</option>
                </select>
              </div>
              <div className="form-row">
                <label>Maintenance Amount</label>
                <input value={form.maintenance_amount} onChange={e => setForm({ ...form, maintenance_amount: e.target.value })} />
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
      <style>{/* keep your existing styles */}</style>
    </div>
  );
}
