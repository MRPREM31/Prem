import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import './About.css';

const About = () => {
  const [stats, setStats] = useState({
    years_exp: '2+',
    projects_completed: '10+',
    startups_leadership: '2'
  });

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/stats`)
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error('Error fetching stats:', err));
  }, []);

  return (
    <section id="about" className="section about-section">
      <div className="container">
        <motion.h2 
          className="section-title gradient-text"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          About Me
        </motion.h2>

        <div className="about-content">
          <motion.div 
            className="about-text glass-panel"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <p>
              <strong>Prem Prasad Pradhan</strong> is a passionate B.Tech student at NIST University, Berhampur, with a strong focus on software development, AI, and startup innovation. He is known for building real-world projects, leading teams, and delivering impactful solutions.
            </p>
            <p>
              As the founder of QuantumCoders, he combines technical expertise with leadership to create scalable and meaningful technology solutions. His journey is driven by a deep curiosity for how things work and a desire to build products that make a difference.
            </p>
          </motion.div>
          
          <motion.div 
            className="about-stats"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="stat-card glass-panel">
              <h3>{stats.years_exp}</h3>
              <p>Years Experience</p>
            </div>
            <div className="stat-card glass-panel">
              <h3>{stats.projects_completed}</h3>
              <p>Projects Completed</p>
            </div>
            <div className="stat-card glass-panel">
              <h3>{stats.startups_leadership}</h3>
              <p>Startups / Leadership</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default About;
