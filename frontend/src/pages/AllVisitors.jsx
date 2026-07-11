import React, { useEffect, useState } from 'react';
import SEO from '../components/SEO';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaChevronLeft, FaChevronRight, FaClock, FaGlobe, FaLaptop } from 'react-icons/fa';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './Admin.css';

const AllVisitors = () => {
  const [visitors, setVisitors] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const limit = 20; // User requested 20 items per page

  const navigate = useNavigate();
  const token = localStorage.getItem('adminToken');

  useEffect(() => {
    if (!token) {
      navigate('/prem-login-2026');
      return;
    }
    fetchVisitors();
  }, [currentPage, statusFilter, token, navigate]);

  const fetchVisitors = async () => {
    setLoading(true);
    try {
      const statusParam = statusFilter ? `&status=${statusFilter}` : '';
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/visitors?page=${currentPage}&limit=${limit}${statusParam}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('adminToken');
        navigate('/prem-login-2026');
        return;
      }
      const data = await res.json();
      setVisitors(data.visitors || []);
      setTotalCount(data.totalCount || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / limit);
  const pageNumbers = [];
  
  // Show a limited range of page numbers if there are too many
  const maxPageDisplay = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxPageDisplay / 2));
  let endPage = Math.min(totalPages, startPage + maxPageDisplay - 1);
  
  if (endPage - startPage + 1 < maxPageDisplay) {
    startPage = Math.max(1, endPage - maxPageDisplay + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="portfolio-page">
      <SEO title="Visitor Analytics | Admin" noindex={true} />
      <Navbar />
      <main className="main-content">
        <div className="admin-page dashboard-page">
          <div className="dashboard-header">
            <div>
              <h2 className="gradient-text">Detailed Visitor Analytics</h2>
              <p className="text-muted">In-depth traffic data for your portfolio.</p>
            </div>
            <div className="dashboard-actions">
              <button onClick={() => navigate(-1)} className="btn btn-outline">
                <FaArrowLeft /> Back to Dashboard
              </button>
            </div>
          </div>

          <div className="dashboard-content glass-panel">
            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '20px' }}>
              <p className="text-muted" style={{ margin: 0 }}>Total {totalCount} unique visitor sessions tracked</p>
              
              <div className="filter-tabs" style={{ display: 'flex', gap: '10px', background: 'rgba(255, 255, 255, 0.03)', padding: '4px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <button 
                  className={`btn btn-sm ${statusFilter === '' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => { setStatusFilter(''); setCurrentPage(1); }}
                  style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                >
                  All Traffic
                </button>
                <button 
                  className={`btn btn-sm ${statusFilter === 'subscribed' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => { setStatusFilter('subscribed'); setCurrentPage(1); }}
                  style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                >
                  Subscribers Only 🔔
                </button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-5">
                <p>Loading analytics data...</p>
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th><FaClock /> Date & Time</th>
                        <th><FaGlobe /> IP Address</th>
                        <th><FaLaptop /> Device / User Agent</th>
                        <th>Push Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visitors.length > 0 ? visitors.map((v, idx) => (
                        <tr key={v.unique_id || idx}>
                          <td>{new Date(v.visited_at).toLocaleString()}</td>
                          <td>
                            <code className="ip-code">{v.ip}</code>
                          </td>
                          <td className="msg-cell" title={v.user_agent}>
                            {v.user_agent ? (v.user_agent.length > 60 ? v.user_agent.substring(0, 60) + '...' : v.user_agent) : 'Unknown'}
                          </td>
                          <td>
                            {v.subscription_status === 'subscribed' ? (
                              <span className="tag" style={{ background: '#10B981', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>Subscribed</span>
                            ) : v.subscription_status === 'dismissed' ? (
                              <span className="tag" style={{ background: '#F59E0B', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>Dismissed</span>
                            ) : (
                              <span className="tag" style={{ background: '#6B7280', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>Not Subscribed</span>
                            )}
                          </td>
                        </tr>
                      )) : (
                        <tr><td colSpan="4" className="text-center">No visitor data available.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="pagination">
                    <button 
                      className="page-btn" 
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      title="First Page"
                    >
                      First
                    </button>
                    <button 
                      className="page-btn" 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      <FaChevronLeft />
                    </button>
                    
                    {startPage > 1 && <span className="page-dots">...</span>}
                    
                    {pageNumbers.map(number => (
                      <button 
                        key={number} 
                        className={`page-btn ${currentPage === number ? 'active' : ''}`}
                        onClick={() => setCurrentPage(number)}
                      >
                        {number}
                      </button>
                    ))}
                    
                    {endPage < totalPages && <span className="page-dots">...</span>}
                    
                    <button 
                      className="page-btn" 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      <FaChevronRight />
                    </button>
                    <button 
                      className="page-btn" 
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      title="Last Page"
                    >
                      Last
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AllVisitors;
