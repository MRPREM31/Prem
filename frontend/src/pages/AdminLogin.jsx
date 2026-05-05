import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Admin.css';

const AdminLogin = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      const data = await res.json();
      
      if (data.auth) {
        localStorage.setItem('adminToken', data.token);
        navigate('/dashboard');
      } else {
        setError(data.error || 'Invalid login');
      }
    } catch (err) {
      setError('Server connection failed.');
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-login-box glass-panel">
        <h2 className="gradient-text text-center">Admin Login</h2>
        <form onSubmit={handleLogin} className="admin-form">
          <input 
            type="text" 
            name="username" 
            placeholder="Username" 
            onChange={handleChange} 
            required 
          />
          <input 
            type="password" 
            name="password" 
            placeholder="Password" 
            onChange={handleChange} 
            required 
          />
          {error && <p className="error-text">{error}</p>}
          <button type="submit" className="btn btn-primary w-full">Login</button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
