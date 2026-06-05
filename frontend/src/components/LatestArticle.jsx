import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaMediumM, FaClock, FaCalendarAlt, FaArrowRight } from 'react-icons/fa';
import useFetch from '../hooks/useFetch';
import './LatestArticle.css';

const LatestArticle = () => {
  const navigate = useNavigate();
  const { data: articles = [], loading, error } = useFetch('/api/articles', []);

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString('en-US', options);
  };

  // If loading, render an elegant skeleton card
  if (loading) {
    return (
      <section className="section latest-article-section" id="latest-article">
        <div className="container">
          <div className="section-title-wrapper">
            <h2 className="section-title gradient-text">Latest Publication</h2>
          </div>
          <div className="latest-article-card-skeleton glass-panel">
            <div className="skeleton-image"></div>
            <div className="skeleton-content">
              <div className="skeleton-badge"></div>
              <div className="skeleton-meta"></div>
              <div className="skeleton-title"></div>
              <div className="skeleton-title short"></div>
              <div className="skeleton-excerpt"></div>
              <div className="skeleton-excerpt short"></div>
              <div className="skeleton-tags">
                <div className="skeleton-tag"></div>
                <div className="skeleton-tag"></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // If there's an error or no articles found, return null to fail gracefully on home page
  if (error || !articles || articles.length === 0) {
    return null;
  }

  // Get the latest article (sort by date descending to be sure, although API usually sorts it)
  const sortedArticles = [...articles].sort(
    (a, b) => new Date(b.pubDate) - new Date(a.pubDate)
  );
  const latestArticle = sortedArticles[0];

  return (
    <section className="section latest-article-section" id="latest-article">
      <div className="container">
        <motion.div
          className="section-title-wrapper"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="section-title gradient-text">Latest Publication</h2>
          <p className="section-subtitle">
            Insights, tutorials, and research from my technical blog on Medium.
          </p>
        </motion.div>

        <motion.div
          className="latest-article-card glass-panel"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          <div className="latest-article-image-wrapper">
            <img
              src={latestArticle.imageUrl || 'https://res.cloudinary.com/dmy2piasa/image/upload/v1741356501/portfolio/profile_photo.jpg'}
              alt={latestArticle.title}
              className="latest-article-image"
              loading="lazy"
            />
          </div>

          <div className="latest-article-content">
            <span className="latest-article-badge">
              <FaMediumM /> Medium
            </span>

            <div className="latest-article-meta">
              <span>
                <FaCalendarAlt /> {formatDate(latestArticle.pubDate)}
              </span>
              <span className="meta-separator">•</span>
              <span>
                <FaClock /> {latestArticle.readingTime} min read
              </span>
            </div>

            <h3 className="latest-article-title">{latestArticle.title}</h3>
            
            <p className="latest-article-excerpt">{latestArticle.excerpt}</p>

            {latestArticle.categories && latestArticle.categories.length > 0 && (
              <div className="latest-article-categories">
                {latestArticle.categories.slice(0, 4).map((cat, idx) => (
                  <span key={idx} className="category-tag">
                    #{cat}
                  </span>
                ))}
              </div>
            )}

            <a
              href={latestArticle.link}
              target="_blank"
              rel="noopener noreferrer"
              className="latest-read-more-btn"
            >
              Read on Medium <FaArrowRight />
            </a>
          </div>
        </motion.div>

        {/* See All My Articles CTA Button */}
        <motion.div
          className="see-all-articles-wrapper"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <button
            className="btn-see-all-articles"
            onClick={() => navigate('/articles')}
          >
            See All My Articles <FaArrowRight className="btn-arrow" />
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default LatestArticle;
