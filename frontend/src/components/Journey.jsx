import React from 'react';
import { motion } from 'framer-motion';
import './Journey.css';

const journeySteps = [
  { year: '2006', event: 'Born' },
  { year: 'Schooling', event: 'Completed early education with a curiosity for science and technology.' },
  { year: '+2 Education', event: 'Focused on science, building a strong foundation for engineering.' },
  { year: '2023 - Present', event: 'B.Tech Student at NIST University, Berhampur. Building startups and software.' }
];

const Journey = () => {
  return (
    <section id="journey" className="section journey-section">
      <div className="container">
        <motion.h2 
          className="section-title gradient-text"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          My Journey
        </motion.h2>

        <div className="journey-timeline">
          {journeySteps.map((step, index) => (
            <motion.div 
              key={index} 
              className="journey-step"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
            >
              <div className="journey-year">{step.year}</div>
              <div className="journey-node"></div>
              <div className="journey-event glass-panel">
                <p>{step.event}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Journey;
