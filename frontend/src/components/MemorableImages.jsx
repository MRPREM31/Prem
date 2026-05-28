import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { optimizeCloudinaryUrl } from '../utils/cloudinary';
import './MemorableImages.css';
import { useResilientData } from '../utils/fetchWithFallback';
import CACHE_KEYS from '../utils/cacheKeys';
import fallbackMemories from '../data/fallbackMemories';

const MemorableImages = () => {
  const navigate = useNavigate();

  const { data: images = [] } = useResilientData(
    `/api/memorable-images`,
    CACHE_KEYS.MEMORIES,
    fallbackMemories,
    { transform: (data) => data.slice(0, 4) }
  );

  if (images.length === 0) return null;


  return (
    <section id="memories" className="section memories-section">
      <div className="container">
        <motion.h2 
          className="section-title gradient-text"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          Memorable Moments
        </motion.h2>

        <div className="memories-grid">
          {images.map((img, index) => (
            <motion.div 
              key={img.id}
              className={`memory-card glass-panel ${img.aspect_ratio}`}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="memory-image-container">
                <img 
                  src={optimizeCloudinaryUrl(img.image_url, 800)} 
                  alt={img.image_alt || `Prem Prasad Pradhan Memory: ${img.title} - ${img.image_description || ''}`} 
                  className="memory-img" 
                  loading="lazy"
                />
                <div className="memory-overlay">
                  <h3 className="memory-title">{img.title}</h3>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div 
          className="memories-footer"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <button className="btn btn-primary see-all-btn" onClick={() => { 
            navigate('/memories', { state: { scrollY: window.scrollY, section: 'memories' } }); 
          }}>
            See All Memories
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default MemorableImages;
