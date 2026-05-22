import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FaLinkedinIn, FaGithub, FaEnvelope, FaGlobe, FaTools, FaCheckCircle, FaSpinner, FaFilePdf } from 'react-icons/fa';
import { RESUME_LINK } from '../config';
import SEO from '../components/SEO';
import './Maintenance.css';

const Maintenance = ({ settings, onUnlock }) => {
  const [profileImage, setProfileImage] = useState('/assets/profile.jpg');
  const [resumeUrl, setResumeUrl] = useState(
    RESUME_LINK && RESUME_LINK !== "https://your-resume-link-here.pdf" 
      ? RESUME_LINK 
      : '/Prem_Prasad_Pradhan_CV.pdf'
  );
  
  useEffect(() => {
    const fetchDynamicResume = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/resume`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.resumeUrl) {
            setResumeUrl(data.resumeUrl.startsWith('/uploads') 
              ? `${import.meta.env.VITE_API_URL}${data.resumeUrl}` 
              : data.resumeUrl
            );
          }
        }
      } catch (err) {
        console.error('Error fetching dynamic resume link:', err);
      }
    };
    fetchDynamicResume();
  }, []);
  const [activeTasks, setActiveTasks] = useState([
    { name: 'Core Engine Upgrades', status: 'completed' },
    { name: 'Database Schema Optimization', status: 'completed' },
    { name: 'AI Diagnostics Agent Synced', status: 'running' },
    { name: 'CDN Cache Synchronization', status: 'pending' }
  ]);

  // Fetch the current dynamic profile picture
  useEffect(() => {
    const fetchProfileImage = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/profile-image`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.imageUrl) {
            setProfileImage(data.imageUrl.startsWith('/uploads') 
              ? `${import.meta.env.VITE_API_URL}${data.imageUrl}` 
              : data.imageUrl
            );
          }
        } else {
          setProfileImage('https://res.cloudinary.com/dmy2piasa/image/upload/v1778143422/portfolio/1778143422301-Prem.jpg');
        }
      } catch (err) {
        console.error('Error fetching maintenance page profile image:', err);
        setProfileImage('https://res.cloudinary.com/dmy2piasa/image/upload/v1778143422/portfolio/1778143422301-Prem.jpg');
      }
    };
    fetchProfileImage();
  }, []);

  const calculateTimeLeft = useCallback(() => {
    if (!settings.end_time) {
      return { total: 1, days: 0, hours: 0, minutes: 0, seconds: 0 };
    }
    const difference = +new Date(settings.end_time) - +new Date();
    if (difference <= 0) {
      return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
    }
    return {
      total: difference,
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  }, [settings.end_time]);

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      const calculated = calculateTimeLeft();
      setTimeLeft(calculated);

      // Trigger automatic unlock if the countdown hits zero
      if (calculated.total === 0 && onUnlock) {
        clearInterval(timer);
        onUnlock();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [calculateTimeLeft, onUnlock]);

  // Calculate overall progress percentage
  useEffect(() => {
    if (settings.start_time && settings.end_time) {
      const start = +new Date(settings.start_time);
      const end = +new Date(settings.end_time);
      const total = end - start;
      if (total > 0) {
        const elapsed = +new Date() - start;
        const percentage = Math.min(100, Math.max(0, (elapsed / total) * 100));
        setProgress(percentage);

        // Adjust active tasks based on elapsed time percentage
        setActiveTasks([
          { name: 'Core Engine Upgrades', status: 'completed' },
          { name: 'Database Schema Optimization', status: percentage > 40 ? 'completed' : 'running' },
          { name: 'AI Diagnostics Agent Synced', status: percentage > 75 ? 'completed' : (percentage > 40 ? 'running' : 'pending') },
          { name: 'CDN Cache Synchronization', status: percentage >= 95 ? 'completed' : (percentage > 75 ? 'running' : 'pending') }
        ]);
      }
    }
  }, [settings.start_time, settings.end_time, timeLeft]);

  const formatNum = (num) => String(num).padStart(2, '0');

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 40, scale: 0.96 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (custom) => ({
      opacity: 1,
      y: 0,
      transition: { delay: custom * 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }
    })
  };

  const formatResumeDateTime = () => {
    if (!settings.end_time) return null;
    const date = new Date(settings.end_time);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="maintenance-container">
      <SEO title="System Under Upgrades | Prem Prasad Pradhan" noindex={true} />
      
      {/* Sleek Interactive Ambient Glow */}
      <div className="interactive-bg">
        <div className="glow-blob glow-blue"></div>
        <div className="glow-blob glow-purple"></div>
        <div className="glow-blob glow-indigo"></div>
        <div className="grid-overlay"></div>
      </div>

      <motion.div
        className="maintenance-card"
        variants={cardVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Compact Circular Avatar */}
        <div className="avatar-header-wrap">
          <motion.div 
            className="avatar-container"
            variants={itemVariants}
            custom={0}
          >
            <div className="avatar-neon-ring">
              <img 
                src={profileImage} 
                alt="Prem Prasad Pradhan" 
                className="user-avatar-small" 
                onError={(e) => {
                  e.target.src = 'https://res.cloudinary.com/dmy2piasa/image/upload/v1778143422/portfolio/1778143422301-Prem.jpg';
                }}
              />
              <span className="live-status-dot"></span>
            </div>
          </motion.div>
        </div>

        {/* Developer Clean Title */}
        <motion.h1 className="maintenance-title" variants={itemVariants} custom={1}>
          System Upgrades In Progress
        </motion.h1>

        <motion.p className="maintenance-subtitle" variants={itemVariants} custom={2}>
          {settings.message || "Undergoing scheduled maintenance. The portfolio will automatically resume once the upgrade is completed."}
        </motion.p>

        {/* Minimal Monospace Inline Countdown */}
        {settings.end_time && timeLeft.total > 0 && (
          <motion.div className="mono-countdown" variants={itemVariants} custom={3}>
            <div className="time-segment">
              <span className="time-val">{formatNum(timeLeft.days)}</span>
              <span className="time-unit">d</span>
            </div>
            <span className="time-sep">:</span>
            <div className="time-segment">
              <span className="time-val">{formatNum(timeLeft.hours)}</span>
              <span className="time-unit">h</span>
            </div>
            <span className="time-sep">:</span>
            <div className="time-segment">
              <span className="time-val">{formatNum(timeLeft.minutes)}</span>
              <span className="time-unit">m</span>
            </div>
            <span className="time-sep">:</span>
            <div className="time-segment-active">
              <span className="time-val glow-seconds">{formatNum(timeLeft.seconds)}</span>
              <span className="time-unit">s</span>
            </div>
          </motion.div>
        )}

        {/* Ultra-thin Compact Progress Line */}
        {settings.start_time && settings.end_time && timeLeft.total > 0 && (
          <motion.div className="progress-section" variants={itemVariants} custom={4}>
            <div className="progress-container">
              <motion.div 
                className="progress-bar" 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
            </div>
            <div className="progress-label-wrap">
              <span className="progress-percentage">{Math.round(progress)}% UPGRADED</span>
            </div>
          </motion.div>
        )}

        {/* Sleek single-line estimated completion display */}
        {settings.end_time && (
          <motion.div className="estimated-completion-text" variants={itemVariants} custom={4.5}>
            <span>Estimated resumption: </span>
            <strong className="glow-time">{formatResumeDateTime()}</strong>
          </motion.div>
        )}


        {/* Sleek Glass Capsule Email Contact */}
        <motion.div className="developer-contact-pill" variants={itemVariants} custom={5}>
          <div className="contact-body">
            <span className="contact-prefix">In the meantime, you can contact Prem by this email:</span>
            <a href="mailto:contact@mrprem.in" className="contact-email-link">
              <FaEnvelope className="contact-icon" />
              <span>contact@mrprem.in</span>
            </a>
          </div>
        </motion.div>

        {/* Footer & Social Section */}
        <motion.div className="social-section" variants={itemVariants} custom={6}>
          <a href="https://linkedin.com/in/mr-prem-pradhan" target="_blank" rel="noreferrer" className="social-icon-link" title="LinkedIn">
            <FaLinkedinIn />
          </a>
          <a href="https://github.com/MRPREM31" target="_blank" rel="noreferrer" className="social-icon-link" title="GitHub">
            <FaGithub />
          </a>
          <a href="mailto:contact@mrprem.in" className="social-icon-link" title="Official Contact Email">
            <FaEnvelope />
          </a>
          <a href={resumeUrl} target="_blank" rel="noreferrer" className="social-icon-link" title="Download Resume">
            <FaFilePdf />
          </a>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Maintenance;
