import React, { useState, useEffect } from 'react';
import { FaSun, FaMoon, FaBars, FaTimes, FaGithub, FaLinkedin, FaInstagram, FaWhatsapp } from 'react-icons/fa';
import './Navbar.css';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  // Theme logic
  const [theme, setTheme] = useState('dark');
  const [profileImage, setProfileImage] = useState('/assets/profile.jpg');

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
      if (isMobileMenuOpen) setIsMobileMenuOpen(false);
    };

    const updateIndicator = () => {
      const activeLink = document.querySelector('.nav-links li.activeSection');
      const indicator = document.querySelector('.nav-indicator-line');
      if (activeLink && indicator) {
        const { offsetLeft, offsetWidth } = activeLink;
        indicator.style.left = `${offsetLeft}px`;
        indicator.style.width = `${offsetWidth}px`;
        indicator.style.opacity = '1';
      } else if (indicator) {
        indicator.style.opacity = '0';
      }
    };

    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -70% 0px',
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
    const sections = ['home', 'about', 'skills', 'experience', 'projects', 'certificates', 'journey', 'contact'];
    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', updateIndicator);

    // Initial update
    updateIndicator();
    setTimeout(updateIndicator, 100);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateIndicator);
      sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) observer.unobserve(el);
      });
    };
  }, [isMobileMenuOpen, activeSection]);

  const isHome = window.location.pathname === '/';

  return (
    <nav className={`navbar ${scrolled ? 'scrolled glass-panel' : ''}`}>
      <div className="container nav-container">
        <a href={isHome ? "#home" : "/#home"} className="logo-container">
          <img src={profileImage} alt="MR.PREM" className="nav-profile-img" />
          <span className="logo gradient-text">MR.PREM</span>
        </a>

        <div className={`nav-links-wrapper ${isMobileMenuOpen ? 'open' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
          <div className="mobile-menu-header-premium">
            <span className="logo gradient-text">MR.PREM</span>
            <p className="mobile-subtitle">Software Developer</p>
          </div>

          <button className="mobile-close-btn" onClick={() => setIsMobileMenuOpen(false)}>
            <FaTimes />
          </button>

          <ul className="nav-links" onClick={(e) => e.stopPropagation()}>
            <li style={{ "--i": 1 }} className={activeSection === 'about' ? 'activeSection' : ''}><a href={isHome ? "#about" : "/#about"} onClick={() => setIsMobileMenuOpen(false)}>About</a></li>
            <li style={{ "--i": 2 }} className={activeSection === 'skills' ? 'activeSection' : ''}><a href={isHome ? "#skills" : "/#skills"} onClick={() => setIsMobileMenuOpen(false)}>Skills</a></li>
            <li style={{ "--i": 3 }} className={activeSection === 'experience' ? 'activeSection' : ''}><a href={isHome ? "#experience" : "/#experience"} onClick={() => setIsMobileMenuOpen(false)}>Experience</a></li>
            <li style={{ "--i": 4 }} className={activeSection === 'projects' ? 'activeSection' : ''}><a href={isHome ? "#projects" : "/#projects"} onClick={() => setIsMobileMenuOpen(false)}>Projects</a></li>
            <li style={{ "--i": 5 }} className={activeSection === 'certificates' ? 'activeSection' : ''}><a href={isHome ? "#certificates" : "/#certificates"} onClick={() => setIsMobileMenuOpen(false)}>Certificates</a></li>
            <li style={{ "--i": 6 }} className={activeSection === 'journey' ? 'activeSection' : ''}><a href={isHome ? "#journey" : "/#journey"} onClick={() => setIsMobileMenuOpen(false)}>My Journey</a></li>
            <li style={{ "--i": 7 }} className={activeSection === 'contact' ? 'activeSection' : ''}><a href={isHome ? "#contact" : "/#contact"} className="contact-btn" onClick={() => setIsMobileMenuOpen(false)}>Contact Me</a></li>
            <div className="nav-indicator-line"></div>

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
