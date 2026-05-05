import React from 'react';
import { FaGithub, FaLinkedin, FaYoutube, FaMediumM } from 'react-icons/fa';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer glass-panel">
      <div className="container footer-container">
        <p>Made by MR.PREM | &copy; 2026 All Rights Reserved</p>
        <div className="footer-social-links">
          <a href="https://github.com/MRPREM31" target="_blank" rel="noreferrer"><FaGithub /></a>
          <a href="https://www.linkedin.com/in/prem-prasad-pradhan-18472b295/" target="_blank" rel="noreferrer"><FaLinkedin /></a>
          <a href="https://youtube.com/@B.techPrem" target="_blank" rel="noreferrer"><FaYoutube /></a>
          <a href="https://medium.com/@mr.prem" target="_blank" rel="noreferrer"><FaMediumM /></a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
