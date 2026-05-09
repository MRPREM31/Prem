import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaStar, FaRegStar, FaChevronLeft, FaCheckCircle } from 'react-icons/fa';
import { Helmet } from 'react-helmet-async';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './ProjectDetail.css'; // Reuse glass styles

const ReviewPage = () => {
  const { slug } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    name: '',
    email: '',
    message: '',
    rating: 0
  });

  useEffect(() => {
    fetchProject();
  }, [slug]);

  const fetchProject = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${slug}`);
      const data = await res.json();
      if (res.ok) setProject(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

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
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${project.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...reviewForm, device_id: deviceId })
      });
      if (res.ok) {
        setSubmitted(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="proj-detail-loading">Initializing Review Module...</div>;
  if (!project) return <div className="proj-detail-loading">Project not found.</div>;

  return (
    <div className="proj-detail-page">
      <Helmet>
        <title>Review: {project.title} | Prem Prasad Pradhan</title>
        <meta name="description" content={`Leave a review for ${project.title}. Your feedback helps me improve.`} />
        <meta property="og:title" content={`Give a Review for ${project.title}`} />
        <meta property="og:description" content={`Rate your experience with ${project.title} on Prem's Portfolio.`} />
        <meta property="og:image" content={project.images?.[0]?.image_url || '/og-image.jpg'} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Review",
            "itemReviewed": {
              "@type": "SoftwareApplication",
              "name": project.title
            },
            "author": {
              "@type": "Person",
              "name": "User"
            }
          })}
        </script>
      </Helmet>

      <Navbar />
      <div className="container" style={{ paddingTop: '100px' }}>
        <Link to={`/project/${slug}`} className="btn btn-outline btn-sm back-btn">
          <FaChevronLeft /> Back to Project
        </Link>

        <div className="liquid-glass-modal" style={{ margin: '2rem auto', animation: 'none', position: 'static' }}>
          {submitted ? (
            <div className="review-success-msg text-center p-5">
              <div className="success-icon mb-4"><FaCheckCircle style={{color: '#10b981', fontSize: '4rem'}} /></div>
              <h2 className="gradient-text mb-3">Thank You!</h2>
              <p className="mb-4">Your rating for <strong>{project.title}</strong> has been posted successfully.</p>
              <div className="mt-4">
                <Link to="/" className="btn btn-primary">Go to Home</Link>
              </div>
            </div>
          ) : (
            <>
              <div className="review-project-hero">
                <div className="rev-proj-img">
                  <img src={project.images?.[0]?.image_url || '/placeholder-project.jpg'} alt={project.title} />
                </div>
                <div className="rev-proj-info">
                  <h3 className="gradient-text">{project.title}</h3>
                  <div className="rev-stats">
                    <span className="rev-avg"><FaStar /> {project.avgRating}</span>
                    <span className="rev-count">{project.reviews?.length || 0} Reviews</span>
                  </div>
                </div>
              </div>

              <div className="modal-header">
                <div>
                  <h3 className="gradient-text">Submit Your Review</h3>
                  <p style={{fontSize: '0.9rem', opacity: 0.7}}>Your feedback helps me improve this project.</p>
                </div>
              </div>

              <form onSubmit={handleReviewSubmit}>
                <div className="mb-4 text-center">
                  <p className="mb-3" style={{fontWeight: 600}}>How would you rate this project?</p>
                  <div className="stars-row">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <div 
                        key={star} 
                        className={`star-input ${reviewForm.rating >= star ? 'active' : ''}`}
                        onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                      >
                        {reviewForm.rating >= star ? <FaStar /> : <FaRegStar />}
                      </div>
                    ))}
                  </div>
                  <p className="tiny-text mt-2" style={{color: 'var(--accent-primary)'}}>Star rating is mandatory *</p>
                </div>

                <div className="mb-3">
                  <input 
                    type="text" 
                    placeholder="Your Name (Optional)" 
                    className="liquid-input"
                    value={reviewForm.name}
                    onChange={(e) => setReviewForm({ ...reviewForm, name: e.target.value })}
                  />
                </div>
                <div className="mb-3">
                  <input 
                    type="email" 
                    placeholder="Your Email (Optional - Never shown publicly)" 
                    className="liquid-input"
                    value={reviewForm.email}
                    onChange={(e) => setReviewForm({ ...reviewForm, email: e.target.value })}
                  />
                </div>
                <div className="mb-4">
                  <textarea 
                    placeholder="Your Feedback (Optional)" 
                    className="liquid-input"
                    rows="4"
                    value={reviewForm.message}
                    onChange={(e) => setReviewForm({ ...reviewForm, message: e.target.value })}
                  ></textarea>
                </div>

                <button type="submit" className="btn btn-primary w-100" disabled={submitting}>
                  {submitting ? 'Posting...' : 'Post Review'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ReviewPage;
