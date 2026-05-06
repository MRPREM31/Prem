import React from 'react';
import { motion } from 'framer-motion';
import './Experience.css';

const experiences = [
  {
    title: 'Founder',
    company: 'QuantumCoders Tech Lab & Data Solutions',
    date: 'Present',
    description: 'Built a startup ecosystem focusing on AI and data services. Led teams and managed clients globally to deliver impactful tech solutions.',
  },
  {
    title: 'Team Lead',
    company: 'DesiCrew',
    date: 'Present',
    description: 'Managed AI data projects and led a remote team. Ensured quality control, detailed reporting, and timely project delivery.',
  }
];

const Experience = () => {
  return (
    <section id="experience" className="section experience-section">
      <div className="container">
        <motion.h2
          className="section-title gradient-text"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          Experience
        </motion.h2>

        <div className="timeline">
          {experiences.map((exp, index) => (
            <motion.div
              key={index}
              className="timeline-item"
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
            >
              <div className="timeline-dot"></div>
              <div className="timeline-content glass-panel">
                <span className="timeline-date">{exp.date}</span>
                <h3>{exp.title}</h3>
                <h4>{exp.company}</h4>
                <p>{exp.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Experience;
