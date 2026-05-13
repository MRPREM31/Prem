import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import ManageSecureVault from '../components/Admin/ManageSecureVault';
import './Admin.css';

const AdminVault = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('adminToken');
  const isSuperAdmin = localStorage.getItem('adminEmail') === 'mr.prem2006@gmail.com';

  useEffect(() => {
    if (!token || !isSuperAdmin) {
      navigate('/prem-login-2026');
    }
  }, [token, isSuperAdmin, navigate]);

  if (!token || !isSuperAdmin) return null;

  return (
    <div className="portfolio-page">
      <SEO title="Vault Management Center" noindex={true} />
      <Navbar />
      <main className="main-content">
        <div className="vault-admin-container">
          <ManageSecureVault token={token} />
        </div>
      </main>
      <Footer />
    </div>
  );
};




export default AdminVault;
