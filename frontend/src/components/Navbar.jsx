import React, { useState, useEffect } from 'react';
import { FaSun, FaMoon, FaBars, FaTimes, FaGithub, FaLinkedin, FaInstagram, FaWhatsapp } from 'react-icons/fa';
import './Navbar.css';

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
    fetch(`${import.meta.env.VITE_API_URL}/api/navbar-image`)
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
      .catch(err => console.error('Error fetching navbar image:', err));
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
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
    <nav className={`navbar ${scrolled ? 'scrolled glass-panel' : ''}`}>
      <div className="container nav-container">
        <a href={isHome ? "#home" : "/#home"} className="logo-container">
          <img
            src={profileImage}
            alt="MR.PREM"
            className="nav-profile-img"
          />
          <span className="logo gradient-text">MR.PREM</span>
        </a>

        <div
          className={`nav-links-wrapper ${isMobileMenuOpen ? 'open' : ''}`}
          onClick={() => setIsMobileMenuOpen(false)} // Close when clicking backdrop
        >
          <div className="mobile-menu-header-premium">
            <span className="logo gradient-text">MR.PREM</span>
            <p className="mobile-subtitle">Software Developer</p>
          </div>

          <button className="mobile-close-btn" onClick={() => setIsMobileMenuOpen(false)}>
            <FaTimes />
          </button>

          <ul className="nav-links" onClick={(e) => e.stopPropagation()}>
            <li style={{"--i": 1}}><a href={isHome ? "#about" : "/#about"} onClick={() => setIsMobileMenuOpen(false)}>About</a></li>
            <li style={{"--i": 2}}><a href={isHome ? "#skills" : "/#skills"} onClick={() => setIsMobileMenuOpen(false)}>Skills</a></li>
            <li style={{"--i": 3}}><a href={isHome ? "#experience" : "/#experience"} onClick={() => setIsMobileMenuOpen(false)}>Experience</a></li>
            <li style={{"--i": 4}}><a href={isHome ? "#projects" : "/#projects"} onClick={() => setIsMobileMenuOpen(false)}>Projects</a></li>
            <li style={{"--i": 5}}><a href={isHome ? "#certificates" : "/#certificates"} onClick={() => setIsMobileMenuOpen(false)}>Certificates</a></li>
            <li style={{"--i": 6}}><a href={isHome ? "#contact" : "/#contact"} className="contact-btn" onClick={() => setIsMobileMenuOpen(false)}>Contact Me</a></li>
            
            {/* Desktop Theme Toggle (Hidden on Mobile) */}
            <li className="theme-toggle-container desktop-only">
              <button className="theme-toggle" onClick={(e) => { e.stopPropagation(); toggleTheme(); }} aria-label="Toggle Theme">
                {theme === 'dark' ? <FaSun /> : <FaMoon />}
              </button>
            </li>
          </ul>

          <div className="mobile-menu-footer-premium" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-socials">
              <a href="https://github.com/MRPREM31" target="_blank" rel="noreferrer"><FaGithub /></a>
              <a href="https://linkedin.com/in/mrprem31" target="_blank" rel="noreferrer"><FaLinkedin /></a>
              <a href="https://instagram.com/mr.prem_31" target="_blank" rel="noreferrer"><FaInstagram /></a>
              <a href="https://wa.me/917846835010" target="_blank" rel="noreferrer"><FaWhatsapp /></a>
            </div>
            <button className="theme-toggle-btn-mobile" onClick={toggleTheme}>
              {theme === 'dark' ? <><FaSun /> Light Mode</> : <><FaMoon /> Dark Mode</>}
            </button>
          </div>
        </div>

        <div className="nav-actions">
          <button className="mobile-toggle" onClick={() => setIsMobileMenuOpen(true)}>
            <FaBars />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
