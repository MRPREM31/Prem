import React, { useState, useEffect } from 'react';
import { FaSun, FaMoon, FaBars, FaTimes } from 'react-icons/fa';
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
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
        
        <div className={`nav-links-wrapper ${isMobileMenuOpen ? 'open' : ''}`}>
          <ul className="nav-links">
            <li><a href={isHome ? "#about" : "/#about"} onClick={() => setIsMobileMenuOpen(false)}>About</a></li>
            <li><a href={isHome ? "#skills" : "/#skills"} onClick={() => setIsMobileMenuOpen(false)}>Skills</a></li>
            <li><a href={isHome ? "#experience" : "/#experience"} onClick={() => setIsMobileMenuOpen(false)}>Experience</a></li>
            <li><a href={isHome ? "#projects" : "/#projects"} onClick={() => setIsMobileMenuOpen(false)}>Projects</a></li>
            <li><a href={isHome ? "#certificates" : "/#certificates"} onClick={() => setIsMobileMenuOpen(false)}>Certificates</a></li>
            <li><a href={isHome ? "#contact" : "/#contact"} className="contact-btn" onClick={() => setIsMobileMenuOpen(false)}>Contact Me</a></li>
            <li className="theme-toggle-container">
              <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle Theme">
                {theme === 'dark' ? <FaSun /> : <FaMoon />}
              </button>
            </li>
          </ul>
        </div>
        
        <div className="nav-actions">
          <button className="mobile-toggle" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
