import React, { useState, useEffect } from 'react';
import SEO from '../components/SEO';
import { useNavigate } from 'react-router-dom';
import './Admin.css';

const AdminLogin = () => {
  const [mode, setMode] = useState('login'); // login, forgot, otp, reset
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
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
    } catch (err) { setError('Server error'); }
    setLoading(false);
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: credentials.email })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('OTP sent to your email!');
        setMode('otp');
      } else { setError(data.error); }
    } catch (err) { setError('Server error'); }
    setLoading(false);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: credentials.email, otp })
      });
      if (res.ok) {
        setMode('reset');
      } else {
        const data = await res.json();
        setError(data.error);
      }
    } catch (err) { setError('Server error'); }
    setLoading(false);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: credentials.email, otp, newPassword })
      });
      if (res.ok) {
        setMessage('Password reset successful! Please login.');
        setMode('login');
      } else {
        const data = await res.json();
        setError(data.error);
      }
    } catch (err) { setError('Server error'); }
    setLoading(false);
  };

  return (
    <div className="admin-page">
      <SEO title="Admin Portal" noindex={true} />
      <div className="admin-login-box glass-panel">
        <h2 className="gradient-text text-center">
          {mode === 'login' && 'Admin Login'}
          {mode === 'forgot' && 'Reset Password'}
          {mode === 'otp' && 'Verify OTP'}
          {mode === 'reset' && 'New Password'}
        </h2>

        {message && <p className="success-text text-center">{message}</p>}
        {error && <p className="error-text text-center">{error}</p>}

        {mode === 'login' && (
          <form onSubmit={handleLogin} className="admin-form">
            <input type="email" name="email" placeholder="Authorized Email" value={credentials.email} onChange={handleChange} required />
            <input type="password" name="password" placeholder="Password" value={credentials.password} onChange={handleChange} required />
            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
            <p className="text-center mt-3">
              <span className="link-text" onClick={() => setMode('forgot')}>Forgot Password?</span>
            </p>
          </form>
        )}

        {mode === 'forgot' && (
          <div className="admin-form">
            <p className="text-muted text-center mb-4">
              For security, please contact the <strong>Primary Super Admin</strong> to manually reset your password.
            </p>
            <div className="contact-admin-info glass-panel mb-4" style={{ padding: '15px', textAlign: 'center', border: '1px dashed var(--primary-color)' }}>
              <p style={{ margin: 0 }}>Super Admin Email:</p>
              <p><strong>mr.prem2006@gmail.com</strong></p>
            </div>
            
            <hr style={{ border: '0', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '20px 0' }} />
            
            <p className="text-muted text-center mb-3">Alternatively, try resetting via Email OTP:</p>
            <form onSubmit={handleForgot}>
              <input type="email" name="email" placeholder="Email Address" value={credentials.email} onChange={handleChange} required />
              <button type="submit" className="btn btn-outline w-full" disabled={loading}>
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </form>

            <p className="text-center mt-4">
              <span className="link-text" onClick={() => setMode('login')}>Back to Login</span>
            </p>
          </div>
        )}

        {mode === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="admin-form">
            <p className="text-muted text-center mb-3">Enter the code sent to your email.</p>
            <input type="text" placeholder="6-Digit OTP" value={otp} onChange={(e) => setOtp(e.target.value)} required maxLength="6" className="text-center letter-spacing-lg" />
            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <p className="text-center mt-3">
              <span className="link-text" onClick={() => setMode('forgot')}>Resend OTP</span>
            </p>
          </form>
        )}

        {mode === 'reset' && (
          <form onSubmit={handleResetPassword} className="admin-form">
            <p className="text-muted text-center mb-3">Create a strong new password.</p>
            <input type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
              {loading ? 'Resetting...' : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AdminLogin;
