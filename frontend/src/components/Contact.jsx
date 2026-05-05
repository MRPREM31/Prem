import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaPaperPlane, FaWhatsapp, FaEnvelope, FaCheckCircle } from 'react-icons/fa';
import './Contact.css';

const Contact = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const scriptURL = 'https://script.google.com/macros/s/AKfycbywSKVXF6Du7Qqb-TrIwoz3dsHwVL44KxyhwAc7Fm8ikADpTs9gdDFsRP0rzdYKomr6Ug/exec';
      
      const payload = new FormData();
      payload.append('name', formData.name);
      payload.append('email', formData.email);
      payload.append('message', formData.message);

      // Send to Google Apps Script
      const googlePromise = fetch(scriptURL, {
        method: 'POST',
        body: payload
      });

      // Send to local backend admin dashboard
      const localPromise = fetch('http://localhost:5000/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      // Wait for both to finish
      const [googleRes, localRes] = await Promise.all([
        googlePromise.catch(e => ({ ok: false, error: e })), 
        localPromise.catch(e => ({ ok: false, error: e }))
      ]);
      
      if (googleRes.ok || localRes.ok) {
        setStatus({ type: 'success', text: 'Message sent successfully!' });
        setFormData({ name: '', email: '', message: '' });
      } else {
        setStatus({ type: 'error', text: 'Something went wrong. Please try alternative methods.' });
      }
    } catch (err) {
      console.error("Error submitting form:", err);
      setStatus({ type: 'success', text: 'Message sent successfully!' });
      setFormData({ name: '', email: '', message: '' });
    }
    setLoading(false);
  };

  return (
    <section id="contact" className="section contact-section">
      <div className="container">
        <motion.h2 
          className="section-title gradient-text"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          Let's Connect
        </motion.h2>

        <motion.div 
          className="contact-container glass-panel"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="contact-info">
            <h3>Ready to build something amazing?</h3>
            <p>Whether it's a project, job opportunity, or just a chat, feel free to reach out.</p>
          </div>

          {status && status.type === 'success' ? (
            <motion.div 
              className="success-card"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <FaCheckCircle className="success-icon" />
              <h3>Thank You for Reaching Out!</h3>
              <p>Your message has been successfully sent. My expected response time is within <strong>48 hours</strong>.</p>
              
              <div className="alternative-contact">
                <p>For urgent inquiries, you can also reach me directly:</p>
                <div className="contact-buttons">
                  <a href="mailto:mr.prem2006@gmail.com" className="btn btn-outline">
                    <FaEnvelope /> Email Me
                  </a>
                  <a 
                    href="https://wa.me/919827775230?text=Hello%2C%20this%20is%20%5BYour%20Name%5D.%20I%20am%20contacting%20you%20from%20the%20portfolio%20website." 
                    target="_blank" 
                    rel="noreferrer" 
                    className="btn whatsapp-btn"
                  >
                    <FaWhatsapp /> WhatsApp Me
                  </a>
                </div>
              </div>
              <button className="btn btn-secondary mt-4" onClick={() => setStatus(null)}>Send Another Message</button>
            </motion.div>
          ) : (
            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <input 
                  type="text" 
                  name="name" 
                  placeholder="Your Name" 
                  value={formData.name} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              <div className="form-group">
                <input 
                  type="email" 
                  name="email" 
                  placeholder="Your Email" 
                  value={formData.email} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              <div className="form-group">
                <textarea 
                  name="message" 
                  placeholder="Your Message" 
                  rows="5" 
                  value={formData.message} 
                  onChange={handleChange} 
                  required 
                ></textarea>
              </div>
              
              {status && status.type === 'error' && (
                <div className={`status-msg error`}>
                  {status.text}
                </div>
              )}
              
              <button type="submit" className="btn btn-primary submit-btn" disabled={loading}>
                {loading ? 'Sending...' : <><FaPaperPlane /> Send Message</>}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default Contact;
