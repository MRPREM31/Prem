import React, { useState, useEffect, useCallback } from 'react';
import { GitHubCalendar } from 'react-github-calendar';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  FaGithub, FaStar, FaCodeBranch, FaUsers, FaBook, FaChartLine, 
  FaCalendarAlt, FaArrowLeft, FaExternalLinkAlt, FaCode
} from 'react-icons/fa';
import { FiActivity, FiGitPullRequest } from 'react-icons/fi';
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
    // Auto-refresh every 10 minutes
    const interval = setInterval(fetchInsights, 600000);
    return () => clearInterval(interval);
  }, [fetchInsights]);

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981'];

  if (loading) {
    return (
      <div className="github-insights-page">
        <Navbar />
        <div className="github-insights-container">
          <div className="insights-header">
            <div className="insights-header-info">
              <div className="skeleton" style={{ width: '300px', height: '40px', marginBottom: '10px' }}></div>
              <div className="skeleton" style={{ width: '200px', height: '20px' }}></div>
            </div>
          </div>
          <div className="stats-grid">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="stat-card glass-panel skeleton" style={{ height: '100px' }}></div>
            ))}
          </div>
          <div className="dashboard-main-grid">
            <div className="contribution-section glass-panel skeleton" style={{ height: '300px' }}></div>
            <div className="chart-card glass-panel skeleton" style={{ height: '300px' }}></div>
            <div className="activity-card glass-panel skeleton" style={{ height: '300px' }}></div>
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
          <h2 className="text-danger">Oops! Something went wrong</h2>
          <p className="text-muted">{error}</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>Try Again</button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="github-insights-page">
      <SEO 
        title="Developer Insights | GitHub Analytics | Prem Prasad Pradhan"
        description="Explore the live GitHub analytics and development activity of Prem Prasad Pradhan. Real-time stats, contributions, and top repositories."
      />
      <Navbar />
      
      <div className="github-insights-container">
        <motion.div 
          className="insights-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="insights-header-info">
            <Link to="/" className="back-link">
              <FaArrowLeft size={18} /> Back to Portfolio
            </Link>
            <h1 className="gradient-text">Developer Insights</h1>
            <p className="last-updated">
              <FiActivity size={14} style={{ marginRight: '5px' }} /> 
              Live GitHub Analytics • Last synced: {new Date(data.lastUpdated).toLocaleTimeString()}
            </p>
          </div>
          <a href={`https://github.com/${data.user.login}`} target="_blank" rel="noreferrer" className="btn btn-primary">
            <FaGithub size={18} style={{ marginRight: '8px' }} /> View Profile
          </a>
        </motion.div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <motion.div className="stat-card glass-panel" whileHover={{ y: -5 }}>
            <div className="stat-icon"><FaStar /></div>
            <div className="stat-info">
              <h3>{data.stats.totalStars}</h3>
              <p>Stars Earned</p>
            </div>
          </motion.div>
          <motion.div className="stat-card glass-panel" whileHover={{ y: -5 }}>
            <div className="stat-icon"><FaBook /></div>
            <div className="stat-info">
              <h3>{data.stats.totalRepos}</h3>
              <p>Repositories</p>
            </div>
          </motion.div>
          <motion.div className="stat-card glass-panel" whileHover={{ y: -5 }}>
            <div className="stat-icon"><FaCodeBranch /></div>
            <div className="stat-info">
              <h3>{data.stats.totalForks}</h3>
              <p>Forks Made</p>
            </div>
          </motion.div>
          <motion.div className="stat-card glass-panel" whileHover={{ y: -5 }}>
            <div className="stat-icon"><FaUsers /></div>
            <div className="stat-info">
              <h3>{data.user.followers}</h3>
              <p>Followers</p>
            </div>
          </motion.div>
        </div>

        <div className="dashboard-main-grid">
          {/* Contribution Graph */}
          <motion.div 
            className="contribution-section glass-panel"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="section-header">
              <FaCalendarAlt className="text-primary" />
              <h2>Contribution Calendar</h2>
            </div>
            <div className="calendar-container">
              <GitHubCalendar 
                username={data.user.login} 
                theme={{
                  light: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
                  dark: ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'],
                }}
                colorScheme="dark"
              />
            </div>
          </motion.div>

          {/* Language Chart */}
          <motion.div 
            className="chart-card glass-panel"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="section-header">
              <FaChartLine className="text-primary" />
              <h2>Tech Breakdown</h2>
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.languageStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data.languageStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ background: 'rgba(10, 15, 35, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div 
            className="activity-card glass-panel"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="section-header">
              <FiActivity className="text-primary" />
              <h2>Recent Activity</h2>
            </div>
            <div className="activity-list">
              {data.recentActivity.map(item => (
                <div key={item.id} className="activity-item">
                  <div className="activity-icon">
                    {item.type === 'PushEvent' ? <FaCode size={18} /> : <FiGitPullRequest size={18} />}
                  </div>
                  <div className="activity-content">
                    <p>
                      {item.type.replace('Event', '')} in <span className="activity-repo">{item.repo.split('/')[1]}</span>
                    </p>
                    <span className="activity-date">{new Date(item.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Top Repositories */}
          <div className="repos-section">
            <div className="section-header">
              <Layout className="text-primary" />
              <h2>Top Repositories</h2>
            </div>
            <div className="repo-grid">
              {data.topRepos.map(repo => (
                <motion.div 
                  key={repo.id} 
                  className="repo-card glass-panel"
                  whileHover={{ y: -5 }}
                >
                  <div className="repo-header">
                    <a href={repo.url} target="_blank" rel="noreferrer" className="repo-name">
                      {repo.name}
                    </a>
                    <FaExternalLinkAlt size={16} className="text-muted" />
                  </div>
                  <p className="repo-description">{repo.description || "No description available for this project."}</p>
                  <div className="repo-footer">
                    <div className="repo-lang">
                      <span className="lang-dot" style={{ background: COLORS[Math.floor(Math.random() * COLORS.length)] }}></span>
                      {repo.language}
                    </div>
                    <div className="repo-stats">
                      <div className="repo-stat"><FaStar size={14} /> {repo.stars}</div>
                      <div className="repo-stat"><FaCodeBranch size={14} /> {repo.forks}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default GithubInsights;
