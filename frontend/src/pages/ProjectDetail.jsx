import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { FaExternalLinkAlt, FaGithub, FaFilePowerpoint, FaStar, FaRegStar, FaTimes, FaCommentDots } from 'react-icons/fa';
import SEO from '../components/SEO';
import './ProjectDetail.css';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Review States
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({ name: '', email: '', message: '', rating: 0 });
  const [hoverRating, setHoverRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const fetchProject = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${id}?t=${Date.now()}`);
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

  useEffect(() => {
    fetchProject();
  }, [id, navigate]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (reviewForm.rating === 0) return alert('Please select a star rating');
    
    setSubmitting(true);
    let deviceId = localStorage.getItem('prem_portfolio_device_id');
    if (!deviceId) {
      deviceId = 'dev_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('prem_portfolio_device_id', deviceId);
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...reviewForm, device_id: deviceId })
      });
      
      if (res.ok) {
        setReviewSuccess(true);
        setTimeout(() => {
          setShowReviewModal(false);
          setReviewSuccess(false);
          setReviewForm({ name: '', email: '', message: '', rating: 0 });
          fetchProject(); // Refresh to show new review
        }, 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

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

  return (
    <div className="portfolio-page">
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
                <div className="proj-header-row">
                  <h1 className="proj-detail-title gradient-text">{project.title}</h1>
                  {project.avgRating > 0 && (
                    <div className="proj-avg-rating">
                      <FaStar className="star-filled" />
                      <span>{project.avgRating} / 5.0</span>
                    </div>
                  )}
                </div>
                
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
                  <button className="btn btn-outline btn-sm review-trigger-btn" onClick={() => setShowReviewModal(true)}>
                    <FaCommentDots /> Give Review
                  </button>
                </div>

                <div className="proj-detail-desc">
                  {project.description.split('\n').map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>

                {project.images && project.images.length > 0 && (
                  <div className="proj-detail-gallery">
                    <h3 className="gallery-title">Project Gallery</h3>
                    <div className="proj-gallery-grid">
                      {project.images.map((img, idx) => (
                        <div key={img.id} className="proj-gallery-item" title={img.alt_text}>
                          <img src={img.image_url} alt={img.alt_text} loading="lazy" />
                          <div className="img-badge">Image {idx + 1}</div>
                          <div className="img-hover-info">{img.alt_text}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* REVIEW SECTION */}
                <div className="proj-detail-reviews">
                  <h3 className="gallery-title">User Reviews</h3>
                  <div className="reviews-list">
                    {project.reviews && project.reviews.filter(r => r.name || r.message).length > 0 ? (
                      project.reviews.filter(r => r.name || r.message).map(rev => (
                        <div key={rev.id} className="review-card glass-panel">
                          <div className="review-header">
                            <span className="reviewer-name">{rev.name || 'Anonymous User'}</span>
                            <div className="review-stars">
                              {[...Array(5)].map((_, i) => (
                                i < rev.rating ? <FaStar key={i} className="star-filled" /> : <FaRegStar key={i} className="star-empty" />
                              ))}
                            </div>
                          </div>
                          {rev.message && <p className="review-msg">{rev.message}</p>}
                          <span className="review-date">{new Date(rev.created_at).toLocaleDateString()}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted">No detailed reviews yet. Be the first to leave one!</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* LIQUID GLASS REVIEW MODAL */}
      {showReviewModal && (
        <div className="liquid-modal-overlay">
          <div className="liquid-glass-modal glass-panel">
            {reviewSuccess ? (
              <div className="review-success-msg">
                <div className="success-icon">✨</div>
                <h2>Success!</h2>
                <p>Thanks for rating <strong>{project.title}</strong> with <strong>{reviewForm.rating} stars</strong>!</p>
              </div>
            ) : (
              <>
                <div className="modal-header">
                  <h3>Rate this Project</h3>
                  <button className="close-btn" onClick={() => setShowReviewModal(false)}><FaTimes /></button>
                </div>
                <form className="liquid-form" onSubmit={handleReviewSubmit}>
                  <div className="star-selector mb-4">
                    <label>Your Rating *</label>
                    <div className="stars-row">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <span 
                          key={num} 
                          className={`star-input ${(hoverRating || reviewForm.rating) >= num ? 'active' : ''}`}
                          onMouseEnter={() => setHoverRating(num)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setReviewForm({...reviewForm, rating: num})}
                        >
                          <FaStar />
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="form-group mb-3">
                    <input 
                      type="text" 
                      placeholder="Your Name (Optional)" 
                      value={reviewForm.name} 
                      onChange={e => setReviewForm({...reviewForm, name: e.target.value})} 
                      className="liquid-input" 
                    />
                  </div>
                  <div className="form-group mb-3">
                    <input 
                      type="email" 
                      placeholder="Email Address (Optional)" 
                      value={reviewForm.email} 
                      onChange={e => setReviewForm({...reviewForm, email: e.target.value})} 
                      className="liquid-input" 
                    />
                  </div>
                  <div className="form-group mb-4">
                    <textarea 
                      placeholder="Write your review message... (Optional)" 
                      value={reviewForm.message} 
                      onChange={e => setReviewForm({...reviewForm, message: e.target.value})} 
                      className="liquid-input" 
                      rows="3"
                    ></textarea>
                  </div>
                  <button type="submit" className="btn btn-primary w-100" disabled={submitting || reviewForm.rating === 0}>
                    {submitting ? 'Posting...' : 'Post Review'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default ProjectDetail;
