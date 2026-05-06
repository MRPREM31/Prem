import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import '../components/MemorableImages.css'; // Reuse CSS

const MemoriesPage = () => {
  const [images, setImages] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
    fetch(`${import.meta.env.VITE_API_URL}/api/memorable-images`)
      .then(res => res.json())
      .then(data => setImages(data))
      .catch(err => console.error('Error fetching memories:', err));
  }, []);

  return (
    <div className="portfolio-page">
      <Navbar />
      <main className="main-content">
        <section className="section memories-page-section" style={{ paddingTop: '120px' }}>
          <div className="container">
            <button className="btn btn-outline back-btn" onClick={() => navigate(-1)} style={{ marginBottom: '2rem' }}>
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
                >
                  <div className="memory-image-container">
                    <img src={img.image_url} alt={img.title} className="memory-img" />
                    <div className="memory-overlay">
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
