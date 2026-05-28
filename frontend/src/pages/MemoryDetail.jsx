import React, { useState, useEffect } from 'react';
import SEO from '../components/SEO';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { optimizeCloudinaryUrl } from '../utils/cloudinary';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaShareAlt } from 'react-icons/fa';
import './CertificateDetail.css'; // Reuse container styles
import cacheManager from '../utils/cacheManager';
import CACHE_KEYS from '../utils/cacheKeys';
import fallbackMemories from '../data/fallbackMemories';

const MemoryDetail = () => {
  const { idOrSlug } = useParams();
  const navigate = useNavigate();
  const [memory, setMemory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMemory = async () => {
      try {
        const res = await fetch(`/api/memorable-images/${idOrSlug}`);
        if (!res.ok) {
          throw new Error(`HTTP error ${res.status}`);
        }
        const data = await res.json();
        setMemory(data);
      } catch (err) {
        console.warn('Error fetching memory detail, trying resilient fallbacks:', err);

        // Resilient Fallback Lookup
        const cachedMemories = cacheManager.getFromCache(CACHE_KEYS.MEMORIES, true) || fallbackMemories;
        const matchedMemory = cachedMemories.find(
          m => String(m.id) === String(idOrSlug) || m.slug === idOrSlug
        );

        if (matchedMemory) {
          console.log(`[Resilience] Successfully resolved memory detail offline for: ${idOrSlug}`);
          setMemory(matchedMemory);
        } else {
          console.error(`[Resilience] Memory not found in fallback dataset: ${idOrSlug}`);
          navigate('/memories');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchMemory();
  }, [idOrSlug, navigate]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: memory.title,
        text: memory.image_description || `A memorable moment from Prem Prasad Pradhan's portfolio: ${memory.title}`,
        url: window.location.href,
      }).catch(err => console.log('Error sharing:', err));
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const imageSchema = memory ? {
    "@context": "https://schema.org",
    "@type": "ImageObject",
    "contentUrl": memory.image_url.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL}${memory.image_url}` : memory.image_url,
    "name": memory.title,
    "description": memory.image_description || memory.title,
    "uploadDate": memory.upload_date,
    "author": {
      "@type": "Person",
      "name": "Prem Prasad Pradhan"
    }
  } : undefined;

  return (
    <div className="portfolio-page">
      <SEO 
        title={memory ? `${memory.title} | Memories` : "Memorable Moment"}
        description={memory?.image_description || "Explore this memorable moment captured by Prem Prasad Pradhan."}
        image={memory ? (memory.image_url.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL}${memory.image_url}` : memory.image_url) : null}
        url={memory ? `memory/${memory.slug || memory.id}` : `memory/${idOrSlug}`}
        type="article"
        schema={imageSchema}
      />
      <Navbar />
      <main className="main-content">
        {loading ? (
          <div className="cert-detail-loading">
            <div className="spinner"></div>
            <p>Capturing the moment...</p>
          </div>
        ) : !memory ? (
          <div className="cert-detail-error">
            <p>Memory not found.</p>
          </div>
        ) : (
          <div className="cert-detail-page section">
            <div className="container">
              <div className="section-header-flex mb-4">
                <button className="btn btn-outline back-btn" onClick={() => navigate('/memories')}>
                  <FaArrowLeft /> Back to Memories
                </button>
                <button className="btn btn-primary share-btn" onClick={handleShare}>
                  <FaShareAlt /> Share Memory
                </button>
              </div>
              
              <motion.div 
                className="cert-detail-container glass-panel"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="cert-detail-image-wrapper memory-detail-image-wrapper">
                  <img 
                    src={optimizeCloudinaryUrl(memory.image_url, 1200)} 
                    alt={memory.image_alt || memory.title} 
                    className="cert-detail-img memory-detail-img" 
                  />
                </div>
                
                <div className="cert-detail-info">
                  <h1 className="cert-detail-title gradient-text">{memory.title}</h1>
                  <div className="cert-detail-meta">
                    <span className="cert-detail-date">
                      {new Date(memory.upload_date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                  {memory.image_description && (
                    <div className="cert-detail-desc">
                      {memory.image_description.split('\n').map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default MemoryDetail;
