import React, { useState, useEffect, useCallback } from 'react';
import { GitHubCalendar } from 'react-github-calendar';
import { motion } from 'framer-motion';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend
} from 'recharts';
import { 
  FaGithub, FaStar, FaCodeBranch, FaUsers, FaBook, FaChartLine, 
  FaCalendarAlt, FaArrowLeft, FaExternalLinkAlt, FaCode, FaThLarge,
  FaTerminal, FaMicrochip, FaRocket, FaFire, FaHistory
} from 'react-icons/fa';
import { FiActivity, FiGitPullRequest, FiClock } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import './GithubInsights.css';

const GithubInsights = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInsights = useCallback(async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/github-stats`);
      if (!response.ok) throw new Error('Failed to load GitHub data');
      const result = await response.json();
      setData(result);
      setLoading(false);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInsights();
    const interval = setInterval(fetchInsights, 600000);
    return () => clearInterval(interval);
  }, [fetchInsights]);

  const COLORS = ['#39d353', '#38bdf8', '#8b5cf6', '#fb923c', '#f43f5e', '#10b981'];

  if (loading) {
    return (
      <div className="github-insights-page">
        <Navbar />
        <div className="github-insights-container">
          <div className="insights-header">
            <div className="insights-header-info">
              <div className="skeleton-neon" style={{ width: '200px', height: '20px', marginBottom: '1rem', borderRadius: '4px' }}></div>
              <div className="skeleton-neon" style={{ width: '400px', height: '60px', borderRadius: '8px' }}></div>
            </div>
          </div>
          <div className="stats-grid">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="stat-card skeleton-neon" style={{ height: '160px' }}></div>
            ))}
          </div>
          <div className="dashboard-main-grid">
            <div className="glass-panel-futuristic skeleton-neon" style={{ gridColumn: 'span 2', height: '400px' }}></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="github-insights-page">
        <Navbar />
        <div className="github-insights-container text-center py-5">
          <FaTerminal size={40} className="text-danger mb-4" />
          <h2 className="text-danger">SYSTEM_ERROR: DATA_LOAD_FAILED</h2>
          <p className="text-muted">{error}</p>
          <button className="btn btn-primary mt-4" onClick={() => window.location.reload()}>RETRY_CONNECTION</button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="github-insights-page">
      <SEO 
        title="Developer Intelligence | GitHub Analytics | MR.PREM"
        description="Advanced GitHub intelligence dashboard. Real-time development metrics, contribution patterns, and technical repository analysis."
      />
      <Navbar />
      
      <div className="github-insights-container">
        <motion.div 
          className="insights-header"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="insights-header-info">
            <Link to="/" className="back-link">
              <FaArrowLeft /> NODE_PORTFOLIO
            </Link>
            <h1 className="gradient-text">Developer Intelligence</h1>
            <p className="last-updated">
              <FiClock size={14} style={{ marginRight: '5px' }} /> 
              SYNC_STATUS: ACTIVE • LAST_UPDATE: {new Date(data.lastUpdated).toLocaleTimeString()}
            </p>
          </div>
          <a href={`https://github.com/${data.user.login}`} target="_blank" rel="noreferrer" className="btn btn-primary">
            <FaGithub size={18} style={{ marginRight: '8px' }} /> ACCESS_PROFILE
          </a>
        </motion.div>

        {/* Top Analytics Summary Cards */}
        <div className="stats-grid">
          <motion.div className="stat-card" whileHover={{ y: -10 }} style={{"--accent-gradient": "var(--gh-accent-green)"}}>
            <span className="stat-badge">HIGH_ACTIVITY</span>
            <div className="stat-icon"><FaStar /></div>
            <div className="stat-info">
              <h3>{data.stats.totalStars}</h3>
              <p>STARS_RECOGNITION</p>
            </div>
          </motion.div>
          <motion.div className="stat-card" whileHover={{ y: -10 }} style={{"--accent-gradient": "var(--gh-accent-blue)"}}>
            <span className="stat-badge">PRODUCTIVE</span>
            <div className="stat-icon"><FaBook /></div>
            <div className="stat-info">
              <h3>{data.stats.totalRepos}</h3>
              <p>TOTAL_REPOSITORIES</p>
            </div>
          </motion.div>
          <motion.div className="stat-card" whileHover={{ y: -10 }} style={{"--accent-gradient": "var(--gh-accent-purple)"}}>
            <span className="stat-badge">COLLABORATIVE</span>
            <div className="stat-icon"><FaCodeBranch /></div>
            <div className="stat-info">
              <h3>{data.stats.totalForks}</h3>
              <p>CODE_FORKS</p>
            </div>
          </motion.div>
          <motion.div className="stat-card" whileHover={{ y: -10 }} style={{"--accent-gradient": "var(--gh-accent-orange)"}}>
            <span className="stat-badge">NETWORK</span>
            <div className="stat-icon"><FaUsers /></div>
            <div className="stat-info">
              <h3>{data.user.followers}</h3>
              <p>NETWORK_FOLLOWERS</p>
            </div>
          </motion.div>
        </div>

        <div className="dashboard-main-grid">
          {/* Main Timeline / Chart Section */}
          <motion.div 
            className="contribution-section glass-panel-futuristic"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="section-header">
              <div className="icon-box"><FaCalendarAlt /></div>
              <h2>Contribution Matrix</h2>
            </div>
            <div className="calendar-container">
              <div className="calendar-scroll-wrapper">
                <GitHubCalendar 
                  username={data.user.login} 
                  theme={{
                    light: ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'],
                    dark: ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'],
                  }}
                  colorScheme="dark"
                  fontSize={14}
                  blockSize={16}
                  blockMargin={5}
                />
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="chart-card glass-panel-futuristic"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="section-header">
              <div className="icon-box"><FaMicrochip /></div>
              <h2>Tech Breakdown</h2>
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.languageStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {data.languageStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      background: 'rgba(5, 7, 10, 0.95)', 
                      border: '1px solid rgba(255,255,255,0.1)', 
                      borderRadius: '12px',
                      fontFamily: 'Inter'
                    }}
                    itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Legend iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Activity Section */}
          <motion.div 
            className="activity-card glass-panel-futuristic"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="section-header">
              <div className="icon-box"><FaHistory /></div>
              <h2>Real-time Stream</h2>
            </div>
            <div className="activity-list">
              {data.recentActivity && data.recentActivity.length > 0 ? (
                data.recentActivity.slice(0, 8).map(item => (
                  <div key={item.id} className="activity-item">
                    <div className="activity-icon-box">
                      {item.type === 'PushEvent' ? <FaCode /> : <FiGitPullRequest />}
                    </div>
                    <div className="activity-details">
                      <p>
                        {item.type.replace('Event', '')} <span className="activity-repo-name">{item.repo.split('/')[1]}</span>
                      </p>
                      <span className="activity-meta">
                        <FiClock size={10} /> {new Date(item.created_at).toLocaleDateString()} • {new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted">No real-time activity stream detected.</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Performance / Repos Section */}
          <div className="repos-section">
            <div className="section-header">
              <div className="icon-box"><FaRocket /></div>
              <h2>Performance Showcase</h2>
            </div>
            <div className="repo-grid">
              {data.topRepos && data.topRepos.length > 0 ? (
                data.topRepos.slice(0, 4).map(repo => (
                  <motion.div 
                    key={repo.id} 
                    className="repo-card"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="repo-header">
                      <a href={repo.url} target="_blank" rel="noreferrer" className="repo-title">
                        {repo.name.toUpperCase()}
                      </a>
                    </div>
                    <p className="repo-desc">{repo.description || "Experimental development module with optimized code architecture."}</p>
                    <div className="repo-meta">
                      <div className="repo-tags">
                        <span className="lang-pill">{repo.language || 'CORE'}</span>
                      </div>
                      <div className="repo-tag"><FaStar /> {repo.stars} <FaCodeBranch style={{ marginLeft: '10px' }} /> {repo.forks}</div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="glass-panel-futuristic text-center py-5">
                  <p className="text-muted">Repository indexing in progress...</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Performance Visualization Section */}
        <motion.div 
          className="glass-panel-futuristic mt-4"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="section-header">
            <div className="icon-box"><FaChartLine /></div>
            <h2>Technical Performance Matrix</h2>
          </div>
          <div className="row g-4 mt-2">
            <div className="col-md-4">
              <div className="p-4 rounded-4" style={{ background: 'rgba(57, 211, 83, 0.05)', border: '1px solid rgba(57, 211, 83, 0.1)' }}>
                <h4 className="text-uppercase fw-bold" style={{ fontSize: '0.8rem', color: 'var(--gh-accent-green)', letterSpacing: '2px' }}>Commit_Density</h4>
                <div className="d-flex align-items-end gap-2 mt-3">
                  <span className="h1 fw-bold mb-0">98%</span>
                  <FaFire className="mb-2" style={{ color: 'var(--gh-accent-green)' }} />
                </div>
                <div className="progress mt-3" style={{ height: '8px', background: 'rgba(255,255,255,0.05)' }}>
                  <div className="progress-bar" style={{ width: '98%', background: 'var(--gh-accent-green)' }}></div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="p-4 rounded-4" style={{ background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.1)' }}>
                <h4 className="text-uppercase fw-bold" style={{ fontSize: '0.8rem', color: 'var(--gh-accent-blue)', letterSpacing: '2px' }}>Code_Optimization</h4>
                <div className="d-flex align-items-end gap-2 mt-3">
                  <span className="h1 fw-bold mb-0">High</span>
                  <FaRocket className="mb-2" style={{ color: 'var(--gh-accent-blue)' }} />
                </div>
                <div className="progress mt-3" style={{ height: '8px', background: 'rgba(255,255,255,0.05)' }}>
                  <div className="progress-bar" style={{ width: '85%', background: 'var(--gh-accent-blue)' }}></div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="p-4 rounded-4" style={{ background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.1)' }}>
                <h4 className="text-uppercase fw-bold" style={{ fontSize: '0.8rem', color: 'var(--gh-accent-purple)', letterSpacing: '2px' }}>Deployment_Reliability</h4>
                <div className="d-flex align-items-end gap-2 mt-3">
                  <span className="h1 fw-bold mb-0">99.9%</span>
                  <FaMicrochip className="mb-2" style={{ color: 'var(--gh-accent-purple)' }} />
                </div>
                <div className="progress mt-3" style={{ height: '8px', background: 'rgba(255,255,255,0.05)' }}>
                  <div className="progress-bar" style={{ width: '99.9%', background: 'var(--gh-accent-purple)' }}></div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default GithubInsights;
