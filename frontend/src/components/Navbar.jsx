import React, { useState, useEffect } from 'react';
import { 
  FaSun, FaMoon, FaBars, FaTimes, 
  FaUser, FaCode, FaBriefcase, FaFolderOpen, 
  FaCertificate, FaEnvelope, FaGithub, FaLinkedin, 
  FaWhatsapp, FaInstagram 
} from 'react-icons/fa';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Theme logic
  const [theme, setTheme] = useState('dark');
  const [profileImage, setProfileImage] = useState('/assets/profile.jpg');

  useEffect(() => {
    // Check local storage or system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
      const initialTheme = prefersLight ? 'light' : 'dark';
      setTheme(initialTheme);
      document.documentElement.setAttribute('data-theme', initialTheme);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/profile-image`)
      .then(res => res.json())
      .then(data => {
        if (data.imageUrl) {
          if (data.imageUrl.startsWith('/uploads')) {
            setProfileImage(`${import.meta.env.VITE_API_URL}${data.imageUrl}`);
          } else {
            setProfileImage(data.imageUrl);
          }
        }
      })
      .catch(err => console.error('Error fetching profile image:', err));
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 30) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
      // Auto-close mobile menu on scroll
      if (isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobileMenuOpen]);

  const isHome = window.location.pathname === '/';

  return (
    <>
      {/* Overlay Backdrop */}
      <div 
        className={`nav-overlay ${isMobileMenuOpen ? 'visible' : ''}`} 
        onClick={() => setIsMobileMenuOpen(false)}
      ></div>

      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="container nav-container">
          <a href={isHome ? "#home" : "/#home"} className="logo-container">
            <img 
              src={profileImage} 
              alt="MR.PREM" 
              className="nav-profile-img" 
            />
            <span className="logo gradient-text">MR.PREM</span>
          </a>
          
          <div className={`nav-links-wrapper ${isMobileMenuOpen ? 'open' : ''}`}>
            <div className="menu-content" onClick={(e) => e.stopPropagation()}>
              <div className="menu-header">
                <span className="menu-title">Menu</span>
                <button className="mobile-close-btn" onClick={() => setIsMobileMenuOpen(false)}>
                  <FaTimes />
                </button>
              </div>

              <div className="menu-sections">
                <div className="menu-section">
                  <h4 className="section-label">Navigation</h4>
                  <ul className="nav-links">
                    <li><a href={isHome ? "#about" : "/#about"} onClick={() => setIsMobileMenuOpen(false)}><FaUser /> About</a></li>
                    <li><a href={isHome ? "#skills" : "/#skills"} onClick={() => setIsMobileMenuOpen(false)}><FaCode /> Skills</a></li>
                    <li><a href={isHome ? "#experience" : "/#experience"} onClick={() => setIsMobileMenuOpen(false)}><FaBriefcase /> Experience</a></li>
                    <li><a href={isHome ? "#projects" : "/#projects"} onClick={() => setIsMobileMenuOpen(false)}><FaFolderOpen /> Projects</a></li>
                    <li><a href={isHome ? "#certificates" : "/#certificates"} onClick={() => setIsMobileMenuOpen(false)}><FaCertificate /> Certificates</a></li>
                  </ul>
                </div>

                <div className="menu-section mobile-only">
                  <h4 className="section-label">Socials</h4>
                  <div className="menu-socials">
                    <a href="https://github.com/MRPREM31" target="_blank" rel="noreferrer"><FaGithub /></a>
                    <a href="https://www.linkedin.com/in/mr-prem-0a8809278/" target="_blank" rel="noreferrer"><FaLinkedin /></a>
                    <a href="https://wa.me/919348128362" target="_blank" rel="noreferrer"><FaWhatsapp /></a>
                    <a href="https://www.instagram.com/mr.prem_31/" target="_blank" rel="noreferrer"><FaInstagram /></a>
                  </div>
                </div>

                <div className="menu-section">
                  <h4 className="section-label">Actions</h4>
                  <div className="menu-actions">
                    <a href={isHome ? "#contact" : "/#contact"} className="contact-btn-premium" onClick={() => setIsMobileMenuOpen(false)}>
                      <FaEnvelope /> Contact Me
                    </a>
                    <button className="theme-toggle-premium" onClick={toggleTheme} aria-label="Toggle Theme">
                      {theme === 'dark' ? <><FaSun /> Light</> : <><FaMoon /> Dark</>}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="nav-actions-desktop">
            <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle Theme">
              {theme === 'dark' ? <FaSun /> : <FaMoon />}
            </button>
            <a href={isHome ? "#contact" : "/#contact"} className="contact-pill">Contact</a>
            <button className="mobile-toggle" onClick={() => setIsMobileMenuOpen(true)}>
              <FaBars />
            </button>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
