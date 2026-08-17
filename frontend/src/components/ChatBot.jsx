import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPaperPlane, FaTimes, FaMinus, FaChevronUp, FaPlus, FaTrash } from 'react-icons/fa';
import { FiMessageSquare, FiUser } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import './ChatBot.css';

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [profileImage, setProfileImage] = useState('/assets/profile.jpg');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  // Initialize from LocalStorage
  const [chatHistory, setChatHistory] = useState(() => {
    const saved = localStorage.getItem('prembot_history');
    return saved ? JSON.parse(saved) : [
      { 
        role: 'assistant', 
        content: "SYSTEM_ONLINE: Greetings. I am PremBot, your AI guide. How can I assist you today?",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });
  
  const [loading, setLoading] = useState(false);
  const [contactStep, setContactStep] = useState(null);
  const [contactData, setContactData] = useState({ name: '', email: '', message: '' });

  const chatEndRef = useRef(null);

  const suggestions = [
    "Tell me about Prem",
    "Show Featured Projects",
    "Technical Skills",
    "Contact Details"
  ];

  // Save to LocalStorage
  useEffect(() => {
    localStorage.setItem('prembot_history', JSON.stringify(chatHistory));
  }, [chatHistory]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/navbar-image`)
      .then(res => res.json())
      .then(data => {
        if (data.imageUrl) {
          setProfileImage(data.imageUrl.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL}${data.imageUrl}` : data.imageUrl);
        }
      })
      .catch(err => console.error('Error fetching navbar image:', err));
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, loading, showClearConfirm]);

  const handleClearHistory = () => {
    const initialMsg = [{ 
      role: 'assistant', 
      content: "SYSTEM_REBOOT: History cleared. How can I help you afresh?",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }];
    setChatHistory(initialMsg);
    localStorage.removeItem('prembot_history');
    setContactStep(null);
    setContactData({ name: '', email: '', message: '' });
    setShowClearConfirm(false);
  };

  const handleSendMessage = async (msgText) => {
    const textToSend = typeof msgText === 'string' ? msgText : message;
    if (!textToSend.trim() || loading) return;

    const userMessage = { 
      role: 'user', 
      content: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatHistory(prev => [...prev, userMessage]);
    setMessage('');

    if (contactStep) {
      handleContactStep(textToSend);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          history: chatHistory.slice(-5).map(({ role, content }) => ({ role, content }))
        }),
      });

      const data = await response.json();
      const botResponse = data.response || "Neural Link Error.";

      if (botResponse.includes("[TRIGGER_CONTACT_FLOW]")) {
        setContactStep('name');
        setChatHistory(prev => [...prev, { 
          role: 'assistant', 
          content: "INITIATING_SECURE_CONTACT: I'll help you reach Prem. First, could you please tell me your **Full Name**?",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      } else {
        setChatHistory(prev => [...prev, { 
          role: 'assistant', 
          content: botResponse,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      }
    } catch (err) {
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: "SYSTEM_ERROR: Neural Link Timeout.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleContactStep = async (input) => {
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    // Intelligence: Detect if user wants to cancel or expresses refusal
    const lowerInput = input.toLowerCase().trim();
    const cancellationPhrases = ['no', 'cancel', 'stop', 'exit', 'not now', 'nevermind', 'not need', 'not really', 'not today', 'dont want'];
    
    if (cancellationPhrases.includes(lowerInput) || (lowerInput.length < 4 && cancellationPhrases.some(p => lowerInput.includes(p)))) {
      setContactStep(null);
      setContactData({ name: '', email: '', message: '' });
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: "SYSTEM_RECOVERY: Understood. Contact flow cancelled. What other information can I provide? I can discuss Prem's **Technical Skills**, **Featured Projects**, or his **Career Journey**.",
        time: currentTime
      }]);
      return;
    }

    if (contactStep === 'name') {
      setContactData(prev => ({ ...prev, name: input }));
      setContactStep('email');
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: `Nice to meet you, **${input}**. Now, what is your **Email Address**?`,
        time: currentTime
      }]);
    } 
    else if (contactStep === 'email') {
      if (!emailRegex.test(input)) {
        setChatHistory(prev => [...prev, { 
          role: 'assistant', 
          content: "SYSTEM_ALERT: Invalid email format detected. Please provide a valid email address (e.g., name@example.com) so Prem can reach you.",
          time: currentTime
        }]);
        return;
      }
      setContactData(prev => ({ ...prev, email: input }));
      setContactStep('message');
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: "Got it. Finally, please share **why you'd like to contact Prem** (your message).",
        time: currentTime
      }]);
    } 
    else if (contactStep === 'message') {
      const finalData = { ...contactData, message: input };
      setContactData(finalData);
      setContactStep(null);
      setLoading(true);
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: "Thanks for giving details. Processing your request...",
        time: currentTime
      }]);

      try {
        const scriptURL = 'https://script.google.com/macros/s/AKfycbywSKVXF6Du7Qqb-TrIwoz3dsHwVL44KxyhwAc7Fm8ikADpTs9gdDFsRP0rzdYKomr6Ug/exec';
        const payload = new FormData();
        payload.append('name', finalData.name);
        payload.append('email', finalData.email);
        payload.append('message', finalData.message);
        
        const googlePromise = fetch(scriptURL, { method: 'POST', body: payload });
        const localPromise = fetch(`${import.meta.env.VITE_API_URL}/api/contact`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(finalData)
        });

        await Promise.all([googlePromise.catch(() => {}), localPromise.catch(() => {})]);

        setChatHistory(prev => [...prev, { 
          role: 'assistant', 
          content: "SUCCESS: Your message has been stored in the MR.PREM database.\n\nPrem will get back to you soon for further information. Please check your email for a confirmation shortly.",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      } catch (err) {
        setChatHistory(prev => [...prev, { 
          role: 'assistant', 
          content: "SYSTEM_ALER: Database sync failed, but Prem has been notified.",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      } finally {
        setLoading(false);
        setContactData({ name: '', email: '', message: '' });
      }
    }
  };

  return (
    <div className="chatbot-wrapper">
      {!isOpen && (
        <motion.button 
          className="chatbot-toggle"
          onClick={() => setIsOpen(true)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.div 
            className="toggle-flip-wrap"
            animate={{ rotateY: isHovered ? 180 : 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            style={{ transformStyle: "preserve-3d" }}
          >
            <div className="toggle-front">
              <FiMessageSquare />
            </div>
            <div className="toggle-back">
              <img src={profileImage} alt="Prem" />
            </div>
          </motion.div>
          <span className="toggle-label-hover">MRPREM AI</span>
        </motion.button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className={`chatbot-window ${isMinimized ? 'minimized' : ''}`}
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
          >
            <div className="chatbot-header">
              <div className="header-identity">
                <div className="bot-profile-img-wrap">
                  <img src={profileImage} alt="PremBot" />
                  <div className="status-dot"></div>
                </div>
                <div className="header-text">
                  <h3>PremBot AI</h3>
                  <p>Zenemoo Intelligence v1.0</p>
                </div>
              </div>
              <div className="header-nav">
                <div className="nav-btn-wrap" data-tooltip="Clear Chat">
                  <button onClick={() => setShowClearConfirm(true)}><FaTrash /></button>
                </div>
                <div className="nav-btn-wrap" data-tooltip={isMinimized ? "Expand" : "Minimize"}>
                  <button onClick={() => setIsMinimized(!isMinimized)}>
                    {isMinimized ? <FaPlus /> : <FaMinus />}
                  </button>
                </div>
                <div className="nav-btn-wrap" data-tooltip="Close">
                  <button onClick={() => setIsOpen(false)}><FaTimes /></button>
                </div>
              </div>
            </div>

            {!isMinimized && (
              <>
                <div className="chat-body">
                  {chatHistory.map((msg, index) => (
                    <div key={index} className={`message-group ${msg.role}`}>
                      <div className="msg-avatar">
                        {msg.role === 'assistant' ? <img src={profileImage} alt="Prem" /> : <FiUser />}
                      </div>
                      <div className="msg-content-wrap">
                        <div className="msg-bubble">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                        <span className="msg-time">{msg.time}</span>
                      </div>
                    </div>
                  ))}
                  
                  {showClearConfirm && (
                    <motion.div 
                      className="clear-confirm-overlay"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="confirm-box">
                        <p>Clear all chat history?</p>
                        <div className="confirm-actions">
                          <button onClick={handleClearHistory} className="confirm-yes">Yes, Clear</button>
                          <button onClick={() => setShowClearConfirm(false)} className="confirm-no">Cancel</button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {loading && (
                    <div className="message-group assistant">
                      <div className="msg-avatar">
                        <img src={profileImage} alt="Prem" />
                      </div>
                      <div className="msg-content-wrap">
                        <div className="msg-bubble typing-wrap">
                          <div className="typing-dot"></div>
                          <div className="typing-dot"></div>
                          <div className="typing-dot"></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {!contactStep && !showClearConfirm && (
                  <div className="quick-suggestions">
                    {suggestions.map((s, i) => (
                      <button key={i} className="suggestion-chip" onClick={() => handleSendMessage(s)}>
                        {s}
                      </button>
                    ))}
                  </div>
                )}

                <div className="chat-footer">
                  <form className="input-container" onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}>
                    <input 
                      type="text" 
                      placeholder={contactStep ? `Provide your ${contactStep}...` : "Ask me anything..."}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      disabled={showClearConfirm}
                    />
                    <button type="submit" className="send-btn" disabled={loading || !message.trim() || showClearConfirm}>
                      <FaPaperPlane />
                    </button>
                  </form>
                </div>
              </>
            )}

            {isMinimized && (
              <div className="minimized-click-area" onClick={() => setIsMinimized(false)}>
                <p>Chat with PremBot AI</p>
                <FaPlus />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatBot;
