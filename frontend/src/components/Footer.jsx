import React, { useState, useEffect, useRef } from 'react';
import { FaGithub, FaLinkedin, FaYoutube, FaMediumM, FaEnvelope } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import useFetch from '../hooks/useFetch';
import fallbackProfile from '../data/fallbackProfile';
import './Footer.css';

const Footer = () => {
  const { data: sigData } = useFetch('/api/signature', { signatureUrl: fallbackProfile.signatureUrl });

  const rawSignature = sigData?.signatureUrl || fallbackProfile.signatureUrl || '';
  const signature = (rawSignature && typeof rawSignature === 'string' && rawSignature.startsWith('/uploads'))
    ? `${import.meta.env.VITE_API_URL}${rawSignature}`
    : rawSignature;

  const [visitorCount, setVisitorCount] = useState(() => {
    const saved = localStorage.getItem('mrprem_visitor_count');
    return saved ? parseInt(saved, 10) : 12450;
  });

  useEffect(() => {
    const fetchVisitorStats = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/visitor-stats`);
        if (res.ok) {
          const data = await res.json();
          if (data && typeof data.totalVisitors === 'number') {
            setVisitorCount(data.totalVisitors);
            localStorage.setItem('mrprem_visitor_count', data.totalVisitors);
          }
        }
      } catch (err) {
        console.warn('[Footer] Failed to fetch visitor stats from backend:', err.message || err);
      }
    };

    fetchVisitorStats();
    const interval = setInterval(fetchVisitorStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const AnimatedCounter = ({ end }) => {
    const [count, setCount] = useState(end > 10 ? end - 5 : 1);
    const prevEnd = useRef(end);
    
    useEffect(() => {
      let start = count;
      const target = end;
      if (start === target) return;

      const duration = 2000;
      const stepTime = 16;
      const totalSteps = duration / stepTime;
      const increment = (target - start) / totalSteps;
      
      const timer = setInterval(() => {
        start += increment;
        if ((increment > 0 && start >= target) || (increment < 0 && start <= target)) {
          setCount(target);
          clearInterval(timer);
        } else {
          setCount(Math.floor(start));
        }
      }, stepTime);
      
      return () => clearInterval(timer);
    }, [end]);

    return <span>{count.toLocaleString()}</span>;
  };

  return (
    <footer className="footer-premium">
      <div className="footer-top">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <h2 className="logo gradient-text">MR.PREM</h2>
              <p>Building digital experiences that combine innovative design with clean, functional code.</p>
              {signature && (
                <div className="signature-container">
                  <img src={signature} alt="Prem Signature" className="footer-signature" />
                </div>
              )}
            </div>
            
            <div className="footer-links-section">
              <h4>Quick Links</h4>
              <ul>
                <li><a href="https://www.zenemoo.in/" target="_blank" rel="noopener noreferrer">Zenemoo.in</a></li>
                <li><a href="https://www.zenemoo.in/team/prem-prasad-pradhan" target="_blank" rel="noopener noreferrer">Zenemoo ID Profile</a></li>
                <li><Link to="/secure-portal">Secure Access</Link></li>
                <li><a href="/prem-login-2026" target="_blank" rel="noopener noreferrer">Admin Login</a></li>
              </ul>
            </div>

            <div className="footer-contact-section">
              <h4>Contact</h4>
              <p><FaEnvelope /> prem@zenemoo.in</p>
              <p><FaEnvelope /> mr.prem2006@gmail.com</p>
              <p>📍 Odisha, India</p>
            </div>

            <div className="footer-social-section">
              <h4>Follow Me</h4>
              <div className="social-icons">
                <a href="https://github.com/MRPREM31" target="_blank" rel="noreferrer"><FaGithub /></a>
                <a href="https://www.linkedin.com/in/prem-prasad-pradhan-18472b295/" target="_blank" rel="noreferrer"><FaLinkedin /></a>
                <a href="https://youtube.com/@B.techPrem" target="_blank" rel="noreferrer"><FaYoutube /></a>
                <a href="https://medium.com/@mr.prem" target="_blank" rel="noreferrer"><FaMediumM /></a>
              </div>

              {/* VISITOR ANALYTICS CARD */}
              <div className="visitor-analytics-card glass-panel">
                <div className="visitor-status">
                  <span className="live-dot"></span>
                  <span className="status-text">LIVE ANALYTICS</span>
                </div>
                <div className="visitor-info">
                  <p className="visitor-label">👁 Visitors</p>
                  <h3 className="visitor-count">
                    <AnimatedCounter end={visitorCount || 0} />
                  </h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="footer-bottom">
        <div className="container">
          <p>&copy; 2026 Prem Prasad Pradhan. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
