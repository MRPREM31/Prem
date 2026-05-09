import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaArrowLeft } from 'react-icons/fa';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import { optimizeCloudinaryUrl } from '../utils/cloudinary';
import '../components/Certificates.css';

const AllCertificates = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchCertificates = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/certificates?t=${Date.now()}`);
        const data = await res.json();
        setCertificates(data);
      } catch (err) {
        console.error('Error fetching certificates:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCertificates();
  }, []);

  return (
    <div className="portfolio-page">
      <SEO 
        title="All Certificates | Prem Prasad Pradhan"
        description={`View all ${certificates.length} professional certifications and achievements of Prem Prasad Pradhan.`}
      />
      <Navbar />
      <main className="main-content">
        <section className="section certificates-section" id="certificates" style={{ paddingTop: '120px' }}>
          <div className="container">
            <div className="section-header-flex mb-4">
              <div>
                <button className="btn btn-outline btn-sm mb-3" onClick={() => navigate(-1)}>
                  <FaArrowLeft /> Back
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
                    onClick={() => navigate(`/certificate/${cert.id}`)}
                  >
                    <div className="cert-image-container">
                      <img 
                        src={optimizeCloudinaryUrl(cert.image.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL}${cert.image}` : cert.image, 600)} 
                        alt={cert.image_alt || cert.title} 
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
                        {cert.description.length > 100 ? `${cert.description.substring(0, 100)}...` : cert.description}
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
