import React from 'react';
import { motion } from 'framer-motion';
import { 
  FaCode, FaLaptopCode, FaTools, FaDatabase,
  FaPython, FaJs, FaHtml5, FaCss3Alt, FaReact, FaNodeJs, FaFlask, FaPlug,
  FaGithub, FaMobileAlt, FaPaintBrush, FaBrain, FaFileCode
} from 'react-icons/fa';
import { SiC, SiCplusplus } from 'react-icons/si';
import './Skills.css';

const skillCategories = [
  {
    title: 'Languages',
    icon: <FaCode />,
    skills: [
      { name: 'C', icon: <SiC /> },
      { name: 'C++', icon: <SiCplusplus /> },
      { name: 'Python', icon: <FaPython /> },
      { name: 'JavaScript', icon: <FaJs /> }
    ]
  },
  {
    title: 'Technologies',
    icon: <FaLaptopCode />,
    skills: [
      { name: 'HTML', icon: <FaHtml5 /> },
      { name: 'CSS', icon: <FaCss3Alt /> },
      { name: 'React', icon: <FaReact /> },
      { name: 'Node.js', icon: <FaNodeJs /> },
      { name: 'Flask', icon: <FaFlask /> },
      { name: 'APIs', icon: <FaPlug /> }
    ]
  },
  {
    title: 'Tools',
    icon: <FaTools />,
    skills: [
      { name: 'GitHub', icon: <FaGithub /> },
      { name: 'Android Studio', icon: <FaMobileAlt /> },
      { name: 'Google Apps Script', icon: <FaFileCode /> }
    ]
  },
  {
    title: 'Other',
    icon: <FaDatabase />,
    skills: [
      { name: 'DBMS', icon: <FaDatabase /> },
      { name: 'Canva (Design)', icon: <FaPaintBrush /> },
      { name: 'AI/Data Annotation', icon: <FaBrain /> }
    ]
  }
];

const Skills = () => {
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
                {category.icon}
              </div>
              <h3>{category.title}</h3>
              <ul className="skill-list">
                {category.skills.map((skill, i) => (
                  <li key={i}>
                    <span className="item-icon">{skill.icon}</span> {skill.name}
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
