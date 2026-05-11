import React, { useState, useEffect } from 'react';
import SEO from '../components/SEO';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { FaEye, FaShareAlt, FaDownload } from 'react-icons/fa';
import { optimizeCloudinaryUrl } from '../utils/cloudinary';
import { downloadImage } from '../utils/download';
import '../components/MemorableImages.css'; // Reuse CSS

const MemoriesPage = () => {
  const [images, setImages] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/memorable-images`)
      .then(res => res.json())
      .then(data => setImages(data))
      .catch(err => console.error('Error fetching memories:', err));
  }, []);

  const gallerySchema = {
    "@context": "http://schema.org",
    "@type": "ImageGallery",
    "name": "Memorable Moments of Prem Prasad Pradhan",
    "description": "A collection of beautiful memories captured in time by Prem Prasad Pradhan.",
    "url": "https://mrprem.in/memories",
    "image": images.map(img => img.image_url)
  };

  return (
    <div className="portfolio-page">
      <SEO 
        title="Memories | Prem Prasad Pradhan Portfolio"
        description="Explore memorable moments, achievements, experiences, and personal highlights from the journey of Prem Prasad Pradhan (MR.PREM)."
        url="memories"
        schema={gallerySchema}
      />
      <Navbar />
      <main className="main-content">
        <section className="section memories-page-section" style={{ paddingTop: '120px' }}>
          <div className="container">
            <button className="btn btn-outline back-btn" onClick={() => navigate('/')} style={{ marginBottom: '2rem' }}>
              &larr; Back to Portfolio
            </button>
            <motion.h1 
              className="section-title gradient-text text-center"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              All Memorable Moments
            </motion.h1>
            <p className="text-center text-muted mb-5">A collection of beautiful memories captured in time.</p>

            <div className="memories-grid full-grid">
              {images.map((img, index) => (
                <motion.div 
                  key={img.id}
                  className={`memory-card glass-panel ${img.aspect_ratio}`}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  onClick={() => navigate(`/memory/${img.slug || img.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="memory-image-container">
                    <img 
                      src={optimizeCloudinaryUrl(img.image_url, 1200)} 
                      alt={img.image_alt || `Prem Prasad Pradhan Memory: ${img.title} - ${img.image_description || ''}`} 
                      className="memory-img" 
                      loading="lazy"
                    />
                    
                    {/* Top Right Share Icon */}
                    <div className="top-share-icon" onClick={(e) => {
                      e.stopPropagation();
                      if (navigator.share) {
                        navigator.share({ title: img.title, url: `${window.location.origin}/memory/${img.slug || img.id}` });
                      } else {
                        navigator.clipboard.writeText(`${window.location.origin}/memory/${img.slug || img.id}`);
                        alert('Link copied!');
                      }
                    }}>
                      <FaShareAlt />
                    </div>

                    <div className="memory-overlay">
                      <div className="card-actions">
                        <div className="action-icon" title="View Detail" onClick={() => navigate(`/memory/${img.slug || img.id}`)}>
                          <FaEye />
                        </div>
                        <div className="action-icon" title="Share" onClick={(e) => {
                          e.stopPropagation();
                          if (navigator.share) {
                            navigator.share({ title: img.title, url: `${window.location.origin}/memory/${img.slug || img.id}` });
                          } else {
                            navigator.clipboard.writeText(`${window.location.origin}/memory/${img.slug || img.id}`);
                            alert('Link copied!');
                          }
                        }}>
                          <FaShareAlt />
                        </div>
                        <div className="action-icon" title="Download" onClick={(e) => {
                          e.stopPropagation();
                          downloadImage(img.image_url, `${img.title}.jpg`);
                        }}>
                          <FaDownload />
                        </div>
                      </div>
                      <h3 className="memory-title">{img.title}</h3>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            
            {images.length === 0 && (
              <p className="text-center text-muted mt-5">No memories shared yet.</p>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default MemoriesPage;
