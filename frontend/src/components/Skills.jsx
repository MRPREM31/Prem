import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import * as FaIcons from 'react-icons/fa';
import * as SiIcons from 'react-icons/si';
import './Skills.css';

const IconRenderer = ({ iconName }) => {
  const IconComponent = FaIcons[iconName] || SiIcons[iconName];
  return IconComponent ? <IconComponent /> : <FaIcons.FaCode />;
};

const Skills = () => {
  const [skillCategories, setSkillCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/skills`);
        const data = await res.json();
        setSkillCategories(data);
      } catch (err) {
        console.error('Error fetching skills:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSkills();
  }, []);

  if (loading) return null;

  return (
    <section id="skills" className="section skills-section">
      <div className="container">
        <motion.h2 
          className="section-title gradient-text"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          My Skills
        </motion.h2>

        <div className="skills-grid">
          {skillCategories.map((category, index) => (
            <motion.div 
              key={index} 
              className="skill-card glass-panel"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <div className="skill-icon">
                <IconRenderer iconName={category.icon} />
              </div>
              <h3>{category.title}</h3>
              <ul className="skill-list">
                {category.skills.map((skill, i) => (
                  <li key={i}>
                    <span className="item-icon">
                      <IconRenderer iconName={skill.icon} />
                    </span> {skill.name}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Skills;
