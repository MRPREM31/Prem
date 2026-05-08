import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './MemorableImages.css';

const MemorableImages = () => {
  const [images, setImages] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/memorable-images`)
      .then(res => res.json())
      .then(data => setImages(data.slice(0, 4))) // Show only top 4
      .catch(err => console.error('Error fetching memories:', err));
  }, []);

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
                  src={img.image_url} 
                  alt={`Prem Prasad Pradhan Memory: ${img.title}`} 
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
            navigate('/memories', { 
              state: { fromPortfolio: true, scrollY: window.scrollY, section: 'memories' } 
            }); 
          }}>
            See All Memories
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default MemorableImages;
