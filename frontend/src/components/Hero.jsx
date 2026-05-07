import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TypeAnimation } from 'react-type-animation';
import { FaDownload, FaGithub, FaLinkedin, FaYoutube, FaMediumM, FaEnvelope } from 'react-icons/fa';
import './Hero.css';
import { Link } from 'react-router-dom';
import { RESUME_LINK } from '../config';

const Hero = () => {
  const [profileImage, setProfileImage] = useState('/assets/profile.jpg');
  const [resumeUrl, setResumeUrl] = useState('/resume.pdf');

  useEffect(() => {
    // Fetch profile image
    fetch(`${import.meta.env.VITE_API_URL}/api/profile-image`)
      .then(res => res.json())
      .then(data => {
        if (data.imageUrl) {
          const timestamp = Date.now();
          if (data.imageUrl.startsWith('/uploads')) {
            setProfileImage(`${import.meta.env.VITE_API_URL}${data.imageUrl}?t=${timestamp}`);
          } else {
            setProfileImage(`${data.imageUrl}?t=${timestamp}`);
          }
        }
      })
      .catch(err => console.error('Error fetching profile image:', err));

    // Fetch resume URL
    if (RESUME_LINK && RESUME_LINK !== "https://your-resume-link-here.pdf") {
      setResumeUrl(RESUME_LINK);
    } else {
      fetch(`${import.meta.env.VITE_API_URL}/api/resume`)
        .then(res => res.json())
        .then(data => {
          if (data.resumeUrl) {
            const timestamp = Date.now();
            if (data.resumeUrl.startsWith('/uploads')) {
              setResumeUrl(`${import.meta.env.VITE_API_URL}${data.resumeUrl}?t=${timestamp}`);
            } else {
              setResumeUrl(`${data.resumeUrl}?t=${timestamp}`);
            }
          }
        })
        .catch(err => console.error('Error fetching resume:', err));
    }
  }, []);
  return (
    <section id="home" className="section hero-section">
      <div className="container hero-container">
        <motion.div 
          className="hero-content"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="greeting">Hello, I'm</h2>
          <h1 className="name gradient-text">Prem Prasad Pradhan</h1>
          <h3 className="title">
            <TypeAnimation
              sequence={[
                'B.Tech Student @ NIST University',
                2000,
                'Software Developer',
                2000,
                'Team Lead @ DesiCrew Pvt Ltd',
                2000,
                'Founder @ QCDS',
                2000
              ]}
              wrapper="span"
              speed={50}
              repeat={Infinity}
            />
          </h3>
          <p className="tagline">
            Building real-world tech solutions and leading innovation through code and creativity.
          </p>
          
          <div className="hero-info">
            <span><FaEnvelope /> premprasadpradhan@zohomail.in</span>
            <span><FaEnvelope /> mr.prem2006@gmail.com</span>
            <span>📍 Odisha, India</span>
          </div>

          <div className="hero-buttons">
            <a href="#projects" className="btn btn-primary">View Projects</a>
            <a href={resumeUrl} target="_blank" rel="noreferrer" className="btn btn-secondary"><FaDownload /> Download Resume</a>
            <a href="#contact" className="btn btn-outline">Contact Me</a>
            <Link to="/github-insights" className="btn btn-outline insights-btn">
              🚀 Developer Insights
            </Link>
          </div>

          <div className="social-links">
            <a href="https://github.com/MRPREM31" target="_blank" rel="noreferrer"><FaGithub /></a>
            <a href="https://www.linkedin.com/in/prem-prasad-pradhan-18472b295/" target="_blank" rel="noreferrer"><FaLinkedin /></a>
            <a href="https://youtube.com/@B.techPrem" target="_blank" rel="noreferrer"><FaYoutube /></a>
            <a href="https://medium.com/@mr.prem" target="_blank" rel="noreferrer"><FaMediumM /></a>
          </div>
        </motion.div>

        <motion.div 
          className="hero-image-wrapper"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="image-glow"></div>
          <motion.img 
            src={profileImage} 
            alt="Prem Prasad Pradhan | Software Developer Portfolio Profile" 
            className="profile-img"
            loading="eager"
            animate={{ y: [0, -15, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          />
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
