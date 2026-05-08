import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { FaExternalLinkAlt, FaGithub, FaFilePowerpoint } from 'react-icons/fa';
import './ProjectDetail.css';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${id}`);
        if (!res.ok) {
          navigate('/');
          return;
        }
        const data = await res.json();
        setProject(data);
      } catch (err) {
        console.error('Error fetching project:', err);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="portfolio-page">
        <Navbar />
        <main className="main-content">
          <div className="proj-detail-loading">
            <div className="spinner"></div>
            <p>Loading project details...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!project) return null;

      <SEO 
        title={`${project.title} | Projects`}
        description={project.description.substring(0, 160)}
        keywords={`${project.tags}, AI projects, full stack projects, React portfolio projects`}
        url={`project/${id}`}
      />
      <Navbar />
      <main className="main-content">
        <div className="proj-detail-page section">
          <div className="container">
            <button className="btn btn-outline back-btn" onClick={() => navigate(-1)}>
              &larr; Back to Portfolio
            </button>
            
            <div className="proj-detail-container glass-panel">
              <div className="proj-detail-info">
                <h1 className="proj-detail-title gradient-text">{project.title}</h1>
                
                <div className="proj-detail-tags">
                  {project.tags.split(',').map((tag, i) => (
                    <span key={i} className="tag">{tag.trim()}</span>
                  ))}
                </div>

                <div className="proj-detail-links">
                  {project.github && (
                    <a href={project.github} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
                      <FaGithub /> GitHub Repository
                    </a>
                  )}
                  {project.link && (
                    <a href={project.link} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">
                      <FaExternalLinkAlt /> Live Project
                    </a>
                  )}
                  {project.pptLink && (
                    <a href={project.pptLink} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm" style={{borderColor: '#ff5722', color: '#ff5722'}}>
                      <FaFilePowerpoint /> View PPT
                    </a>
                  )}
                </div>

                <div className="proj-detail-desc">
                  {project.description.split('\n').map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProjectDetail;
