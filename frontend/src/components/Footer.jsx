import React, { useState, useEffect } from 'react';
import { FaGithub, FaLinkedin, FaYoutube, FaMediumM, FaEnvelope } from 'react-icons/fa';
import './Footer.css';

const Footer = () => {
  const [signature, setSignature] = useState('');

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/signature`)
      .then(res => res.json())
      .then(data => {
        if (data.signatureUrl) {
          setSignature(data.signatureUrl.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL}${data.signatureUrl}` : data.signatureUrl);
        }
      })
      .catch(err => console.error('Error fetching signature:', err));
  }, []);

  return (
    <footer className="footer-premium">
      <div className="footer-top">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <h2 className="logo gradient-text">MR.PREM</h2>
              <p>Building digital experiences that combine innovative design with clean, functional code.</p>
              {signature && (
                <div className="signature-container">
                  <img src={signature} alt="Prem Signature" className="footer-signature" />
                </div>
              )}
            </div>
            
            <div className="footer-links-section">
              <h4>Quick Links</h4>
              <ul>
                {/* Internal Section Links */}
                <li><a href="#about">About</a></li>
                <li><a href="#skills">Skills</a></li>
                <li><a href="#projects">Projects</a></li>
                <li><a href="#certificates">Certificates</a></li>
                
                {/* External Professional Links */}
                <li><a href="https://www.quantumcoderstechlab.codes/quantumcoders-data-solutions.html" target="_blank" rel="noopener noreferrer">QCDS</a></li>
                <li><a href="https://www.quantumcoderstechlab.codes/qcds_items/profile.html?uid=9827775230" target="_blank" rel="noopener noreferrer">QCDS ID Card</a></li>
                <li><a href="https://www.quantumcoderstechlab.codes/" target="_blank" rel="noopener noreferrer">QCTL</a></li>
                <li><a href="/prem-login-2026" target="_blank" rel="noopener noreferrer">Admin Login</a></li>
              </ul>
            </div>

            <div className="footer-contact-section">
              <h4>Contact</h4>
              <p><FaEnvelope /> mr.prem2006@gmail.com</p>
              <p>📍 Odisha, India</p>
            </div>

            <div className="footer-social-section">
              <h4>Follow Me</h4>
              <div className="social-icons">
                <a href="https://github.com/MRPREM31" target="_blank" rel="noreferrer"><FaGithub /></a>
                <a href="https://www.linkedin.com/in/prem-prasad-pradhan-18472b295/" target="_blank" rel="noreferrer"><FaLinkedin /></a>
                <a href="https://youtube.com/@B.techPrem" target="_blank" rel="noreferrer"><FaYoutube /></a>
                <a href="https://medium.com/@mr.prem" target="_blank" rel="noreferrer"><FaMediumM /></a>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="footer-bottom">
        <div className="container">
          <p>&copy; 2026 Prem Prasad Pradhan. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
