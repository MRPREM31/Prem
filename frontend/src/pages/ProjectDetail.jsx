import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FaGithub, FaExternalLinkAlt, FaFilePdf, FaChevronLeft, FaStar, FaRegStar, FaShareAlt, FaWhatsapp, FaLinkedin, FaTwitter, FaFilePowerpoint, FaTimes, FaCommentDots, FaInfoCircle } from 'react-icons/fa';
import { Helmet } from 'react-helmet-async';
import {
  WhatsappShareButton,
  LinkedinShareButton,
  TwitterShareButton,
  WhatsappIcon,
  LinkedinIcon,
  TwitterIcon
} from 'react-share';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import './ProjectDetail.css';
import cacheManager from '../utils/cacheManager';
import CACHE_KEYS from '../utils/cacheKeys';
import fallbackProjects from '../data/fallbackProjects';

const ProjectDetail = () => {
  const { idOrSlug } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Review States
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({ name: '', email: '', message: '', rating: 0 });
  const [hoverRating, setHoverRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [showPrivacyInfo, setShowPrivacyInfo] = useState(false);

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/projects/${idOrSlug}?t=${Date.now()}`);
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }
      const data = await res.json();
      setProject(data);
    } catch (err) {
      console.warn('Error fetching project detail, trying resilient fallbacks:', err);
      
      // Resilient Fallback Lookup
      const cachedProjects = cacheManager.getFromCache(CACHE_KEYS.PROJECTS, true) || fallbackProjects;
      const matchedProject = cachedProjects.find(
        p => String(p.id) === String(idOrSlug) || p.slug === idOrSlug
      );

      if (matchedProject) {
        console.log(`[Resilience] Successfully resolved project detail offline for: ${idOrSlug}`);
        
        // Ensure images and reviews arrays exist to prevent template crashes
        const resolvedProject = {
          ...matchedProject,
          images: matchedProject.images || [],
          reviews: matchedProject.reviews || [],
          avgRating: matchedProject.avgRating || '0.0'
        };
        setProject(resolvedProject);
      } else {
        console.error(`[Resilience] Project not found in fallback dataset: ${idOrSlug}`);
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [idOrSlug, navigate]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (reviewForm.rating === 0) return alert('Please select a star rating');
    if (!reviewForm.name.trim()) return alert('Please enter your name');
    
    setSubmitting(true);
    let deviceId = localStorage.getItem('prem_portfolio_device_id');
    if (!deviceId) {
      deviceId = 'dev_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('prem_portfolio_device_id', deviceId);
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${project.id}/reviews`, {
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

  const shareUrl = window.location.href;
  const projectTitle = project.title;

  return (
    <div className="portfolio-page">
      <Helmet>
        <title>{project.title} | Prem Prasad Pradhan</title>
        <meta name="description" content={project.image_description || (project.description || '').substring(0, 160)} />
        <meta property="og:title" content={project.title} />
        <meta property="og:description" content={project.image_description || (project.description || '').substring(0, 160)} />
        <meta property="og:image" content={project.images?.[0]?.image_url || '/og-image.jpg'} />
        <meta property="og:url" content={window.location.href} />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": project.title,
            "description": project.image_description || (project.description || '').substring(0, 160),
            "applicationCategory": "DeveloperApplication",
            "operatingSystem": "Web",
            "author": {
              "@type": "Person",
              "name": "Prem Prasad Pradhan"
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": project.avgRating || "0.0",
              "reviewCount": project.reviews?.length || "1"
            }
          })}
        </script>
      </Helmet>
       <SEO 
        title={`${project.title} | Projects`}
        description={(project.description || '').substring(0, 160)}
        keywords={`${project.tags || ''}, AI projects, full stack projects, React portfolio projects`}
        url={`project/${project.slug || project.id}`}
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
                </div>

                <div className="proj-detail-tags">
                  {(project.tags || '').split(',').filter(Boolean).map((tag, i) => (
                    <span key={i} className="tag">{tag.trim()}</span>
                  ))}
                </div>

                <div className="proj-detail-links">
                  {project.avgRating > 0 && (
                    <div 
                      className="proj-avg-rating-inline" 
                      style={{ cursor: 'pointer' }}
                      onClick={() => setShowReviewModal(true)}
                      title="Click to rate this project"
                    >
                      <FaStar className="star-filled" />
                      <span>{project.avgRating} / 5.0</span>
                    </div>
                  )}
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
                  <Link 
                    to={`/review/${idOrSlug}`} 
                    className="btn btn-outline btn-sm review-trigger-btn" 
                    onClick={(e) => { 
                      e.preventDefault(); 
                      setShowReviewModal(true); 
                    }}
                  >
                    <FaCommentDots /> Give Review
                  </Link>
                </div>

                <div className="proj-detail-desc">
                  {(project.description || '').split('\n').map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>

                {project.images && project.images.length > 0 && (
                  <div className="proj-detail-gallery">
                    <h3 className="gallery-title">Project Gallery</h3>
                    <div className="proj-gallery-grid">
                      {project.images.map((img, idx) => (
                        <div key={img.id} className="proj-gallery-item" title={img.alt_text}>
                          <img src={img.image_url && typeof img.image_url === 'string' && img.image_url.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL}${img.image_url}` : (img.image_url || '')} alt={img.alt_text} loading="lazy" />
                          <div className="img-badge">Image {idx + 1}</div>
                          <div className="img-hover-info">{img.alt_text}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SHARE BAR */}
                <div className="proj-share-bar mb-4">
                  <span className="share-label"><FaShareAlt /> Share Project:</span>
                  <div className="share-buttons">
                    <WhatsappShareButton url={window.location.href} title={project.title}>
                      <WhatsappIcon size={32} round />
                    </WhatsappShareButton>
                    <LinkedinShareButton url={window.location.href} title={project.title}>
                      <LinkedinIcon size={32} round />
                    </LinkedinShareButton>
                    <TwitterShareButton url={window.location.href} title={project.title}>
                      <TwitterIcon size={32} round />
                    </TwitterShareButton>
                  </div>
                </div>

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
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h3 className="gradient-text">Rate & Review</h3>
                      <button 
                        type="button" 
                        className="info-toggle-btn" 
                        onClick={() => setShowPrivacyInfo(!showPrivacyInfo)}
                        title="Privacy Information"
                      >
                        <FaInfoCircle />
                      </button>
                    </div>
                    <p style={{fontSize: '0.85rem', opacity: 0.8, color: 'var(--text-muted)'}}>How was your experience with <strong>{project.title}</strong>?</p>
                  </div>
                  <button className="close-btn" onClick={() => setShowReviewModal(false)}><FaTimes /></button>
                </div>

                {showPrivacyInfo && (
                  <div className="review-privacy-notice mb-4">
                    <p>By posting, you agree that your name and review will be publicly visible on <strong>mrprem.in</strong> to showcase project feedback.</p>
                  </div>
                )}
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
                      placeholder="Your Name *" 
                      required
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
