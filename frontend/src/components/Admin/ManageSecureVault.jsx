import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaTrash, FaEdit, FaShieldAlt, FaKey, FaSave, FaTimes, FaExternalLinkAlt, FaPlusCircle, FaCog, FaList, FaFolderOpen, FaLink, FaDatabase } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import './ManageSecureVault.css';

const ManageSecureVault = ({ token }) => {
  const navigate = useNavigate();
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreds, setShowCreds] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    google_drive_link: '',
    category: 'Other'
  });
  const [editingId, setEditingId] = useState(null);
  const [passwordForm, setPasswordForm] = useState({ username: 'vaultadmin', password: '' });
  const [updatingPassword, setUpdatingPassword] = useState(false);

  useEffect(() => {
    fetchLinks();
  }, [token]);

  const fetchLinks = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/secure-links`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch links');
      const data = await res.json();
      setLinks(data);
    } catch (err) {
      toast.error('Error fetching secure links');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editingId 
      ? `${import.meta.env.VITE_API_URL}/api/admin/secure-links/${editingId}`
      : `${import.meta.env.VITE_API_URL}/api/admin/secure-links`;
    
    const method = editingId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!res.ok) throw new Error('Failed to save link');
      
      toast.success(editingId ? 'Link updated' : 'Link added');
      setFormData({ title: '', description: '', google_drive_link: '', category: 'Other' });
      setEditingId(null);
      fetchLinks();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleEdit = (link) => {
    setEditingId(link.id);
    setFormData({
      title: link.title,
      description: link.description || '',
      google_drive_link: link.google_drive_link,
      category: link.category || 'Other'
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this secure link?')) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/secure-links/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Link deleted');
      fetchLinks();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (!passwordForm.password) return toast.error('Password cannot be empty');
    setUpdatingPassword(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/vault-credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(passwordForm)
      });

      if (!res.ok) throw new Error('Failed to update credentials');
      toast.success('Vault credentials updated');
      setPasswordForm({ ...passwordForm, password: '' });
      setShowCreds(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <div className="manage-secure-vault-new">
      <div className="vault-header">
        <div className="vault-title-group">
          <h2 className="gradient-text">Personal Vault</h2>
          <p>Your secure, private document and resource management center.</p>
        </div>
        <div className="d-flex gap-2">
          <button 
            onClick={() => navigate('/prem-dashboard-2026')} 
            className="btn btn-outline"
            style={{ borderRadius: '14px', padding: '12px 25px' }}
          >
            Back to Dashboard
          </button>
          <button 
            onClick={() => setShowCreds(!showCreds)} 
            className={`btn ${showCreds ? 'btn-danger' : 'btn-outline-primary'} d-flex align-items-center gap-2`}
            style={{ borderRadius: '14px', padding: '12px 25px' }}
          >
            {showCreds ? <FaTimes /> : <FaKey />}
            {showCreds ? 'Close Settings' : 'Vault Credentials'}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showCreds && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="vault-main-card mb-5"
            style={{ border: '1px solid rgba(220, 53, 69, 0.3)', background: 'rgba(220, 53, 69, 0.05)' }}
          >
            <div className="p-4">
              <h3 className="text-danger mb-4"><FaCog /> Access Management</h3>
              <form onSubmit={handlePasswordUpdate} className="row g-3">
                <div className="col-md-5">
                  <div className="vault-input-group">
                    <label>Username</label>
                    <input 
                      type="text" 
                      className="vault-field"
                      value={passwordForm.username} 
                      onChange={(e) => setPasswordForm({...passwordForm, username: e.target.value})} 
                      required
                    />
                  </div>
                </div>
                <div className="col-md-5">
                  <div className="vault-input-group">
                    <label>New Password</label>
                    <input 
                      type="password" 
                      className="vault-field"
                      value={passwordForm.password} 
                      onChange={(e) => setPasswordForm({...passwordForm, password: e.target.value})} 
                      required
                    />
                  </div>
                </div>
                <div className="col-md-2 d-flex align-items-end">
                  <button type="submit" className="vault-btn-primary w-100" disabled={updatingPassword} style={{ height: '50px', background: 'var(--danger-color)' }}>
                    {updatingPassword ? 'Updating...' : 'Update'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="vault-main-card">
        <div className="vault-content-grid">
          {/* Form Side */}
          <div className="vault-form-section">
            <h3 className="mb-4">
              {editingId ? <><FaEdit /> Modify Entry</> : <><FaPlusCircle /> New Resource</>}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="vault-input-group">
                <label>Title</label>
                <input 
                  type="text" 
                  name="title" 
                  className="vault-field"
                  value={formData.title} 
                  onChange={handleInputChange} 
                  placeholder="e.g. My Identity Doc" 
                  required 
                />
              </div>
              <div className="vault-input-group">
                <label>Category</label>
                <select className="vault-field" name="category" value={formData.category} onChange={handleInputChange}>
                  <option value="Other">Other</option>
                  <option value="College">College</option>
                  <option value="Personal">Personal</option>
                  <option value="Work">Work</option>
                  <option value="Resources">Resources</option>
                </select>
              </div>
              <div className="vault-input-group">
                <label>Resource URL</label>
                <input 
                  type="url" 
                  name="google_drive_link" 
                  className="vault-field"
                  value={formData.google_drive_link} 
                  onChange={handleInputChange} 
                  placeholder="https://drive.google.com/..." 
                  required 
                />
              </div>
              <div className="vault-input-group mb-5">
                <label>Internal Notes</label>
                <textarea 
                  name="description" 
                  className="vault-field"
                  value={formData.description} 
                  onChange={handleInputChange} 
                  rows="4"
                  placeholder="Private details..."
                />
              </div>
              <div className="d-flex gap-2">
                <button type="submit" className="vault-btn-primary">
                  {editingId ? 'Save Changes' : 'Encrypt & Save'}
                </button>
                {editingId && (
                  <button type="button" className="v-action-btn" onClick={() => {
                    setEditingId(null);
                    setFormData({ title: '', description: '', google_drive_link: '', category: 'Other' });
                  }} style={{ width: '60px', height: '50px' }}>
                    <FaTimes />
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* List Side */}
          <div className="vault-list-section">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 className="m-0"><FaDatabase /> Secure Database</h3>
              <span className="vault-badge">{links.length} Active Records</span>
            </div>

            {loading ? (
              <div className="text-center py-5"><div className="spinner"></div></div>
            ) : links.length === 0 ? (
              <div className="text-center py-5 opacity-30">
                <FaShieldAlt size={80} />
                <p className="mt-3 fs-5">Vault is empty</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="vault-table">
                  <thead>
                    <tr>
                      <th>Document</th>
                      <th>Class</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {links.map(link => (
                      <tr key={link.id} className="vault-row">
                        <td>
                          <div className="asset-info">
                            <h4>{link.title}</h4>
                            <p>{link.google_drive_link}</p>
                          </div>
                        </td>
                        <td><span className="vault-badge">{link.category}</span></td>
                        <td>
                          <div className="vault-actions">
                            <button className="v-action-btn" onClick={() => handleEdit(link)} title="Edit"><FaEdit /></button>
                            <a href={link.google_drive_link} target="_blank" rel="noreferrer" className="v-action-btn" title="Open Link"><FaExternalLinkAlt /></a>
                            <button className="v-action-btn delete" onClick={() => handleDelete(link.id)} title="Delete"><FaTrash /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageSecureVault;

