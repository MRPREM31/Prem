import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaArrowLeft } from 'react-icons/fa';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import '../components/Projects.css';

const AllProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { scrollY, section } = location.state || {};

  useEffect(() => {
    window.scrollTo(0, 0);
    fetch(`${import.meta.env.VITE_API_URL}/api/projects?t=${Date.now()}`)
      .then(res => res.json())
      .then(data => {
        setProjects(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching projects:', err);
        setLoading(false);
      });
  }, []);

  const itemListSchema = projects.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "All Projects by Prem Prasad Pradhan",
    "description": "A comprehensive list of software development and AI projects built by Prem Prasad Pradhan.",
    "itemListElement": projects.map((p, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "url": `https://mrprem.in/project/${p.slug || p.id}`,
      "name": p.title
    }))
  } : undefined;

  return (
    <div className="portfolio-page">
      <SEO 
        title="All Projects | Prem Prasad Pradhan"
        description={`Browse all ${projects.length} professional projects by Prem Prasad Pradhan.`}
        schema={itemListSchema}
        url="all-projects"
      />
      <Navbar />
      <main className="main-content">
        <section className="section projects-section" style={{ paddingTop: '120px' }}>
          <div className="container">
            <div className="section-header-flex">
              <div>
                <button className="btn btn-outline btn-sm mb-3" onClick={() => navigate('/', { state: { fromPortfolio: true, section: section || 'projects', scrollY } })}>
                  <FaArrowLeft /> Back to Portfolio
                </button>
                <h1 className="section-title gradient-text">All Projects ({projects.length})</h1>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-5">
                <div className="spinner"></div>
                <p>Loading projects...</p>
              </div>
            ) : (
              <div className="projects-grid">
                {projects.map((project, index) => (
                  <motion.div 
                    key={project.id} 
                    className="project-card glass-panel"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: (index % 6) * 0.1 }}
                    onClick={() => navigate(`/project/${project.slug || project.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="project-content">
                      <h3>{project.title}</h3>
                      <p>
                        {project.image_description || (project.description.length > 120 
                          ? `${project.description.substring(0, 120)}...` 
                          : project.description)}
                      </p>
                      <div className="project-tags">
                        {project.tags.split(',').map((tag, i) => (
                          <span key={i} className="tag">{tag.trim()}</span>
                        ))}
                      </div>
                    </div>
                    <div className="project-links">
                      <button className="btn btn-outline btn-sm">See full detail</button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default AllProjects;
