import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SEO from '../components/SEO';
import Navbar from '../components/Navbar';
import { FaMediumM, FaBookOpen, FaClock, FaCalendarAlt, FaSearch, FaArrowRight, FaExternalLinkAlt } from 'react-icons/fa';
import './Articles.css';

const Articles = () => {
  const [articles, setArticles] = useState([]);
  const [filteredArticles, setFilteredArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('latest'); // latest or oldest

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      setError('');
      try {
        const apiBase = import.meta.env.VITE_API_URL || '';
        const res = await fetch(`${apiBase}/api/articles`);
        if (!res.ok) {
          throw new Error('Failed to fetch articles');
        }
        const data = await res.json();
        setArticles(data || []);
      } catch (err) {
        console.error('Error fetching articles:', err);
        setError('Unable to load articles. Please try again later.');
      }
      setLoading(false);
    };

    fetchArticles();
  }, []);

  // Filter and sort logic
  useEffect(() => {
    let result = [...articles];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (article) =>
          article.title.toLowerCase().includes(query) ||
          article.categories.some((cat) => cat.toLowerCase().includes(query)) ||
          article.excerpt.toLowerCase().includes(query)
      );
    }

    // Sort logic
    result.sort((a, b) => {
      const dateA = new Date(a.pubDate);
      const dateB = new Date(b.pubDate);
      return sortBy === 'latest' ? dateB - dateA : dateA - dateB;
    });

    setFilteredArticles(result);
  }, [articles, searchQuery, sortBy]);

  // Calculations for Stats Section
  const totalArticles = articles.length;
  const totalReadingTime = articles.reduce((sum, item) => sum + (item.readingTime || 0), 0);
  let latestPubDate = 'N/A';
  if (articles.length > 0) {
    const dates = articles.map(a => new Date(a.pubDate));
    const newestDate = new Date(Math.max(...dates));
    latestPubDate = newestDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric', day: 'numeric' });
  }

  // Separate the featured article (the absolute latest one) from the grid list
  // Note: We only showcase a featured article if we are not filtering the results.
  const featuredArticle = !searchQuery && articles.length > 0 ? [...articles].sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))[0] : null;
  const gridArticles = featuredArticle 
    ? filteredArticles.filter(a => a.link !== featuredArticle.link)
    : filteredArticles;

  // Structured Schema data
  const articlesSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Articles & Publications | Prem Prasad Pradhan",
    "description": "Discover articles, ethical hacking guides, development tutorials, and project insights written by Prem Prasad Pradhan.",
    "url": "https://mrprem.in/articles",
    "publisher": {
      "@type": "Person",
      "name": "Prem Prasad Pradhan"
    },
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": filteredArticles.length,
      "itemListElement": filteredArticles.map((art, idx) => ({
        "@type": "ListItem",
        "position": idx + 1,
        "url": art.link,
        "name": art.title
      }))
    }
  };

  // Date formatter
  const formatDate = (dateStr) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString('en-US', options);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: 'easeOut' }
    }
  };

  return (
    <div className="articles-page">
      <SEO 
        title="Articles & Publications" 
        description="Read professional articles, tutorials, project case-studies, and tech publications written by Prem Prasad Pradhan on Medium."
        url="/articles"
        schema={articlesSchema}
      />
      <Navbar />

      <div className="articles-container">
        {/* Header Title */}
        <motion.div 
          className="articles-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1>📝 Articles & Publications</h1>
          <p>
            Sharing my knowledge, projects, research, experiences, and technical insights through professional writing.
          </p>
        </motion.div>

        {/* Stats Banner */}
        {!loading && !error && articles.length > 0 && (
          <motion.div 
            className="articles-stats-container"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div className="stat-card" variants={itemVariants}>
              <span className="stat-icon">📊</span>
              <div className="stat-value">{totalArticles}</div>
              <div className="stat-label">Total Articles</div>
            </motion.div>
            <motion.div className="stat-card" variants={itemVariants}>
              <span className="stat-icon">✍️</span>
              <div className="stat-value">{totalReadingTime} Min</div>
              <div className="stat-label">Total Reading Time</div>
            </motion.div>
            <motion.div className="stat-card" variants={itemVariants}>
              <span className="stat-icon">📅</span>
              <div className="stat-value">{latestPubDate}</div>
              <div className="stat-label">Latest Publication</div>
            </motion.div>
          </motion.div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Fetching writing insights from Medium...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="empty-state">
            <p className="error-text">{error}</p>
          </div>
        )}

        {/* Loaded Content */}
        {!loading && !error && (
          <>
            {/* Featured Article spotlight */}
            {featuredArticle && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div className="featured-section-title">
                  <span>⭐</span> Featured Article
                </div>
                <div className="featured-card">
                  <div className="featured-image-wrapper">
                    <img 
                      src={featuredArticle.imageUrl || 'https://res.cloudinary.com/dmy2piasa/image/upload/v1741356501/portfolio/profile_photo.jpg'} 
                      alt={featuredArticle.title} 
                      className="featured-image"
                      loading="lazy"
                    />
                  </div>
                  <div className="featured-content">
                    <span className="featured-badge">
                      <FaMediumM /> Medium
                    </span>
                    <div className="featured-meta">
                      <FaCalendarAlt /> {formatDate(featuredArticle.pubDate)}
                      <span>•</span>
                      <FaClock /> {featuredArticle.readingTime} min read
                    </div>
                    <h2 className="featured-title">{featuredArticle.title}</h2>
                    <p className="featured-excerpt">{featuredArticle.excerpt}</p>
                    
                    {featuredArticle.categories && featuredArticle.categories.length > 0 && (
                      <div className="featured-categories">
                        {featuredArticle.categories.slice(0, 4).map((cat, idx) => (
                          <span key={idx} className="category-tag">#{cat}</span>
                        ))}
                      </div>
                    )}
                    
                    <a 
                      href={featuredArticle.link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="btn-read-more"
                    >
                      Read on Medium <FaArrowRight />
                    </a>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Filter and Search controls */}
            <div className="filters-bar">
              <div className="search-box">
                <FaSearch className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Search articles by title or tag..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="sort-box">
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="latest">Sort by: Newest First</option>
                  <option value="oldest">Sort by: Oldest First</option>
                </select>
              </div>
            </div>

            {/* Empty State when no filters match */}
            {filteredArticles.length === 0 && (
              <div className="empty-state">
                <p>No articles matched your search query. Try typing something else!</p>
              </div>
            )}

            {/* Grid of standard articles */}
            {gridArticles.length > 0 && (
              <motion.div 
                className="articles-grid"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {gridArticles.map((article, index) => (
                  <motion.div 
                    key={index} 
                    className="article-card"
                    variants={itemVariants}
                  >
                    <div className="article-image-wrapper">
                      <img 
                        src={article.imageUrl || 'https://res.cloudinary.com/dmy2piasa/image/upload/v1741356501/portfolio/profile_photo.jpg'} 
                        alt={article.title} 
                        className="article-image"
                        loading="lazy"
                      />
                    </div>
                    <div className="article-card-body">
                      <span className="card-badge">
                        <FaMediumM /> Medium
                      </span>
                      <div className="article-meta">
                        <FaCalendarAlt /> {formatDate(article.pubDate)}
                        <span>•</span>
                        <FaClock /> {article.readingTime} min read
                      </div>
                      <h3 className="article-title">{article.title}</h3>
                      <p className="article-excerpt">{article.excerpt}</p>
                      
                      <div className="article-card-footer">
                        {article.categories && article.categories.length > 0 && (
                          <div className="article-categories">
                            {article.categories.slice(0, 3).map((cat, idx) => (
                              <span key={idx} className="category-tag">#{cat}</span>
                            ))}
                          </div>
                        )}
                        <a 
                          href={article.link} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="btn-read-more"
                        >
                          Read on Medium <FaArrowRight />
                        </a>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Medium Profile CTA */}
            <motion.div 
              className="medium-cta-section"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="cta-box">
                <h3>Follow My Writing Journey</h3>
                <p>Explore all articles, deep-dives, guides, and project experiences directly on my Medium profile.</p>
                <a 
                  href="https://medium.com/@mr.prem" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn-cta"
                >
                  View My Medium Profile <FaExternalLinkAlt />
                </a>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
};

export default Articles;
