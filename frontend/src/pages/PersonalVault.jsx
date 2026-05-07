import React, { useEffect, useState } from 'react';
import SEO from '../components/SEO';
import { useNavigate } from 'react-router-dom';
import { FaTrash, FaEdit, FaPlus, FaLock, FaFileAlt, FaExternalLinkAlt, FaArrowLeft, FaSearch, FaFolder } from 'react-icons/fa';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './Admin.css';

const PersonalVault = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingFile, setEditingFile] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [fileForm, setFileForm] = useState({ title: '', file_url: '', category: 'Other' });
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const navigate = useNavigate();
  const token = localStorage.getItem('adminToken');
  const adminEmail = localStorage.getItem('adminEmail');

  // Security check: Only super admin
  useEffect(() => {
    if (!token || adminEmail !== 'mr.prem2006@gmail.com') {
      navigate('/prem-login-2026');
    } else {
      fetchFiles();
    }
  }, [token, adminEmail, navigate]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  const fetchFiles = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/vault-files`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFiles(data);
      } else {
        showToast('Failed to fetch vault data', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSubmit = async (e) => {
    e.preventDefault();
    const method = editingFile ? 'PUT' : 'POST';
    const url = editingFile 
      ? `${import.meta.env.VITE_API_URL}/api/admin/vault-files/${editingFile.id}`
      : `${import.meta.env.VITE_API_URL}/api/admin/vault-files`;

    try {
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(fileForm)
      });

      if (res.ok) {
        showToast(editingFile ? 'File updated successfully' : `File "${fileForm.title}" added securely`);
        setFileForm({ title: '', file_url: '', category: 'Other' });
        setEditingFile(null);
        setShowForm(false);
        fetchFiles();
      } else {
        showToast('Error saving file data', 'error');
      }
    } catch (err) {
      showToast('Network error', 'error');
    }
  };

  const deleteFile = async (id) => {
    if (!window.confirm('Are you sure you want to remove this file from your vault?')) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/vault-files/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast('File removed from vault');
        fetchFiles();
      } else {
        showToast('Failed to delete file', 'error');
      }
    } catch (err) {
      showToast('Network error', 'error');
    }
  };

  const openFile = (id) => {
    // Securely open via backend redirect
    const secureUrl = `${import.meta.env.VITE_API_URL}/api/admin/open-vault-file/${id}?token=${token}`;
    window.open(secureUrl, '_blank');
  };

  const filteredFiles = files.filter(f => 
    f.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    f.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = ['Other', 'Aadhar', 'PAN', 'Bank', 'Education', 'Legal', 'Medical'];
  const placeholderImg = "https://cdn-icons-png.flaticon.com/512/281/281760.png"; // Google Drive icon

  return (
    <div className="portfolio-page">
      <SEO title="Personal Vault | Private" noindex={true} />
      <Navbar />
      <main className="main-content">
        <div className="admin-page dashboard-page">
          {toast.show && (
            <div className={`custom-toast ${toast.type}`}>
              {toast.message}
            </div>
          )}

          <div className="dashboard-header">
            <div>
              <h2 className="gradient-text"><FaLock style={{fontSize: '0.8em', verticalAlign: 'middle', marginRight: '10px'}} /> Personal Vault</h2>
              <p className="text-muted">Secure storage for your private documents.</p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => navigate(-1)} className="btn btn-outline">
                <FaArrowLeft /> Back to Dashboard
              </button>
              <button onClick={() => { setShowForm(!showForm); setEditingFile(null); setFileForm({ title: '', file_url: '', category: 'Other' }); }} className="btn btn-primary">
                <FaPlus /> {showForm ? 'Cancel' : 'Add New File'}
              </button>
            </div>
          </div>

          {showForm && (
            <div className="dashboard-content glass-panel mb-4" style={{border: '1px solid var(--primary-color)'}}>
              <h3>{editingFile ? 'Edit File Details' : 'Add Secure File Link'}</h3>
              <form className="project-form" onSubmit={handleFileSubmit}>
                <div className="form-row">
                  <input 
                    type="text" 
                    placeholder="File Name (e.g. My Aadhar Card)" 
                    value={fileForm.title} 
                    onChange={e => setFileForm({...fileForm, title: e.target.value})} 
                    required 
                    className="form-input" 
                  />
                  <select 
                    value={fileForm.category} 
                    onChange={e => setFileForm({...fileForm, category: e.target.value})}
                    className="form-input"
                    style={{width: 'auto'}}
                  >
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <input 
                  type="url" 
                  placeholder="Google Drive Link (https://drive.google.com/...)" 
                  value={fileForm.file_url} 
                  onChange={e => setFileForm({...fileForm, file_url: e.target.value})} 
                  required 
                  className="form-input" 
                />
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">{editingFile ? 'Update File' : 'Securely Save File'}</button>
                  <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          <div className="dashboard-content glass-panel">
            <div className="section-header">
              <div className="search-bar-vault">
                <FaSearch className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Search files or categories..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="vault-search-input"
                />
              </div>
              <p className="text-muted">{filteredFiles.length} files found</p>
            </div>

            {loading ? (
              <div className="text-center py-5">
                <p>Loading your private vault...</p>
              </div>
            ) : (
              <div className="vault-grid">
                {filteredFiles.map(file => (
                  <div key={file.id} className="vault-card glass-panel" onClick={() => openFile(file.id)}>
                    <div className="vault-thumbnail">
                      <img src={placeholderImg} alt="File Thumbnail" />
                      <div className="vault-category-tag">{file.category}</div>
                      <div className="vault-card-overlay">
                        <FaExternalLinkAlt /> Open Securely
                      </div>
                    </div>
                    <div className="vault-card-info">
                      <h4>{file.title}</h4>
                      <p className="text-muted small">Added {new Date(file.created_at).toLocaleDateString()}</p>
                      <div className="vault-card-actions" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => { setEditingFile(file); setFileForm(file); setShowForm(true); }} className="edit-btn-small" title="Edit"><FaEdit /></button>
                        <button onClick={() => deleteFile(file.id)} className="delete-btn-small" title="Delete"><FaTrash /></button>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredFiles.length === 0 && !loading && (
                  <div className="no-files-vault">
                    <FaFolder style={{fontSize: '3rem', opacity: 0.2, marginBottom: '1rem'}} />
                    <p>No private files found in this category.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
      
      <style>{`
        .vault-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }
        .vault-card {
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
          padding: 0 !important;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .vault-card:hover {
          transform: translateY(-5px);
          border-color: var(--primary-color);
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }
        .vault-thumbnail {
          height: 150px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.05);
          position: relative;
        }
        .vault-thumbnail img {
          width: 60px;
          opacity: 0.8;
          transition: transform 0.3s ease;
        }
        .vault-card:hover .vault-thumbnail img {
          transform: scale(1.1);
        }
        .vault-category-tag {
          position: absolute;
          top: 10px;
          right: 10px;
          background: var(--primary-color);
          color: white;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 0.7rem;
          font-weight: 600;
        }
        .vault-card-overlay {
          position: absolute;
          inset: 0;
          background: rgba(99, 102, 241, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          opacity: 0;
          transition: opacity 0.3s ease;
          font-weight: 600;
          color: white;
        }
        .vault-card:hover .vault-card-overlay {
          opacity: 1;
        }
        .vault-card-info {
          padding: 15px;
          position: relative;
        }
        .vault-card-info h4 {
          margin: 0 0 5px 0;
          font-size: 1rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .vault-card-actions {
          display: flex;
          gap: 10px;
          margin-top: 10px;
          opacity: 0.5;
          transition: opacity 0.3s ease;
        }
        .vault-card:hover .vault-card-actions {
          opacity: 1;
        }
        .edit-btn-small, .delete-btn-small {
          background: none;
          border: none;
          cursor: pointer;
          padding: 5px;
          font-size: 0.9rem;
          transition: transform 0.2s;
        }
        .edit-btn-small { color: var(--primary-color); }
        .delete-btn-small { color: #ff4d4d; }
        .edit-btn-small:hover, .delete-btn-small:hover { transform: scale(1.2); }
        
        .search-bar-vault {
          position: relative;
          width: 100%;
          max-width: 400px;
        }
        .vault-search-input {
          width: 100%;
          padding: 10px 15px 10px 40px;
          border-radius: 8px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: white;
        }
        .search-icon {
          position: absolute;
          left: 15px;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(255,255,255,0.4);
        }
        .no-files-vault {
          grid-column: 1 / -1;
          padding: 50px;
          text-align: center;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
};

export default PersonalVault;
