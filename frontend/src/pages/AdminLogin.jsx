import React, { useState, useEffect } from 'react';
import SEO from '../components/SEO';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import './Admin.css';

const AdminLogin = () => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.message) {
      setMessage(location.state.message);
    }
  }, [location.state]);

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      const data = await res.json();
      if (data.auth) {
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminEmail', data.email);
        navigate('/prem-dashboard-2026');
      } else {
        setError(data.error || 'Invalid login');
      }
    } catch (err) { 
      setError('Server error'); 
    }
    setLoading(false);
  };

  return (
    <div className="admin-page">
      <SEO title="Admin Portal" noindex={true} />
      <div className="admin-login-box glass-panel text-center">
        <div className="security-icon-header mb-4">
          <span style={{ fontSize: '3rem' }}>🔒</span>
        </div>
        <h2 className="gradient-text text-center">Admin Login</h2>

        {message && <p className="success-text text-center mb-4">{message}</p>}
        {error && <p className="error-text text-center mb-4">{error}</p>}

        <form onSubmit={handleLogin} className="admin-form">
          <input 
            type="email" 
            name="email" 
            placeholder="Authorized Email" 
            value={credentials.email} 
            onChange={handleChange} 
            required 
          />
          <input 
            type="password" 
            name="password" 
            placeholder="Password" 
            value={credentials.password} 
            onChange={handleChange} 
            required 
          />
          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
          <p className="text-center mt-3">
            <Link to="/prem-login-2026/forgot-password" className="link-text">Forgot Password?</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
