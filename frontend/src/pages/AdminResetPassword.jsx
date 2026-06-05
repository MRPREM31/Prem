import React, { useState, useEffect } from 'react';
import SEO from '../components/SEO';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import './Admin.css';

const AdminResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { email, otp } = location.state || {};

  // Route guard: Redirect to forgot password route if accessed without credentials verification
  useEffect(() => {
    if (!email || !otp) {
      navigate('/prem-login-2026/forgot-password', { replace: true });
    }
  }, [email, otp, navigate]);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        // Delay navigation to allow display of success animation
        setTimeout(() => {
          navigate('/prem-login-2026', { state: { message: 'Password reset successful! Please login.' } });
        }, 2000);
      } else {
        setError(data.error || 'Failed to update password. Session may have expired.');
      }
    } catch (err) {
      setError('Server connection error. Please try again.');
    }
    setLoading(false);
  };

  if (!email || !otp) {
    return (
      <div className="admin-page">
        <div className="admin-login-box glass-panel text-center">
          <p className="error-text">Unauthorized access. Redirecting to recovery page...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="admin-page">
        <SEO title="Password Reset Success" noindex={true} />
        <div className="admin-login-box glass-panel text-center success-animation-card">
          <div className="success-icon mb-4">
            <span style={{ fontSize: '3.5rem' }}>🚀</span>
          </div>
          <h2 className="gradient-text">Password Updated</h2>
          <p className="text-muted mt-3" style={{ fontSize: '1.1rem' }}>
            Your administrator password has been updated successfully.
          </p>
          <div className="skeleton-line-loader mt-4">
            <div className="loader-fill"></div>
          </div>
          <p className="tiny-text mt-3">Redirecting to login portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <SEO title="Create New Password" noindex={true} />
      <div className="admin-login-box glass-panel recovery-card">
        
        <div className="security-icon-header mb-3 text-center">
          <span style={{ fontSize: '2.5rem' }}>🔑</span>
        </div>
        
        <h2 className="gradient-text text-center" style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>
          New Password
        </h2>
        <p className="text-muted text-center mb-4" style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>
          Create a strong, secure new password for your administrator account.
        </p>

        {error && <p className="error-text text-center mb-4">{error}</p>}

        <form onSubmit={handleResetPassword} className="admin-form">
          <div className="input-group">
            <label className="input-label" htmlFor="new-password">New Password</label>
            <input 
              id="new-password"
              type="password" 
              placeholder="Minimum 6 characters" 
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)} 
              required 
              autoFocus
            />
          </div>
          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? 'Updating Password...' : 'Update Password'}
          </button>
        </form>

        {/* Security Notice Section */}
        <div className="security-notice-box mt-4">
          <div className="security-notice-title">🛡️ Security Notice</div>
          <p>For your protection, all password reset requests are logged and monitored.</p>
          <p className="mt-1">Successful password resets trigger a security notification to the administrator account.</p>
        </div>

      </div>
    </div>
  );
};

export default AdminResetPassword;
