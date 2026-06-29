import React from 'react';
import { motion } from 'framer-motion';
import { TypeAnimation } from 'react-type-animation';
import { FaDownload, FaGithub, FaLinkedin, FaYoutube, FaMediumM, FaEnvelope } from 'react-icons/fa';
import './Hero.css';
import { useNavigate } from 'react-router-dom';
import { RESUME_LINK } from '../config';
import { optimizeCloudinaryUrl } from '../utils/cloudinary';
import useFetch from '../hooks/useFetch';
import fallbackProfile from '../data/fallbackProfile';

const Hero = () => {
  const navigate = useNavigate();

  const { data: profileData } = useFetch('/api/profile-image', { imageUrl: fallbackProfile.profileImageUrl });

  const isCustomResumeSet = RESUME_LINK && RESUME_LINK !== "https://your-resume-link-here.pdf";
  const { data: resumeData } = useFetch(
    isCustomResumeSet ? null : '/api/resume',
    { resumeUrl: fallbackProfile.resumeUrl }
  );

  // Parse and optimize profile image URL
  const rawProfileImage = profileData?.imageUrl || fallbackProfile.profileImageUrl || '';
  const profileImage = (rawProfileImage && typeof rawProfileImage === 'string' && rawProfileImage.startsWith('/uploads'))
    ? `${optimizeCloudinaryUrl(`${import.meta.env.VITE_API_URL}${rawProfileImage}`, 600)}`
    : `${optimizeCloudinaryUrl(rawProfileImage || fallbackProfile.profileImageUrl, 600)}`;

  // Parse resume URL
  const rawResumeUrl = isCustomResumeSet
    ? RESUME_LINK
    : (resumeData?.resumeUrl || fallbackProfile.resumeUrl || fallbackProfile.localResumeFallbackUrl || '');
  const resumeUrl = (rawResumeUrl && typeof rawResumeUrl === 'string' && rawResumeUrl.startsWith('/uploads'))
    ? `${import.meta.env.VITE_API_URL}${rawResumeUrl}`
    : rawResumeUrl || fallbackProfile.localResumeFallbackUrl;

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
                2000,
                'Intern @CSIR-NAL',
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
            <a href="/articles" className="btn btn-outline">📝 Articles</a>
            <button onClick={() => { 
              navigate('/github-insights', { 
                state: { fromPortfolio: true, scrollY: window.scrollY, section: 'home' } 
              }); 
            }} className="btn btn-outline insights-btn">
              🚀 Developer Insights
            </button>
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
