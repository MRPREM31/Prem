import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { optimizeCloudinaryUrl } from '../utils/cloudinary';
import { downloadImage } from '../utils/download';
import { FaEye, FaShareAlt, FaDownload } from 'react-icons/fa';
import './Certificates.css';
import useFetch from '../hooks/useFetch';
import fallbackCertificates from '../data/fallbackCertificates';

const Certificates = () => {
  const navigate = useNavigate();
  const [displayLimit, setDisplayLimit] = useState(6);

  useEffect(() => {
    const handleResize = () => {
      setDisplayLimit(window.innerWidth < 768 ? 3 : 6);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { data: certificates = [] } = useFetch('/api/certificates', fallbackCertificates);

  return (
    <section className="section certificates-section" id="certificates">
      <div className="container">
        <h2 className="section-title gradient-text">Certificates & Achievements</h2>
        
        <div className="certificates-grid">
          {certificates.length > 0 ? (
            certificates.slice(0, displayLimit).map(cert => (
              <div className="certificate-card glass-panel" key={cert.id} onClick={() => { 
                navigate(`/certificate/${cert.slug || cert.id}`, { 
                  state: { fromPortfolio: true, scrollY: window.scrollY, section: 'certificates' } 
                }); 
              }}>
                <div className="cert-image-container">
                  <img 
                    src={optimizeCloudinaryUrl(cert.image && typeof cert.image === 'string' && cert.image.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL}${cert.image}` : (cert.image || ''), 600)} 
                    alt={cert.image_alt || `Certificate of Achievement: ${cert.title} awarded to Prem Prasad Pradhan`} 
                    className="cert-img" 
                    loading="lazy"
                  />
                  
                  {/* Top Right Share Icon */}
                  <div className="top-share-icon" onClick={(e) => {
                    e.stopPropagation();
                    if (navigator.share) {
                      navigator.share({ title: cert.title, url: `${window.location.origin}/certificate/${cert.slug || cert.id}` });
                    } else {
                      navigator.clipboard.writeText(`${window.location.origin}/certificate/${cert.slug || cert.id}`);
                      alert('Link copied!');
                    }
                  }}>
                    <FaShareAlt />
                  </div>

                  <div className="cert-overlay">
                    <div className="card-actions">
                      <div className="action-icon" title="View Detail" onClick={() => navigate(`/certificate/${cert.slug || cert.id}`)}>
                        <FaEye />
                      </div>
                      <div className="action-icon" title="Share" onClick={(e) => {
                        e.stopPropagation();
                        if (navigator.share) {
                          navigator.share({ title: cert.title, url: `${window.location.origin}/certificate/${cert.slug || cert.id}` });
                        } else {
                          navigator.clipboard.writeText(`${window.location.origin}/certificate/${cert.slug || cert.id}`);
                          alert('Link copied!');
                        }
                      }}>
                        <FaShareAlt />
                      </div>
                      <div className="action-icon" title="Download" onClick={(e) => {
                        e.stopPropagation();
                        const downloadUrl = cert.image.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL}${cert.image}` : cert.image;
                        downloadImage(downloadUrl, `${cert.title}.jpg`);
                      }}>
                        <FaDownload />
                      </div>
                    </div>
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
              onClick={() => navigate('/all-certificates', { state: { scrollY: window.scrollY, section: 'certificates' } })}
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
