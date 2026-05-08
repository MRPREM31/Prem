import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaExternalLinkAlt, FaGithub } from 'react-icons/fa';
import { optimizeCloudinaryUrl } from '../utils/cloudinary';
import './Projects.css';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/projects?t=${Date.now()}`)
      .then(res => res.json())
      .then(data => setProjects(data))
      .catch(err => console.error('Error fetching projects:', err));
  }, []);
  return (
    <section id="projects" className="section projects-section">
      <div className="container">
        <motion.h2 
          className="section-title gradient-text"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          Featured Projects
        </motion.h2>

        <div className="projects-grid">
          {projects.length > 0 ? projects.map((project, index) => (
            <motion.div 
              key={project.id} 
              className="project-card glass-panel"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              onClick={() => { 
                navigate(`/project/${project.id}`, { 
                  state: { fromPortfolio: true, scrollY: window.scrollY, section: 'projects' } 
                }); 
              }}
              style={{ cursor: 'pointer' }}
            >
              <div className="project-content">
                <h3>{project.title}</h3>
                <div className="project-image-preview">
                  <img 
                    src={optimizeCloudinaryUrl(project.link ? `https://image.thum.io/get/width/600/crop/800/${project.link}` : '/assets/hero.png', 600)} 
                    alt={project.image_alt || `${project.title} - ${project.description.substring(0, 50)} by Prem Prasad Pradhan`}
                    loading="lazy"
                    className="proj-thumb"
                  />
                </div>
                <p>
                  {project.image_description || (project.description.length > 100 
                    ? `${project.description.substring(0, 100)}...` 
                    : project.description)}
                </p>
                <div className="project-tags">
                  {project.tags.split(',').map((tag, i) => (
                    <span key={i} className="tag">{tag.trim()}</span>
                  ))}
                </div>
              </div>
              <div className="project-links">
                <button className="btn btn-outline btn-sm" onClick={(e) => { 
                  e.stopPropagation(); 
                  navigate(`/project/${project.id}`, { 
                    state: { fromPortfolio: true, scrollY: window.scrollY, section: 'projects' } 
                  }); 
                }}>
                  See full detail
                </button>
              </div>
            </motion.div>
          )) : (
            <p className="text-center w-full" style={{ gridColumn: '1 / -1' }}>No projects found. Add some from the Admin Dashboard!</p>
          )}
        </div>
      </div>
    </section>
  );
};

export default Projects;
