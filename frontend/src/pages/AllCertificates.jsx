import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaEye, FaShareAlt, FaDownload } from 'react-icons/fa';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import { optimizeCloudinaryUrl } from '../utils/cloudinary';
import { downloadImage } from '../utils/download';
import '../components/Certificates.css';
import useFetch from '../hooks/useFetch';
import fallbackCertificates from '../data/fallbackCertificates';

const AllCertificates = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { scrollY, section } = location.state || {};

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { data: certificates = [], loading } = useFetch('/api/certificates', fallbackCertificates);


  const itemListSchema = certificates.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "All Certificates by Prem Prasad Pradhan",
    "description": "Professional certifications and achievements of Prem Prasad Pradhan.",
    "itemListElement": certificates.map((cert, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "url": `https://mrprem.in/certificate/${cert.slug || cert.id}`,
      "name": cert.title
    }))
  } : undefined;

  return (
    <div className="portfolio-page">
      <SEO 
        title="All Certificates | Prem Prasad Pradhan"
        description={`View all ${certificates.length} professional certifications and achievements of Prem Prasad Pradhan.`}
        schema={itemListSchema}
        url="all-certificates"
      />
      <Navbar />
      <main className="main-content">
        <section className="section certificates-section" id="certificates" style={{ paddingTop: '120px' }}>
          <div className="container">
            <div className="section-header-flex mb-4">
              <div>
                <button className="btn btn-outline btn-sm mb-3" onClick={() => navigate('/', { state: { fromPortfolio: true, section: section || 'certificates', scrollY } })}>
                  <FaArrowLeft /> Back to Portfolio
                </button>
                <h1 className="section-title gradient-text">All Certificates ({certificates.length})</h1>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-5">
                <div className="spinner"></div>
                <p>Loading certificates...</p>
              </div>
            ) : (
              <div className="certificates-grid">
                {certificates.map((cert, index) => (
                  <motion.div 
                    className="certificate-card glass-panel" 
                    key={cert.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: (index % 6) * 0.1 }}
                    onClick={() => navigate(`/certificate/${cert.slug || cert.id}`)}
                  >
                    <div className="cert-image-container">
                      <img 
                        src={optimizeCloudinaryUrl(cert.image && typeof cert.image === 'string' && cert.image.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL}${cert.image}` : (cert.image || ''), 600)} 
                        alt={cert.image_alt || cert.title} 
                        className="cert-img" 
                        loading="lazy"
                      />
                      
                      {/* Top Right Share Icon */}
                      <div className="top-share-icon" title="Share Certificate Page" onClick={(e) => {
                        e.stopPropagation();
                        if (navigator.share) {
                          navigator.share({ title: cert.title, url: `${window.location.origin}/certificate/${cert.slug || cert.id}` });
                        } else {
                          navigator.clipboard.writeText(`${window.location.origin}/certificate/${cert.slug || cert.id}`);
                          alert('Certificate page link copied!');
                        }
                      }}>
                        <FaShareAlt />
                      </div>

                      <div className="cert-overlay">
                        <div className="card-actions">
                          <div className="action-icon" title="View Detail" onClick={() => navigate(`/certificate/${cert.slug || cert.id}`)}>
                            <FaEye />
                          </div>
                          <div className="action-icon" title="Share CDN Image Link" onClick={(e) => {
                            e.stopPropagation();
                            const certImgUrl = cert.image && typeof cert.image === 'string' && cert.image.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL}${cert.image}` : (cert.image || '');
                            if (navigator.share) {
                              navigator.share({ title: cert.title, url: certImgUrl });
                            } else {
                              navigator.clipboard.writeText(certImgUrl);
                              alert('Certificate CDN link copied!');
                            }
                          }}>
                            <FaShareAlt />
                          </div>
                          <div className="action-icon" title="Download" onClick={(e) => {
                            e.stopPropagation();
                            const downloadUrl = cert.image && typeof cert.image === 'string' && cert.image.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL}${cert.image}` : (cert.image || '');
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
                         {(cert.description || '').length > 100 ? `${(cert.description || '').substring(0, 100)}...` : (cert.description || '')}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default AllCertificates;
