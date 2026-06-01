import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaExternalLinkAlt, FaGithub, FaStar } from 'react-icons/fa';
import './Projects.css';
import useFetch from '../hooks/useFetch';
import fallbackProjects from '../data/fallbackProjects';

const Projects = () => {
  const navigate = useNavigate();
  const { data: projects = [] } = useFetch('/api/projects', fallbackProjects);

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
          {projects.length > 0 ? projects.slice(0, 6).map((project, index) => (
            <motion.div 
              key={project.id} 
              className="project-card glass-panel"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              onClick={() => { 
                navigate(`/project/${project.slug || project.id}`, { 
                  state: { fromPortfolio: true, scrollY: window.scrollY, section: 'projects' } 
                }); 
              }}
              style={{ cursor: 'pointer' }}
            >
              <div className="project-content">
                <div className="project-header-flex">
                  <h3>{project.title}</h3>
                  {project.avgRating > 0 && (
                    <div className="project-rating-badge">
                      <FaStar className="star-icon" />
                      <span>{project.avgRating}</span>
                    </div>
                  )}
                </div>

                <p className="project-description">
                  {project.image_description || project.description}
                </p>
                <div className="project-tags">
                  {(project.tags || '').split(',').filter(Boolean).map((tag, i) => (
                    <span key={i} className="tag">{tag.trim()}</span>
                  ))}
                </div>
              </div>
              <div className="project-links">
                <button className="btn btn-outline btn-sm">
                  See full detail
                </button>
              </div>
            </motion.div>
          )) : (
            <p className="text-center w-full" style={{ gridColumn: '1 / -1' }}>No projects found. Add some from the Admin Dashboard!</p>
          )}
        </div>

        {projects.length > 6 && (
          <div className="view-all-container">
            <motion.button 
              className="btn btn-primary view-all-btn"
              onClick={() => navigate('/all-projects', { state: { scrollY: window.scrollY, section: 'projects' } })}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              See All Projects ({projects.length})
            </motion.button>
          </div>
        )}
      </div>
    </section>
  );
};

export default Projects;
