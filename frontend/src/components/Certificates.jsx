import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Certificates.css';

const Certificates = () => {
  const [certificates, setCertificates] = useState([]);
  const navigate = useNavigate();

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
            certificates.map(cert => (
              <div className="certificate-card glass-panel" key={cert.id} onClick={() => navigate(`/certificate/${cert.id}`)}>
                <div className="cert-image-container">
                  <img 
                    src={cert.image.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL}${cert.image}` : cert.image} 
                    alt={cert.title} 
                    className="cert-img" 
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
      </div>
    </section>
  );
};

export default Certificates;
