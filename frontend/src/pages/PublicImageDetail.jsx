import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { motion } from 'framer-motion';
import { FaDownload, FaShareAlt, FaCopy, FaCheck, FaArrowLeft, FaExternalLinkAlt } from 'react-icons/fa';
import '../pages/CertificateDetail.css'; // Reuse premium layout styles

const PublicImageDetail = () => {
  const { slug } = useParams();
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchImageData = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/media/slug/${slug}`);
        if (!res.ok) throw new Error('Image not found');
        const data = await res.json();
        setImage(data);
      } catch (err) {
        console.error(err);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchImageData();
  }, [slug, navigate]);

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: image.name,
        text: `Check out this professional asset by Prem Prasad Pradhan`,
        url: window.location.href
      });
    } else {
      handleCopy();
    }
  };

  if (loading) {
    return (
      <div className="portfolio-page">
        <Navbar />
        <main className="main-content">
          <div className="cert-detail-loading">
            <div className="spinner"></div>
            <p>Fetching asset from CDN...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!image) return null;

  return (
    <div className="portfolio-page">
      <SEO 
        title={`${image.name} | Asset CDN`}
        description={`Professional media asset hosted on Prem Prasad Pradhan's private CDN.`}
        image={image.url}
        url={`cdn/${image.slug}`}
        type="article"
      />
      <Navbar />
      
      <main className="main-content">
        <div className="cert-detail-page section">
          <div className="container">
            <div className="section-header-flex mb-4">
              <button className="btn btn-outline back-btn" onClick={() => navigate(-1)}>
                <FaArrowLeft /> Back
              </button>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn btn-outline" onClick={handleCopy}>
                  {copied ? <FaCheck style={{ color: '#10b981' }} /> : <FaCopy />} Copy Link
                </button>
                <button className="btn btn-primary share-btn" onClick={handleShare}>
                  <FaShareAlt /> Share Asset
                </button>
              </div>
            </div>

            <motion.div 
              className="cert-detail-container glass-panel"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="cert-detail-image-wrapper">
                <img src={image.url} alt={image.name} className="cert-detail-img" style={{ borderRadius: '12px' }} />
              </div>
              
              <div className="cert-detail-info">
                <h1 className="cert-detail-title gradient-text">{image.name}</h1>
                <div className="cert-detail-meta" style={{ display: 'flex', gap: '20px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  <span>Published: {new Date(image.upload_date).toLocaleDateString()}</span>
                  <span>Size: {(image.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
                
                <div className="mt-4" style={{ display: 'flex', gap: '1rem' }}>
                  <a href={image.url} download={image.name} className="btn btn-primary">
                    <FaDownload /> Download Original
                  </a>
                  <a href={image.url} target="_blank" rel="noreferrer" className="btn btn-outline">
                    <FaExternalLinkAlt /> View Source
                  </a>
                </div>
                
                <div className="cdn-info-box mt-5 glass-panel" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
                  <p className="small text-muted mb-2">Private CDN Link:</p>
                  <code style={{ color: 'var(--primary-color)', wordBreak: 'break-all' }}>{window.location.href}</code>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PublicImageDetail;
