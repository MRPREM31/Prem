import React, { useState, useEffect, useCallback } from 'react';
import SEO from '../components/SEO';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUpload, FaSearch, FaLink, FaShareAlt, FaDownload, FaTrash, FaPlus, FaImage, FaCopy, FaCheck } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import '../components/MediaLibrary.css';

const MediaLibrary = () => {
  const [media, setMedia] = useState([]);
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [pendingUploads, setPendingUploads] = useState([]); // [{file, name, preview, status}]
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('adminToken');

  const fetchMedia = useCallback(async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/media?search=${search}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setMedia(data);
    } catch (err) {
      console.error('Error fetching media:', err);
    } finally {
      setLoading(false);
    }
  }, [search, token]);

  useEffect(() => {
    if (!token) {
      navigate('/prem-login-2026');
      return;
    }
    fetchMedia();
  }, [fetchMedia, navigate, token]);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const newUploads = files.map(file => ({
      file,
      name: file.name.split('.')[0], // Default name from filename
      preview: URL.createObjectURL(file),
      status: 'idle' // idle, uploading, success, error
    }));
    setPendingUploads([...pendingUploads, ...newUploads]);
    e.target.value = ''; // Reset input
  };

  const updatePendingName = (index, newName) => {
    const updated = [...pendingUploads];
    updated[index].name = newName;
    setPendingUploads(updated);
  };

  const removePending = (index) => {
    const updated = [...pendingUploads];
    URL.revokeObjectURL(updated[index].preview);
    updated.splice(index, 1);
    setPendingUploads(updated);
  };

  const uploadAll = async () => {
    setUploading(true);
    
    for (let i = 0; i < pendingUploads.length; i++) {
      if (pendingUploads[i].status === 'success') continue;

      const updated = [...pendingUploads];
      updated[i].status = 'uploading';
      setPendingUploads([...updated]);

      const formData = new FormData();
      formData.append('image', pendingUploads[i].file);
      formData.append('name', pendingUploads[i].name);

      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/media/upload`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
        
        if (res.ok) {
          updated[i].status = 'success';
        } else {
          updated[i].status = 'error';
        }
      } catch (err) {
        updated[i].status = 'error';
      }
      setPendingUploads([...updated]);
    }

    setUploading(false);
    fetchMedia();
    
    // Clear successful uploads after a delay
    setTimeout(() => {
      setPendingUploads(prev => prev.filter(u => u.status !== 'success'));
    }, 3000);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Permanently delete this image from CDN and storage?')) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/media/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchMedia();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const copyLink = (id, slug) => {
    const link = `${window.location.origin}/cdn/${slug}`;
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const downloadImage = (url, name) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Grouping logic
  const groupMedia = (items) => {
    const groups = {
      Today: [],
      Yesterday: [],
      'This Week': [],
      'Older Months': [],
      'Older Years': []
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    items.forEach(item => {
      const date = new Date(item.upload_date);
      if (date >= today) groups.Today.push(item);
      else if (date >= yesterday) groups.Yesterday.push(item);
      else if (date >= lastWeek) groups['This Week'].push(item);
      else if (date.getFullYear() === now.getFullYear()) groups['Older Months'].push(item);
      else groups['Older Years'].push(item);
    });

    return Object.entries(groups).filter(([_, val]) => val.length > 0);
  };

  return (
    <div className="media-library-page">
      <SEO title="Media Library | Admin" noindex={true} />
      <Navbar />
      
      <main className="media-container">
        <header className="media-header">
          <div>
            <h1 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Media Library</h1>
            <p className="text-muted">Manage your professional CDN and assets</p>
          </div>
          
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Search images by name..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </header>

        <section className="upload-zone">
          <div 
            className="upload-card glass-panel"
            onClick={() => document.getElementById('media-upload').click()}
          >
            <FaUpload style={{ fontSize: '3rem', color: 'var(--primary-color)' }} />
            <h3>Click to select multiple images</h3>
            <p className="text-muted">Upload professional assets to your private CDN</p>
            <input 
              type="file" 
              id="media-upload" 
              hidden 
              multiple
              accept="image/*"
              onChange={handleFileSelect}
            />
          </div>

          {pendingUploads.length > 0 && (
            <motion.div 
              className="pending-section glass-panel p-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h3>Pending Uploads ({pendingUploads.length})</h3>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button className="btn btn-outline" onClick={() => setPendingUploads([])}>Clear All</button>
                  <button 
                    className="btn btn-primary" 
                    onClick={uploadAll}
                    disabled={uploading}
                  >
                    {uploading ? 'Uploading...' : `Upload All to ImageKit`}
                  </button>
                </div>
              </div>

              <div className="pending-uploads-grid">
                {pendingUploads.map((item, idx) => (
                  <div key={idx} className="pending-item glass-panel">
                    <button className="remove-pending" onClick={() => removePending(idx)}><FaTrash size={12} /></button>
                    <img src={item.preview} alt="preview" className="pending-preview" />
                    <div className="pending-info">
                      <input 
                        type="text" 
                        value={item.name} 
                        onChange={(e) => updatePendingName(idx, e.target.value)}
                        className="form-input w-100"
                        placeholder="Image Name"
                        disabled={item.status === 'uploading' || item.status === 'success'}
                      />
                      {item.status === 'uploading' && (
                        <div className="upload-progress-bar">
                          <motion.div 
                            className="upload-progress-fill"
                            initial={{ width: 0 }}
                            animate={{ width: '100%' }}
                            transition={{ duration: 2 }}
                          />
                        </div>
                      )}
                      {item.status === 'success' && <span style={{ color: '#10b981', fontSize: '0.8rem' }}><FaCheck /> Ready</span>}
                      {item.status === 'error' && <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>Error uploading</span>}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </section>

        {loading ? (
          <div className="empty-media">
            <div className="spinner"></div>
            <p>Scanning library...</p>
          </div>
        ) : media.length === 0 ? (
          <div className="empty-media">
            <FaImage style={{ fontSize: '4rem', opacity: 0.3 }} />
            <h2>No assets found</h2>
            <p>Try searching for something else or upload a new image.</p>
          </div>
        ) : (
          groupMedia(media).map(([title, items]) => (
            <div key={title} className="date-section">
              <h2 className="date-title">{title}</h2>
              <div className="media-grid">
                <AnimatePresence>
                  {items.map((item) => (
                    <motion.div 
                      key={item.id}
                      className="media-card"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      layout
                    >
                      <img src={item.url} alt={item.name} className="media-img" loading="lazy" />
                      <div className="media-badge">{(item.size / 1024 / 1024).toFixed(2)} MB</div>
                      
                      <div className="media-overlay">
                        <h4 className="media-name">{item.name}</h4>
                        <div className="media-actions">
                          <button className="media-action-btn" onClick={() => copyLink(item.id, item.slug)} title="Copy CDN Link">
                            {copiedId === item.id ? <FaCheck style={{ color: '#10b981' }} /> : <FaCopy />}
                          </button>
                          <button className="media-action-btn" onClick={() => window.open(`${window.location.origin}/cdn/${item.slug}`, '_blank')} title="View Public Page">
                            <FaLink />
                          </button>
                          <button className="media-action-btn" onClick={() => downloadImage(item.url, item.name)} title="Download">
                            <FaDownload />
                          </button>
                          <button className="media-action-btn delete" onClick={() => handleDelete(item.id)} title="Delete Permanently">
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))
        )}
      </main>

      <Footer />
    </div>
  );
};

export default MediaLibrary;
