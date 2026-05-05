import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './CertificateDetail.css';

const CertificateDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/certificates/${id}`);
        if (!res.ok) {
          navigate('/');
          return;
        }
        const data = await res.json();
        setCertificate(data);
      } catch (err) {
        console.error('Error fetching certificate:', err);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchCertificate();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="portfolio-page">
        <Navbar />
        <div className="cert-detail-loading">
          <div className="spinner"></div>
          <p>Loading certificate details...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!certificate) return null;

  return (
    <div className="portfolio-page">
      <Navbar />
      <div className="cert-detail-page section">
        <div className="container">
          <button className="btn btn-outline back-btn" onClick={() => navigate(-1)}>
            &larr; Back to Portfolio
          </button>
          
          <div className="cert-detail-container glass-panel">
            <div className="cert-detail-image-wrapper">
              <img 
                src={certificate.image.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL}${certificate.image}` : certificate.image} 
                alt={certificate.title} 
                className="cert-detail-img" 
              />
            </div>
            
            <div className="cert-detail-info">
              <h1 className="cert-detail-title gradient-text">{certificate.title}</h1>
              <div className="cert-detail-meta">
                <span className="cert-detail-date">{certificate.date}</span>
              </div>
              <div className="cert-detail-desc">
                {certificate.description.split('\n').map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CertificateDetail;
