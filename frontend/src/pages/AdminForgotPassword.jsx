import React, { useState, useEffect } from 'react';
import SEO from '../components/SEO';
import { useNavigate, Link } from 'react-router-dom';
import './Admin.css';

const AdminForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [method, setMethod] = useState('telegram'); // telegram or authenticator
  const [codeValues, setCodeValues] = useState(['', '', '', '', '', '']); // For Google Authenticator [1][2][3][4][5][6]
  const [telegramOtp, setTelegramOtp] = useState(''); // For Telegram OTP input
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);
  const [tempOtp, setTempOtp] = useState('');
  const navigate = useNavigate();

  // Reset inputs when switching verification methods
  useEffect(() => {
    setCodeValues(['', '', '', '', '', '']);
    setTelegramOtp('');
    setError('');
    setMessage('');
  }, [method]);

  // Handle split input for TOTP code
  const handleDigitChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // Numeric only
    const newValues = [...codeValues];
    newValues[index] = value.slice(-1); // Take only the last typed character
    setCodeValues(newValues);

    // Focus next input box
    if (value && index < 5) {
      const nextInput = document.getElementById(`digit-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!codeValues[index] && index > 0) {
        const prevInput = document.getElementById(`digit-${index - 1}`);
        if (prevInput) {
          prevInput.focus();
          const newValues = [...codeValues];
          newValues[index - 1] = '';
          setCodeValues(newValues);
        }
      } else {
        const newValues = [...codeValues];
        newValues[index] = '';
        setCodeValues(newValues);
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim().slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return; // Numeric only

    const newValues = [...codeValues];
    for (let i = 0; i < 6; i++) {
      newValues[i] = pastedData[i] || '';
    }
    setCodeValues(newValues);

    const focusIndex = Math.min(pastedData.length, 5);
    const nextInput = document.getElementById(`digit-${focusIndex}`);
    if (nextInput) nextInput.focus();
  };

  // 1. Send OTP to Telegram
  const handleSendTelegramOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('OTP sent to your Telegram account!');
        setOtpSent(true);
      } else {
        setError(data.error || 'Failed to send OTP.');
      }
    } catch (err) {
      setError('Server connection error. Please try again.');
    }
    setLoading(false);
  };

  // 2. Verify Telegram OTP
  const handleVerifyTelegramOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: telegramOtp })
      });
      const data = await res.json();
      if (res.ok) {
        setTempOtp(telegramOtp); // In Telegram flow, verified code is the OTP itself
        setVerifiedSuccess(true);
        // Delay redirect to show the modern success screen
        setTimeout(() => {
          navigate('/prem-login-2026/reset-password', { state: { email, otp: telegramOtp } });
        }, 1500);
      } else {
        setError(data.error || 'Invalid or expired OTP code.');
      }
    } catch (err) {
      setError('Server connection error. Please try again.');
    }
    setLoading(false);
  };

  // 3. Verify Google Authenticator Code
  const handleVerifyAuthenticator = async (e) => {
    e.preventDefault();
    const code = codeValues.join('');
    if (code.length < 6) {
      setError('Please enter all 6 digits of the code.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/verify-authenticator`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTempOtp(data.tempOtp);
        setVerifiedSuccess(true);
        // Delay redirect to show the modern success screen
        setTimeout(() => {
          navigate('/prem-login-2026/reset-password', { state: { email, otp: data.tempOtp } });
        }, 1500);
      } else {
        setError(data.error || 'Invalid Google Authenticator code.');
      }
    } catch (err) {
      setError('Server connection error. Please try again.');
    }
    setLoading(false);
  };

  // Success view
  if (verifiedSuccess) {
    return (
      <div className="admin-page">
        <SEO title="Identity Verified" noindex={true} />
        <div className="admin-login-box glass-panel text-center success-animation-card">
          <div className="success-icon mb-4">
            <span style={{ fontSize: '3.5rem' }}>✅</span>
          </div>
          <h2 className="gradient-text">Identity Verified</h2>
          <p className="text-muted mt-3" style={{ fontSize: '1.1rem' }}>
            Verification successful. You may now create your new administrator password.
          </p>
          <div className="skeleton-line-loader mt-4">
            <div className="loader-fill"></div>
          </div>
          <p className="tiny-text mt-3">Redirecting securely to new password form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <SEO title="Account Recovery" noindex={true} />
      <div className="admin-login-box glass-panel recovery-card">
        
        {/* Back Arrow Button */}
        <div className="back-navigation">
          <Link to="/prem-login-2026" className="back-btn" aria-label="Go back to login">
            <span>←</span> Back to Login
          </Link>
        </div>

        <div className="security-icon-header mb-3 text-center">
          <span style={{ fontSize: '2.5rem' }}>🔐</span>
        </div>
        
        <h2 className="gradient-text text-center" style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>
          Account Recovery
        </h2>
        <p className="text-muted text-center mb-4" style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>
          Securely verify your identity to reset your administrator password.
        </p>

        {message && <p className="success-text text-center mb-4">{message}</p>}
        {error && <p className="error-text text-center mb-4">{error}</p>}

        {/* 1. Verification Method Cards */}
        {!otpSent && (
          <div className="verification-methods-grid mb-4">
            <button 
              type="button" 
              className={`method-card ${method === 'telegram' ? 'active' : ''}`}
              onClick={() => setMethod('telegram')}
              aria-pressed={method === 'telegram'}
            >
              <div className="method-icon">📱</div>
              <div className="method-info">
                <h4>Telegram OTP</h4>
                <p>Receive OTP in Telegram instantly</p>
              </div>
            </button>
            <button 
              type="button" 
              className={`method-card ${method === 'authenticator' ? 'active' : ''}`}
              onClick={() => setMethod('authenticator')}
              aria-pressed={method === 'authenticator'}
            >
              <div className="method-icon">🔐</div>
              <div className="method-info">
                <h4>Authenticator</h4>
                <p>Use Google Authenticator App</p>
              </div>
            </button>
          </div>
        )}

        {/* 2. Verification Form Flow */}
        {method === 'telegram' ? (
          /* Telegram Verification Form */
          !otpSent ? (
            <form onSubmit={handleSendTelegramOtp} className="admin-form">
              <div className="input-group">
                <label className="input-label" htmlFor="recovery-email">Authorized Email Address</label>
                <input 
                  id="recovery-email"
                  type="email" 
                  placeholder="admin@example.com" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                />
              </div>
              <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                {loading ? 'Sending OTP...' : 'Send Telegram OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyTelegramOtp} className="admin-form text-center">
              <h3 className="section-title-small mb-2">📱 Telegram Verification</h3>
              <p className="text-muted mb-4" style={{ fontSize: '0.85rem' }}>
                A 6-digit one-time password has been sent to your Telegram. Enter it below:
              </p>
              <input 
                type="text" 
                placeholder="6-Digit OTP" 
                value={telegramOtp} 
                onChange={(e) => setTelegramOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} 
                required 
                maxLength="6" 
                className="text-center letter-spacing-lg" 
                style={{ fontSize: '1.5rem', padding: '0.8rem', letterSpacing: '0.5rem', fontWeight: 'bold' }}
                autoFocus
              />
              <button type="submit" className="btn btn-primary w-full mt-4" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
              <p className="text-center mt-3">
                <span className="link-text" onClick={() => setOtpSent(false)}>Change email or request new OTP</span>
              </p>
            </form>
          )
        ) : (
          /* Google Authenticator Form */
          <form onSubmit={handleVerifyAuthenticator} className="admin-form">
            <div className="input-group mb-3">
              <label className="input-label" htmlFor="auth-email">Authorized Email Address</label>
              <input 
                id="auth-email"
                type="email" 
                placeholder="admin@example.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>
            
            <div className="text-center mb-3">
              <h3 className="section-title-small mb-1">🔐 Google Authenticator</h3>
              <p className="text-muted mb-4" style={{ fontSize: '0.85rem' }}>
                Enter the 6-digit code currently displayed in your Authenticator app.
              </p>
              
              {/* Split [ 1 ][ 2 ][ 3 ][ 4 ][ 5 ][ 6 ] Inputs */}
              <div className="digit-input-container">
                {codeValues.map((val, idx) => (
                  <input
                    key={idx}
                    id={`digit-${idx}`}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength="1"
                    className="digit-input-box"
                    value={val}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    onPaste={handlePaste}
                    autoFocus={idx === 0}
                    aria-label={`Digit ${idx + 1}`}
                  />
                ))}
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full mt-3" disabled={loading}>
              {loading ? 'Verifying Code...' : 'Verify & Proceed'}
            </button>
          </form>
        )}

        {/* 3. Security Notice Banner */}
        <div className="security-notice-box mt-4">
          <div className="security-notice-title">🛡️ Security Notice</div>
          <p>For your protection, all password reset requests are logged and monitored.</p>
          <p className="mt-1">Successful password resets trigger a security notification to the administrator account.</p>
        </div>

      </div>
    </div>
  );
};

export default AdminForgotPassword;
