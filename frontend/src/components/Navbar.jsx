import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSun, FaMoon, FaBars, FaTimes, FaGithub, FaLinkedin, FaInstagram, FaWhatsapp } from 'react-icons/fa';
import './Navbar.css';

const navLinks = [
  { name: 'About', id: 'about' },
  { name: 'Skills', id: 'skills' },
  { name: 'Experience', id: 'experience' },
  { name: 'Projects', id: 'projects' },
  { name: 'Certificates', id: 'certificates' },
  { name: 'Contact Me', id: 'contact' },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [hoveredSection, setHoveredSection] = useState(null);
  const [theme, setTheme] = useState('dark');
  const [profileImage, setProfileImage] = useState('/assets/profile.jpg');

  // Theme logic
  useEffect(() => {
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

  // Profile image fetch
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

  // Section observer
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    const observerOptions = {
      root: null,
      rootMargin: '-40% 0px -40% 0px',
      threshold: 0
    };

    const observerCallback = (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    const sections = ['home', ...navLinks.map(link => link.id)];
    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) observer.unobserve(el);
      });
    };
  }, []);

  const isHome = window.location.pathname === '/';

  return (
    <nav className={`navbar-wrapper ${scrolled ? 'navbar-scrolled' : ''}`}>
      <div className="navbar-capsule">
        {/* Left: Brand */}
        <div className="navbar-left">
          <a href={isHome ? "#home" : "/#home"} className="navbar-brand">
            <div className="brand-avatar">
              <img src={profileImage} alt="MR.PREM" />
            </div>
            <span className="brand-name gradient-text">MR.PREM</span>
          </a>
        </div>

        {/* Center: Desktop Links */}
        <div className="navbar-center desktop-only">
          <ul className="nav-menu">
            {navLinks.map((link) => (
              <li 
                key={link.id}
                onMouseEnter={() => setHoveredSection(link.id)}
                onMouseLeave={() => setHoveredSection(null)}
              >
                <a 
                  href={isHome ? `#${link.id}` : `/#${link.id}`}
                  className={`nav-link ${activeSection === link.id ? 'active' : ''}`}
                >
                  {link.name}
                </a>
                
                {/* Sliding Highlight */}
                <AnimatePresence>
                  {(hoveredSection === link.id || (activeSection === link.id && !hoveredSection)) && (
                    <motion.div
                      layoutId="nav-highlight"
                      className="nav-highlight-pill"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                </AnimatePresence>
              </li>
            ))}
          </ul>
        </div>

        {/* Right: Actions */}
        <div className="navbar-right">
          <button className="theme-btn desktop-only" onClick={toggleTheme} aria-label="Toggle Theme">
            {theme === 'dark' ? <FaSun /> : <FaMoon />}
          </button>
          <button className="mobile-toggle-btn" onClick={() => setIsMobileMenuOpen(true)}>
            <FaBars />
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              className="mobile-overlay-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div 
              className="mobile-menu-drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              <div className="mobile-menu-header">
                <span className="brand-name gradient-text">MR.PREM</span>
                <button className="mobile-close-btn" onClick={() => setIsMobileMenuOpen(false)}>
                  <FaTimes />
                </button>
              </div>

              <ul className="mobile-nav-links">
                {navLinks.map((link, idx) => (
                  <motion.li 
                    key={link.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <a 
                      href={isHome ? `#${link.id}` : `/#${link.id}`} 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={activeSection === link.id ? 'active' : ''}
                    >
                      {link.name}
                    </a>
                  </motion.li>
                ))}
              </ul>

              <div className="mobile-menu-footer">
                <div className="mobile-socials">
                  <a href="https://github.com/MRPREM31" target="_blank" rel="noreferrer"><FaGithub /></a>
                  <a href="https://linkedin.com/in/mrprem31" target="_blank" rel="noreferrer"><FaLinkedin /></a>
                  <a href="https://instagram.com/mr.prem_31" target="_blank" rel="noreferrer"><FaInstagram /></a>
                  <a href="https://wa.me/917846835010" target="_blank" rel="noreferrer"><FaWhatsapp /></a>
                </div>
                <button className="mobile-theme-btn" onClick={toggleTheme}>
                  {theme === 'dark' ? <><FaSun /> Light Mode</> : <><FaMoon /> Dark Mode</>}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
