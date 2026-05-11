import React, { useState, useEffect } from 'react';
import SEO from '../components/SEO';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { FaArrowLeft, FaShareAlt } from 'react-icons/fa';
import './CertificateDetail.css';

const CertificateDetail = () => {
  const { idOrSlug } = useParams();
  const navigate = useNavigate();
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/certificates/${idOrSlug}`);
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
  }, [idOrSlug, navigate]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: certificate.title,
        text: `Check out my certificate: ${certificate.title}`,
        url: window.location.href,
      }).catch(err => console.log('Error sharing:', err));
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div className="portfolio-page">
      <SEO 
        title={certificate ? `${certificate.title} | Certificates` : "Certificate Detail"}
        image={certificate ? (certificate.image.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL}${certificate.image}` : certificate.image) : null}
        url={certificate ? `certificate/${certificate.slug || certificate.id}` : `certificate/${idOrSlug}`}
        type="article"
      />
      <Navbar />
      <main className="main-content">
        {loading ? (
          <div className="cert-detail-loading">
            <div className="spinner"></div>
            <p>Loading certificate details...</p>
          </div>
        ) : !certificate ? (
          <div className="cert-detail-error">
            <p>Certificate not found.</p>
          </div>
        ) : (
          <div className="cert-detail-page section">
            <div className="container">
              <div className="section-header-flex mb-4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button className="btn btn-outline back-btn" onClick={() => navigate('/all-certificates')}>
                  <FaArrowLeft /> Back
                </button>
                <button className="btn btn-primary share-btn" onClick={handleShare}>
                  <FaShareAlt /> Share Certificate
                </button>
              </div>
              
              <div className="cert-detail-container glass-panel">
                <div className="cert-detail-image-wrapper">
                  {certificate.image && (certificate.image.toLowerCase().endsWith('.pdf') || certificate.image.includes('/raw/upload/')) ? (
                    <div className="pdf-viewer-container">
                      <iframe 
                        src={certificate.image.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL}${certificate.image}` : certificate.image} 
                        title={certificate.title}
                        className="pdf-iframe"
                      />
                      <div className="pdf-actions">
                        <a href={certificate.image.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL}${certificate.image}` : certificate.image} target="_blank" rel="noreferrer" className="btn btn-primary">
                           Open PDF in New Tab
                        </a>
                      </div>
                    </div>
                  ) : (
                    <img 
                      src={certificate.image.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL}${certificate.image}` : certificate.image} 
                      alt={certificate.title} 
                      className="cert-detail-img" 
                    />
                  )}
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
        )}
      </main>
      <Footer />
    </div>
  );
};

export default CertificateDetail;
