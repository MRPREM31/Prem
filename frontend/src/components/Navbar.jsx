import React, { useState, useEffect } from 'react';
import { FaSun, FaMoon, FaBars, FaTimes, FaGithub, FaLinkedin, FaInstagram, FaWhatsapp } from 'react-icons/fa';
import { optimizeCloudinaryUrl } from '../utils/cloudinary';
import NotificationBell from './NotificationBell';
import useFetch from '../hooks/useFetch';
import fallbackProfile from '../data/fallbackProfile';
import './Navbar.css';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  // Theme logic
  const [theme, setTheme] = useState('dark');

  const { data: navbarData } = useFetch('/api/navbar-image', { imageUrl: fallbackProfile.navbarImageUrl });

  const rawNavbarImage = navbarData?.imageUrl || fallbackProfile.navbarImageUrl || '';
  const profileImage = (rawNavbarImage && typeof rawNavbarImage === 'string' && rawNavbarImage.startsWith('/uploads'))
    ? optimizeCloudinaryUrl(`${import.meta.env.VITE_API_URL}${rawNavbarImage}`, 100)
    : optimizeCloudinaryUrl(rawNavbarImage || '/assets/profile.jpg', 100);

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
    const sections = ['home', 'about', 'skills', 'experience', 'projects', 'certificates', 'journey', 'memories', 'contact'];
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

  const currentPath = window.location.pathname;
  const isAdmin = currentPath === '/prem-dashboard-2026' || currentPath === '/prem-media-library';
  const isHome = currentPath === '/';
  const isMediaLibrary = currentPath === '/prem-media-library';

  return (
    <nav className={`navbar ${scrolled ? 'scrolled glass-panel' : ''}`}>
      <div className="container nav-container">
        <a href={isHome ? "#home" : isAdmin ? "/prem-dashboard-2026" : "/#home"} className="logo-container">
          <img src={profileImage} alt="Prem Prasad Pradhan Portfolio Logo" className="nav-profile-img" />
          <span className="logo gradient-text">MR.PREM</span>
        </a>

        <div className={`nav-links-wrapper ${isMobileMenuOpen ? 'open' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
          <div className="mobile-menu-header-premium">
            <div className="logo-container">
              <img src={profileImage} alt="Prem Prasad Pradhan Mobile Menu Logo" className="nav-profile-img mobile-header-img" />
              <span className="logo gradient-text">MR.PREM</span>
            </div>
            <p className="mobile-subtitle">{isAdmin ? 'Admin Panel' : 'Software Developer'}</p>
          </div>

          <button className="mobile-close-btn" onClick={() => setIsMobileMenuOpen(false)}>
            <FaTimes />
          </button>

          <ul className="nav-links" onClick={(e) => e.stopPropagation()}>
            {isAdmin ? (
              <>
                <li style={{ "--i": 1 }}><a href={isMediaLibrary ? "/prem-dashboard-2026" : "/prem-dashboard-2026"} onClick={() => setIsMobileMenuOpen(false)}>Dashboard</a></li>
                <li style={{ "--i": 2 }} className={isMediaLibrary ? 'activeSection' : ''}><a href="/prem-media-library" onClick={() => setIsMobileMenuOpen(false)}>Media Library</a></li>
                <li style={{ "--i": 3 }}><a href={isMediaLibrary ? "/prem-dashboard-2026#admin-stats" : "#admin-stats"} onClick={() => setIsMobileMenuOpen(false)}>Stats</a></li>
                <li style={{ "--i": 4 }}><a href={isMediaLibrary ? "/prem-dashboard-2026#admin-projects" : "#admin-projects"} onClick={() => setIsMobileMenuOpen(false)}>Projects</a></li>
                <li style={{ "--i": 5 }}><a href={isMediaLibrary ? "/prem-dashboard-2026#admin-certificates" : "#admin-certificates"} onClick={() => setIsMobileMenuOpen(false)}>Certificates</a></li>
                <li style={{ "--i": 6 }}><a href={isMediaLibrary ? "/prem-dashboard-2026#admin-memories" : "#admin-memories"} onClick={() => setIsMobileMenuOpen(false)}>Memories</a></li>
                <li style={{ "--i": 7 }}><a href={isMediaLibrary ? "/prem-dashboard-2026#admin-messages" : "/prem-dashboard-2026#admin-messages"} className="contact-btn" onClick={() => setIsMobileMenuOpen(false)}>Messages</a></li>
              </>
            ) : (
              <>
                <li style={{ "--i": 1 }} className={activeSection === 'about' ? 'activeSection' : ''}><a href={isHome ? "#about" : "/#about"} onClick={() => setIsMobileMenuOpen(false)}>About</a></li>
                <li style={{ "--i": 2 }} className={activeSection === 'skills' ? 'activeSection' : ''}><a href={isHome ? "#skills" : "/#skills"} onClick={() => setIsMobileMenuOpen(false)}>Skills</a></li>
                <li style={{ "--i": 3 }} className={activeSection === 'experience' ? 'activeSection' : ''}><a href={isHome ? "#experience" : "/#experience"} onClick={() => setIsMobileMenuOpen(false)}>Experience</a></li>
                <li style={{ "--i": 4 }} className={activeSection === 'projects' ? 'activeSection' : ''}><a href={isHome ? "#projects" : "/#projects"} onClick={() => setIsMobileMenuOpen(false)}>Projects</a></li>
                <li style={{ "--i": 5 }} className={activeSection === 'certificates' ? 'activeSection' : ''}><a href={isHome ? "#certificates" : "/#certificates"} onClick={() => setIsMobileMenuOpen(false)}>Certificates</a></li>
                <li style={{ "--i": 6 }} className={activeSection === 'journey' ? 'activeSection' : ''}><a href={isHome ? "#journey" : "/#journey"} onClick={() => setIsMobileMenuOpen(false)}>My Journey</a></li>
                <li style={{ "--i": 7 }} className={activeSection === 'memories' ? 'activeSection' : ''}><a href={isHome ? "#memories" : "/#memories"} onClick={() => setIsMobileMenuOpen(false)}>Memories</a></li>
                <li style={{ "--i": 8 }} className={currentPath === '/articles' ? 'activeSection' : ''}><a href="/articles" onClick={() => setIsMobileMenuOpen(false)}>Articles</a></li>
                <li style={{ "--i": 9 }}><a href={isHome ? "#contact" : "/#contact"} className="contact-btn" onClick={() => setIsMobileMenuOpen(false)}>Contact Me</a></li>
              </>
            )}
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
              <a href="https://www.linkedin.com/in/prem-prasad-pradhan-18472b295/" target="_blank" rel="noreferrer"><FaLinkedin /></a>
              <a href="https://youtube.com/@B.techPrem" target="_blank" rel="noreferrer"><FaInstagram /></a>
              <a href="https://wa.me/919827775230?text=Hello%2C%20this%20is%20%5BYour%20Name%5D.%20I%20am%20contacting%20you%20from%20the%20portfolio%20website." target="_blank" rel="noreferrer"><FaWhatsapp /></a>
            </div>
            <button className="theme-toggle-btn-mobile" onClick={toggleTheme}>
              {theme === 'dark' ? <><FaSun /> Light Mode</> : <><FaMoon /> Dark Mode</>}
            </button>
          </div>
        </div>

        <div className="nav-actions">
          <NotificationBell />
          <button className="mobile-toggle" onClick={() => setIsMobileMenuOpen(true)}>
            <FaBars />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
