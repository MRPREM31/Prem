import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaLock, FaUserAlt, FaKey, FaSignOutAlt, FaSearch, FaCopy, FaExternalLinkAlt, FaList, FaThLarge, FaShieldAlt } from 'react-icons/fa';
import toast, { Toaster } from 'react-hot-toast';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import './SecurePortal.css';

const SecurePortal = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [links, setLinks] = useState([]);
  const [filteredLinks, setFilteredLinks] = useState([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [categories, setCategories] = useState(['All']);
  const [viewMode, setViewMode] = useState('grid');
  const [timeLeft, setTimeLeft] = useState(20 * 60); // 20 minutes in seconds

  // Login Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Check existing session
  useEffect(() => {
    const token = sessionStorage.getItem('vault_token');
    const expiry = sessionStorage.getItem('vault_expiry');
    
    if (token && expiry && Date.now() < parseInt(expiry)) {
      setIsAuthenticated(true);
      fetchLinks(token);
      
      // Calculate remaining time
      const remaining = Math.floor((parseInt(expiry) - Date.now()) / 1000);
      setTimeLeft(remaining);
    } else {
      handleLogout();
    }
  }, []);

  // Timer Countdown Logic
  useEffect(() => {
    if (!isAuthenticated) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          toast.error('Session expired for security reasons.', { icon: '🔒' });
          handleLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isAuthenticated]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/vault/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        toast.error(data.error || 'Access Denied', {
          style: { background: '#333', color: '#fff', border: '1px solid #ff4d4d' }
        });
        setLoading(false);
        return;
      }

      // Success
      toast.success(data.message, { icon: '🔓', style: { background: '#333', color: '#fff' } });
      const expiryTime = Date.now() + 20 * 60 * 1000; // 20 minutes
      sessionStorage.setItem('vault_token', data.token);
      sessionStorage.setItem('vault_expiry', expiryTime.toString());
      
      setTimeLeft(20 * 60);
      setIsAuthenticated(true);
      fetchLinks(data.token);
    } catch (err) {
      toast.error('System offline. Cannot reach security servers.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('vault_token');
    sessionStorage.removeItem('vault_expiry');
    setIsAuthenticated(false);
    setLinks([]);
    setUsername('');
    setPassword('');
  };

  const fetchLinks = async (token) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/vault/links`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401 || res.status === 403) {
        handleLogout();
        return;
      }
      const data = await res.json();
      // Sort by most recent first
      const sortedData = data.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      setLinks(sortedData);
      setFilteredLinks(sortedData);
      
      // Extract unique categories
      const uniqueCats = ['All', ...new Set(sortedData.map(item => item.category))];
      setCategories(uniqueCats);
    } catch (err) {
      console.error('Error fetching vault links:', err);
    }
  };

  // Search & Filter Logic
  useEffect(() => {
    let result = links;
    if (activeCategory !== 'All') {
      result = result.filter(link => link.category === activeCategory);
    }
    if (search.trim() !== '') {
      const q = search.toLowerCase();
      result = result.filter(link => 
        link.title.toLowerCase().includes(q) || 
        (link.description && link.description.toLowerCase().includes(q))
      );
    }
    setFilteredLinks(result);
  }, [search, activeCategory, links]);

  const handleCopyLink = (url) => {
    navigator.clipboard.writeText(url);
    toast.success('Link copied successfully 🚀', {
      style: { background: '#333', color: '#fff', border: '1px solid #10b981' }
    });
  };

  const handleOpenLink = async (id) => {
    const token = sessionStorage.getItem('vault_token');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/vault/open-link/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Unauthorized');
      const data = await res.json();
      window.open(data.url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      toast.error('Failed to open link safely.');
    }
  };

  // Format Timer
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="secure-portal-page">
      <SEO title="Secure Access | Confidential" description="Private document portal." robots="noindex, nofollow" />
      <Navbar />
      <Toaster position="top-center" />

      <main style={{ minHeight: '80vh' }}>
        <AnimatePresence mode="wait">
          {!isAuthenticated ? (
            <motion.div 
              key="lock-screen"
              className="lock-screen"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.4 }}
            >
              <div className="lock-box">
                <div className="lock-icon-wrapper">
                  <FaLock />
                </div>
                <h2 className="fw-bold">Secure Vault</h2>
                <p>Authorized Personnel Only</p>

                <form onSubmit={handleLogin} className="lock-form">
                  <div className="form-group">
                    <label>Vault ID</label>
                    <div className="input-with-icon">
                      <FaUserAlt />
                      <input 
                        type="text" 
                        placeholder="Enter ID" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Passkey</label>
                    <div className="input-with-icon">
                      <FaKey />
                      <input 
                        type="password" 
                        placeholder="Enter Passkey" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn-lock mt-3" disabled={loading}>
                    {loading ? <span className="spinner-border spinner-border-sm"></span> : <><FaShieldAlt /> AUTHENTICATE</>}
                  </button>
                </form>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="dashboard"
              className="secure-dashboard container flex-grow-1 py-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="dashboard-header mb-5">
                <div className="dashboard-title-area">
                  <h1 className="gradient-text display-5 fw-bold m-0"><FaShieldAlt /> Personal Vault</h1>
                  <p className="text-muted lead">Securely access your private documents and links.</p>
                </div>
                <div className="dashboard-controls-area d-flex align-items-center gap-3 flex-wrap">
                  <div className={`session-timer ${timeLeft < 300 ? 'warning' : ''}`} title="Session auto-destructs at 0">
                    <FaLock /> {formatTime(timeLeft)}
                  </div>
                  <button onClick={handleLogout} className="btn btn-outline btn-sm text-danger px-3 py-2" style={{ borderColor: 'var(--danger-color)', borderRadius: '10px' }}>
                    <FaSignOutAlt /> Lock Vault
                  </button>
                </div>
              </div>

              <div className="toolbar">
                <div className="search-box">
                  <FaSearch />
                  <input 
                    type="text" 
                    placeholder="Search secure documents..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                
                <div className="categories">
                  {categories.map(cat => (
                    <button 
                      key={cat} 
                      className={`category-pill ${activeCategory === cat ? 'active' : ''}`}
                      onClick={() => setActiveCategory(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {filteredLinks.length === 0 ? (
                <div className="text-center py-5">
                  <FaLock size={60} style={{ opacity: 0.1 }} className="mb-4" />
                  <h3>No secure documents found</h3>
                </div>
              ) : (
                <div className="links-grid">
                  <AnimatePresence>
                    {filteredLinks.map((link, i) => (
                      <motion.div 
                        key={link.id} 
                        className="link-card"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: i * 0.1 }}
                      >
                        <div className="link-card-header d-flex justify-content-between align-items-center">
                          <div className="link-icon">
                            <FaShieldAlt />
                          </div>
                          <span className="link-category">{link.category}</span>
                        </div>
                        <h3>{link.title}</h3>
                        {link.description && <p>{link.description}</p>}
                        
                        <div className="link-actions mt-auto d-flex gap-2">
                          <button className="btn-copy flex-grow-1" onClick={() => handleCopyLink(link.google_drive_link)}>
                            <FaCopy /> Copy
                          </button>
                          <button className="btn-open flex-grow-1" onClick={() => handleOpenLink(link.id)}>
                            <FaExternalLinkAlt /> Open
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
};

export default SecurePortal;
