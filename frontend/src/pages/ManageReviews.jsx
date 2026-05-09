import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaTrash, FaStar, FaArrowLeft, FaSearch, FaInfoCircle, FaEye, FaEyeSlash, FaTimes } from 'react-icons/fa';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import './Admin.css';

const ManageReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const navigate = useNavigate();
  const token = localStorage.getItem('prem_portfolio_token');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [token]);

  const fetchData = async () => {
    try {
      const [revRes, projRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/api/admin/reviews`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${import.meta.env.VITE_API_URL}/api/projects`)
      ]);

      const revData = await revRes.json();
      const projData = await projRes.json();

      if (revRes.ok) setReviews(revData);
      if (projRes.ok) setProjects(projData);
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  const deleteReview = async (id) => {
    if (!window.confirm('Delete this review permanently?')) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/reviews/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast('Review deleted');
        fetchData();
      }
    } catch (err) { console.error(err); }
  };

  const toggleVisibility = async (id, currentHidden) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/reviews/${id}/toggle-visibility`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_hidden: !currentHidden })
      });
      if (res.ok) {
        showToast(`Review ${currentHidden ? 'visible' : 'hidden'}`);
        fetchData();
      }
    } catch (err) { console.error(err); }
  };

  const filteredReviews = reviews.filter(rev => {
    const search = searchTerm.toLowerCase();
    const projTitle = rev.projects?.title?.toLowerCase() || '';
    const projId = rev.projects?.id?.toString() || '';
    const reviewer = rev.name?.toLowerCase() || 'anonymous';
    return projTitle.includes(search) || projId.includes(search) || reviewer.includes(search);
  });

  return (
    <div className="portfolio-page">
      <SEO title="Manage Reviews | Admin" noindex={true} />
      <Navbar />
      
      {toast.show && (
        <div className={`custom-toast ${toast.type}`}>
          {toast.message}
        </div>
      )}

      <main className="main-content">
        <div className="admin-page section" style={{ paddingTop: '120px' }}>
          <div className="container">
            <div className="section-header-flex mb-4">
              <div>
                <button className="btn btn-outline btn-sm mb-3" onClick={() => navigate('/admin')}>
                  <FaArrowLeft /> Back to Dashboard
                </button>
                <h1 className="gradient-text">Reviews Moderation</h1>
                <p className="text-muted">Search and manage user project reviews.</p>
              </div>
              <div className="header-actions-row">
                <button className="btn btn-outline btn-sm" onClick={() => setShowInfoModal(true)}>
                  <FaInfoCircle /> Project Info
                </button>
              </div>
            </div>

            <div className="search-bar-container mb-4">
              <div className="search-input-wrapper glass-panel">
                <FaSearch className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Search by Project Name, ID, or Reviewer..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {loading ? (
              <div className="text-center py-5">
                <div className="spinner"></div>
                <p>Loading Reviews...</p>
              </div>
            ) : (
              <div className="table-responsive glass-panel">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Project</th>
                      <th>Reviewer</th>
                      <th>Rating</th>
                      <th>Message</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReviews.length > 0 ? filteredReviews.map(rev => (
                      <tr key={rev.id}>
                        <td data-label="Project">
                          <div style={{fontWeight: '600'}}>{rev.projects?.title}</div>
                          <div className="tiny-text" style={{opacity: 0.5}}>ID: {rev.projects?.id}</div>
                        </td>
                        <td data-label="Reviewer">
                          <div className="admin-reviewer-info">
                            <span>{rev.name || 'Anonymous'}</span>
                            <span className="tiny-text">{rev.email || 'No Email'}</span>
                          </div>
                        </td>
                        <td data-label="Rating">
                          <div className="admin-review-stars">
                            {[...Array(5)].map((_, i) => (
                              <FaStar key={i} style={{color: i < rev.rating ? '#ffc107' : 'rgba(255,255,255,0.1)', fontSize: '0.8rem'}} />
                            ))}
                          </div>
                        </td>
                        <td data-label="Message">
                          <p className="admin-review-msg">{rev.message || <em style={{opacity:0.5}}>No message</em>}</p>
                        </td>
                        <td className="actions-cell" data-label="Actions">
                          <button 
                            onClick={() => toggleVisibility(rev.id, rev.is_hidden)} 
                            className={`edit-btn ${rev.is_hidden ? 'text-muted' : 'text-success'}`}
                            title={rev.is_hidden ? 'Show Review' : 'Hide Review'}
                          >
                            {rev.is_hidden ? <FaEyeSlash /> : <FaEye />}
                          </button>
                          <button onClick={() => deleteReview(rev.id)} className="delete-btn"><FaTrash /></button>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="5" className="text-center py-4">No reviews found matching your search.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* PROJECT INFO MODAL */}
      {showInfoModal && (
        <div className="modal-overlay" onClick={() => setShowInfoModal(false)}>
          <div className="modal-content glass-panel" style={{maxWidth: '600px'}} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="gradient-text">Project Reference IDs</h3>
              <button className="close-btn" onClick={() => setShowInfoModal(false)}><FaTimes /></button>
            </div>
            <div className="modal-body">
              <p className="text-muted mb-3 small">Use these IDs to search for reviews belonging to specific projects.</p>
              <div className="table-responsive" style={{maxHeight: '400px', overflowY: 'auto'}}>
                <table className="admin-table mini-table">
                  <thead>
                    <tr><th>ID</th><th>Project Title</th></tr>
                  </thead>
                  <tbody>
                    {projects.map(p => (
                      <tr key={p.id}>
                        <td><code>{p.id}</code></td>
                        <td>{p.title}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default ManageReviews;
