import React, { useEffect, useState } from 'react';
import SEO from '../components/SEO';
import { useNavigate, Link } from 'react-router-dom';
import { FaTrash, FaEye, FaEnvelope, FaClock, FaUser, FaReply, FaArrowLeft, FaChevronLeft, FaChevronRight, FaTimes } from 'react-icons/fa';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './Admin.css';

const AllMessages = () => {
  const [messages, setMessages] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const limit = 50;

  const navigate = useNavigate();
  const token = localStorage.getItem('adminToken');

  useEffect(() => {
    if (!token) {
      navigate('/prem-login-2026');
      return;
    }
    fetchMessages();
  }, [currentPage, token, navigate]);

  useEffect(() => {
    if (selectedMessage) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [selectedMessage]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/messages?page=${currentPage}&limit=${limit}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('adminToken');
        navigate('/prem-login-2026');
        return;
      }
      const data = await res.json();
      setMessages(data.messages || []);
      setTotalCount(data.totalCount || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteMessage = async (id) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/messages/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchMessages();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const totalPages = Math.ceil(totalCount / limit);
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="portfolio-page">
      <SEO title="All Contact Messages | Admin" noindex={true} />
      <Navbar />
      <main className="main-content">
        <div className="admin-page dashboard-page">
          <div className="dashboard-header">
            <div>
              <h2 className="gradient-text">All Contact Submissions</h2>
              <p className="text-muted">Manage all messages from your portfolio.</p>
            </div>
            <div className="dashboard-actions">
              <Link to="/prem-dashboard-2026" className="btn btn-outline">
                <FaArrowLeft /> Back to Dashboard
              </Link>
            </div>
          </div>

          <div className="dashboard-content glass-panel">
            <div className="section-header">
              <p className="text-muted">Total {totalCount} messages</p>
            </div>

            {loading ? (
              <div className="text-center py-5">
                <p>Loading messages...</p>
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Preview</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {messages.map(msg => (
                        <tr key={msg.id} className="message-row">
                          <td>{new Date(msg.date).toLocaleDateString()}</td>
                          <td>{msg.name}</td>
                          <td><a href={`mailto:${msg.email}`} className="email-link">{msg.email}</a></td>
                          <td className="msg-cell">
                            {msg.message.split(' ').slice(0, 4).join(' ')}{msg.message.split(' ').length > 4 ? '...' : ''}
                          </td>
                          <td className="actions-cell">
                            <button onClick={() => setSelectedMessage(msg)} className="edit-btn" title="View Details"><FaEye /></button>
                            <button onClick={() => deleteMessage(msg.id)} className="delete-btn" title="Delete"><FaTrash /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="pagination">
                    <button 
                      className="page-btn" 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      <FaChevronLeft />
                    </button>
                    {pageNumbers.map(number => (
                      <button 
                        key={number} 
                        className={`page-btn ${currentPage === number ? 'active' : ''}`}
                        onClick={() => setCurrentPage(number)}
                      >
                        {number}
                      </button>
                    ))}
                    <button 
                      className="page-btn" 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      <FaChevronRight />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* MESSAGE DETAIL MODAL */}
          {selectedMessage && (
            <div className="modal-overlay" onClick={() => setSelectedMessage(null)}>
              <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>Message Details</h3>
                  <button className="close-btn" onClick={() => setSelectedMessage(null)}><FaTimes /></button>
                </div>
                <div className="modal-body">
                  <div className="detail-item">
                    <label><FaUser /> From:</label>
                    <p>{selectedMessage.name} ({selectedMessage.email})</p>
                  </div>
                  <div className="detail-item">
                    <label><FaClock /> Received On:</label>
                    <p>{new Date(selectedMessage.date).toLocaleString()}</p>
                  </div>
                  <div className="detail-item mt-3">
                    <label>Full Message:</label>
                    <div className="full-message-box">
                      {selectedMessage.message}
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <a 
                    href={`mailto:${selectedMessage.email}?subject=Reply from Prem Prasad Pradhan&body=Hello ${selectedMessage.name}, regarding your message: "${selectedMessage.message.substring(0, 50)}..."\\n\\n`}
                    className="btn btn-primary"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FaReply /> Reply via Gmail
                  </a>
                  <button className="btn btn-outline" onClick={() => setSelectedMessage(null)}>Close</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AllMessages;
