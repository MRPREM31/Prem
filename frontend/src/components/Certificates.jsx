import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { optimizeCloudinaryUrl } from '../utils/cloudinary';
import './Certificates.css';

const Certificates = () => {
  const [certificates, setCertificates] = useState([]);
  const navigate = useNavigate();

  const [displayLimit, setDisplayLimit] = useState(6);

  useEffect(() => {
    const handleResize = () => {
      setDisplayLimit(window.innerWidth < 768 ? 3 : 6);
    };
    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/certificates?t=${Date.now()}`);
        const data = await res.json();
        setCertificates(data);
      } catch (err) {
        console.error('Error fetching certificates:', err);
      }
    };
    fetchCertificates();
  }, []);

  return (
    <section className="section certificates-section" id="certificates">
      <div className="container">
        <h2 className="section-title gradient-text">Certificates & Achievements</h2>
        
        <div className="certificates-grid">
          {certificates.length > 0 ? (
            certificates.slice(0, displayLimit).map(cert => (
              <div className="certificate-card glass-panel" key={cert.id} onClick={() => { 
                navigate(`/certificate/${cert.id}`, { 
                  state: { fromPortfolio: true, scrollY: window.scrollY, section: 'certificates' } 
                }); 
              }}>
                <div className="cert-image-container">
                  <img 
                    src={optimizeCloudinaryUrl(cert.image.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL}${cert.image}` : cert.image, 600)} 
                    alt={cert.image_alt || `Certificate of Achievement: ${cert.title} awarded to Prem Prasad Pradhan`} 
                    className="cert-img" 
                    loading="lazy"
                  />
                  <div className="cert-overlay">
                    <button className="btn btn-primary btn-sm">See full detail</button>
                  </div>
                </div>
                <div className="cert-content">
                  <h3 className="cert-title">{cert.title}</h3>
                  <p className="cert-date">{cert.date}</p>
                  <p className="cert-description">
                    {cert.description.length > 80 ? `${cert.description.substring(0, 80)}...` : cert.description}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center w-100 text-muted">No certificates to show right now.</p>
          )}
        </div>

        {certificates.length > displayLimit && (
          <div className="view-all-container">
            <button 
              className="btn btn-primary view-all-btn"
              onClick={() => navigate('/all-certificates')}
            >
              See All Certificates ({certificates.length})
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default Certificates;
