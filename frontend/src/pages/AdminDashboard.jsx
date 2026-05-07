import React, { useEffect, useState } from 'react';
import SEO from '../components/SEO';
import { useNavigate } from 'react-router-dom';
import { FaTrash, FaSignOutAlt, FaUpload, FaEdit, FaPlus } from 'react-icons/fa';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './Admin.css';

const AdminDashboard = () => {
  const [messages, setMessages] = useState([]);
  
  // Image & Resume states
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploadImgStatus, setUploadImgStatus] = useState('');
  const [currentImage, setCurrentImage] = useState('');
  
  const [selectedResume, setSelectedResume] = useState(null);
  const [uploadResStatus, setUploadResStatus] = useState('');
  const [currentResume, setCurrentResume] = useState('');

  // Projects states
  const [projects, setProjects] = useState([]);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [projectForm, setProjectForm] = useState({
    title: '', description: '', tags: '', link: '', github: '', pptLink: ''
  });

  // Favicon states
  const [selectedFavicon, setSelectedFavicon] = useState(null);
  const [uploadFavStatus, setUploadFavStatus] = useState('');
  const [currentFavicon, setCurrentFavicon] = useState('');

  // Signature states
  const [selectedSignature, setSelectedSignature] = useState(null);
  const [uploadSigStatus, setUploadSigStatus] = useState('');
  const [currentSignature, setCurrentSignature] = useState('');

  // Stats states
  const [stats, setStats] = useState({
    years_exp: '',
    projects_completed: '',
    startups_leadership: ''
  });
  const [statsLoading, setStatsLoading] = useState(false);

  // Navbar image states
  const [selectedNavbarImg, setSelectedNavbarImg] = useState(null);
  const [uploadNavStatus, setUploadNavStatus] = useState('');
  const [currentNavbarImg, setCurrentNavbarImg] = useState('');
  
  const [greeting, setGreeting] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  // Certificates states
  const [certificates, setCertificates] = useState([]);
  const [showCertForm, setShowCertForm] = useState(false);
  const [editingCert, setEditingCert] = useState(null);
  const [certForm, setCertForm] = useState({ title: '', description: '', date: '', image: null });

  // Memorable Images states
  const [memorableImages, setMemorableImages] = useState([]);
  const [showMemImageForm, setShowMemImageForm] = useState(false);
  const [memImageForm, setMemImageForm] = useState({ title: '', image: null });
  const [memImageLoading, setMemImageLoading] = useState(false);

  // Skills states
  const [skillCategories, setSkillCategories] = useState([]);
  const [skillsLoading, setSkillsLoading] = useState(false);

  const navigate = useNavigate();
  const token = localStorage.getItem('adminToken');

  useEffect(() => {
    if (!token) {
      navigate('/prem-login-2026');
      return;
    }

    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');

    fetchMessages();
    fetchProfileImage();
    fetchResume();
    fetchProjects();
    fetchFavicon();
    fetchCertificates();
    fetchSignature();
    fetchStats();
    fetchNavbarImage();
    fetchSkills();
    fetchMemorableImages();
  }, [token, navigate]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/prem-login-2026');
  };

  // --- FETCH DATA ---
  const fetchMessages = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/messages`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.status === 403 || res.status === 401) return handleLogout();
      const data = await res.json();
      setMessages(data);
    } catch (err) { console.error(err); }
  };

  const fetchProfileImage = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/profile-image`);
      const data = await res.json();
      setCurrentImage(data.imageUrl.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL}${data.imageUrl}` : data.imageUrl);
    } catch (err) { console.error(err); }
  };

  const fetchResume = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/resume`);
      const data = await res.json();
      setCurrentResume(data.resumeUrl.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL}${data.resumeUrl}` : data.resumeUrl);
    } catch (err) { console.error(err); }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/projects?t=${Date.now()}`);
      const data = await res.json();
      setProjects(data);
    } catch (err) { console.error(err); }
  };

  const fetchFavicon = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/favicon?t=${Date.now()}`);
      const data = await res.json();
      const favUrl = data.faviconUrl.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL}${data.faviconUrl}?t=${Date.now()}` : data.faviconUrl;
      setCurrentFavicon(favUrl);
      
      let link = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = favUrl;
    } catch (err) { console.error(err); }
  };

  const fetchCertificates = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/certificates?t=${Date.now()}`);
      const data = await res.json();
      setCertificates(data);
    } catch (err) { console.error(err); }
  };

  const fetchSignature = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/signature?t=${Date.now()}`);
      const data = await res.json();
      const sigUrl = data.signatureUrl && data.signatureUrl.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL}${data.signatureUrl}` : data.signatureUrl;
      setCurrentSignature(sigUrl || '');
    } catch (err) { console.error(err); }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/stats`);
      const data = await res.json();
      setStats(data);
    } catch (err) { console.error(err); }
  };

  const fetchNavbarImage = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/navbar-image`);
      const data = await res.json();
      setCurrentNavbarImg(data.imageUrl.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL}${data.imageUrl}` : data.imageUrl);
    } catch (err) { console.error(err); }
  };

  const fetchSkills = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/skills`);
      const data = await res.json();
      setSkillCategories(data);
    } catch (err) { console.error(err); }
  };

  const fetchMemorableImages = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/memorable-images?t=${Date.now()}`);
      const data = await res.json();
      setMemorableImages(data);
    } catch (err) { console.error(err); }
  };

  // --- UPLOADS ---
  const handleUpload = async (file, type, setStatusCallback, fetchCallback) => {
    if (!file) return showToast('Please select a file first.', 'error');
    const formData = new FormData();
    formData.append(type, file);
    try {
      setStatusCallback('Uploading...');
      let endpoint = '';
      if (type === 'image') endpoint = 'upload-profile';
      else if (type === 'resume') endpoint = 'upload-resume';
      else if (type === 'favicon') endpoint = 'upload-favicon';
      else if (type === 'signature') endpoint = 'upload-signature';
      else if (type === 'navbar') endpoint = 'upload-navbar';
      
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/${endpoint}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setStatusCallback('Upload successful!');
        showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} updated successfully`);
        fetchCallback();
      } else {
        setStatusCallback(`Error`);
        showToast(data.error || 'Upload failed', 'error');
      }
    } catch (err) {
      setStatusCallback('Error');
      showToast('Network error during upload', 'error');
    }
  };

  // --- PROJECTS CRUD ---
  const handleProjectSubmit = async (e) => {
    e.preventDefault();
    try {
      const method = editingProject ? 'PUT' : 'POST';
      const url = editingProject 
        ? `${import.meta.env.VITE_API_URL}/api/admin/projects/${editingProject.id}` 
        : `${import.meta.env.VITE_API_URL}/api/admin/projects`;
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(projectForm)
      });
      if (res.ok) {
        fetchProjects();
        setShowProjectForm(false);
        setEditingProject(null);
        setProjectForm({ title: '', description: '', tags: '', link: '', github: '', pptLink: '' });
        showToast(editingProject ? 'Project updated' : 'Project created');
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to save project', 'error');
      }
    } catch (err) { 
      console.error(err);
      showToast('Network error: Could not connect to the backend.', 'error');
    }
  };

  const deleteProject = async (id) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/projects/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast('Project deleted');
        fetchProjects();
      } else {
        showToast('Failed to delete project', 'error');
      }
    } catch (err) { 
      console.error(err);
      showToast('Network error', 'error');
    }
  };

  const handleCertSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('title', certForm.title);
      formData.append('description', certForm.description);
      formData.append('date', certForm.date);
      if (certForm.image) {
        formData.append('certificate_image', certForm.image);
      } else if (!editingCert) {
        return alert("Please select an image");
      }

      const method = editingCert ? 'PUT' : 'POST';
      const url = editingCert 
        ? `${import.meta.env.VITE_API_URL}/api/admin/certificates/${editingCert.id}` 
        : `${import.meta.env.VITE_API_URL}/api/admin/certificates`;
      
      const res = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        fetchCertificates();
        setShowCertForm(false);
        setEditingCert(null);
        setCertForm({ title: '', description: '', date: '', image: null });
        showToast(editingCert ? 'Certificate updated' : 'Certificate created');
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to save certificate', 'error');
      }
    } catch (err) { 
      console.error(err);
      showToast('Network error: Could not connect to the backend.', 'error');
    }
  };

  const deleteCertificate = async (id) => {
    if (!window.confirm('Are you sure you want to delete this certificate?')) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/certificates/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast('Certificate deleted');
        fetchCertificates();
      } else {
        showToast('Failed to delete certificate', 'error');
      }
    } catch (err) { 
      console.error(err);
      showToast('Network error', 'error');
    }
  };

  const handleMemImageSubmit = async (e) => {
    e.preventDefault();
    if (!memImageForm.image) return showToast('Please select an image', 'error');
    setMemImageLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', memImageForm.title);
      formData.append('image', memImageForm.image);

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/memorable-images`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        fetchMemorableImages();
        setShowMemImageForm(false);
        setMemImageForm({ title: '', image: null });
        showToast('Memorable image uploaded');
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to upload image', 'error');
      }
    } catch (err) { 
      console.error(err);
      showToast('Network error', 'error');
    } finally {
      setMemImageLoading(false);
    }
  };

  const deleteMemImage = async (id) => {
    if (!window.confirm('Are you sure you want to delete this image?')) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/memorable-images/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast('Image deleted');
        fetchMemorableImages();
      } else {
        showToast('Failed to delete image', 'error');
      }
    } catch (err) { 
      console.error(err);
      showToast('Network error', 'error');
    }
  };

  const deleteMessage = async (id) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/messages/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast('Message deleted');
        fetchMessages();
      } else {
        showToast('Failed to delete message', 'error');
      }
    } catch (err) { 
      console.error(err);
      showToast('Network error', 'error');
    }
  };

  const handleStatsSubmit = async (e) => {
    e.preventDefault();
    setStatsLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/stats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(stats)
      });
      if (res.ok) {
        showToast('Stats updated successfully');
      } else {
        showToast('Failed to update stats', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error', 'error');
    } finally {
      setStatsLoading(false);
    }
  };

  const downloadCSV = () => {
    if (messages.length === 0) return showToast('No messages to download', 'error');
    const headers = ['Date', 'Name', 'Email', 'Message'];
    const csvRows = [];
    csvRows.push(headers.join(','));
    
    messages.forEach(msg => {
      const date = new Date(msg.date).toLocaleString().replace(/,/g, '');
      const name = `"${msg.name.replace(/"/g, '""')}"`;
      const email = `"${msg.email.replace(/"/g, '""')}"`;
      const message = `"${msg.message.replace(/"/g, '""')}"`;
      csvRows.push([date, name, email, message].join(','));
    });
    
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `contact_messages_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- SKILLS MANAGEMENT ---
  const handleAddCategory = () => {
    setSkillCategories([...skillCategories, { title: 'New Category', icon: 'FaCode', skills: [] }]);
  };

  const handleDeleteCategory = (index) => {
    if (!window.confirm('Delete this entire category and all its skills?')) return;
    const newCats = [...skillCategories];
    newCats.splice(index, 1);
    setSkillCategories(newCats);
  };

  const handleUpdateCategory = (index, field, value) => {
    const newCats = [...skillCategories];
    newCats[index][field] = value;
    setSkillCategories(newCats);
  };

  const handleAddSkill = (catIndex) => {
    const newCats = [...skillCategories];
    newCats[catIndex].skills.push({ name: 'New Skill', icon: 'FaCheck' });
    setSkillCategories(newCats);
  };

  const handleDeleteSkill = (catIndex, skillIndex) => {
    const newCats = [...skillCategories];
    newCats[catIndex].skills.splice(skillIndex, 1);
    setSkillCategories(newCats);
  };

  const handleUpdateSkill = (catIndex, skillIndex, field, value) => {
    const newCats = [...skillCategories];
    newCats[catIndex].skills[skillIndex][field] = value;
    setSkillCategories(newCats);
  };

  const handleSkillsSubmit = async () => {
    setSkillsLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/skills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(skillCategories)
      });
      if (res.ok) {
        showToast('Skills updated successfully! Refreshing...');
        fetchSkills(); // Re-fetch to ensure sync
      } else {
        const errorData = await res.json();
        showToast(errorData.error || 'Failed to update skills', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error', 'error');
    } finally {
      setSkillsLoading(false);
    }
  };

  return (
    <div className="portfolio-page">
      <SEO title="Admin Dashboard" noindex={true} />
      <Navbar />
      <main className="main-content">
        <div className="admin-page dashboard-page">
          {toast.show && (
            <div className={`custom-toast ${toast.type}`}>
              {toast.message}
            </div>
          )}
          <div className="dashboard-header">
            <div>
              <h2 className="gradient-text">Welcome MR.PREM, {greeting}!</h2>
              <p className="text-muted">Manage your portfolio with ease.</p>
            </div>
            <button onClick={handleLogout} className="btn btn-outline"><FaSignOutAlt /> Logout</button>
          </div>

          <div className="dashboard-content glass-panel mb-4">
            <div className="admin-grid">
              {/* IMAGE UPLOAD */}
              <div className="admin-section">
                <h3>Profile Image</h3>
                <div className="preview-container">
                  {currentImage && <img src={currentImage} alt="Current Profile" className="preview-img" />}
                </div>
                <form onSubmit={(e) => { e.preventDefault(); handleUpload(selectedImage, 'image', setUploadImgStatus, fetchProfileImage); setSelectedImage(null); e.target.reset(); }} className="upload-form">
                  <input type="file" accept=".jpg,.jpeg,.png" onChange={(e) => setSelectedImage(e.target.files[0])} className="file-input" />
                  <button type="submit" className="btn btn-primary" disabled={!selectedImage}><FaUpload /> Upload</button>
                </form>
                {uploadImgStatus && <p className="upload-status">{uploadImgStatus}</p>}
              </div>

              {/* RESUME UPLOAD */}
              <div className="admin-section">
                <h3>Resume PDF</h3>
                <div className="preview-container">
                  {currentResume && <a href={currentResume} target="_blank" rel="noreferrer" className="current-resume-link">View Current Resume</a>}
                </div>
                <form onSubmit={(e) => { e.preventDefault(); handleUpload(selectedResume, 'resume', setUploadResStatus, fetchResume); setSelectedResume(null); e.target.reset(); }} className="upload-form">
                  <input type="file" accept=".pdf" onChange={(e) => setSelectedResume(e.target.files[0])} className="file-input" />
                  <button type="submit" className="btn btn-primary" disabled={!selectedResume}><FaUpload /> Upload</button>
                </form>
                {uploadResStatus && <p className="upload-status">{uploadResStatus}</p>}
              </div>

              {/* FAVICON UPLOAD */}
              <div className="admin-section">
                <h3>Favicon Image</h3>
                <div className="preview-container">
                  {currentFavicon && <img src={currentFavicon} alt="Current Favicon" className="preview-img" style={{width: '32px', height: '32px'}} />}
                </div>
                <form onSubmit={(e) => { e.preventDefault(); handleUpload(selectedFavicon, 'favicon', setUploadFavStatus, fetchFavicon); setSelectedFavicon(null); e.target.reset(); }} className="upload-form">
                  <input type="file" accept=".ico,.png,.svg,.jpg" onChange={(e) => setSelectedFavicon(e.target.files[0])} className="file-input" />
                  <button type="submit" className="btn btn-primary" disabled={!selectedFavicon}><FaUpload /> Upload</button>
                </form>
                {uploadFavStatus && <p className="upload-status">{uploadFavStatus}</p>}
              </div>

              {/* SIGNATURE UPLOAD */}
              <div className="admin-section">
                <h3>Signature Image</h3>
                <div className="preview-container">
                  {currentSignature && <img src={currentSignature} alt="Current Signature" className="preview-img signature-preview" />}
                </div>
                <form onSubmit={(e) => { e.preventDefault(); handleUpload(selectedSignature, 'signature', setUploadSigStatus, fetchSignature); setSelectedSignature(null); e.target.reset(); }} className="upload-form">
                  <input type="file" accept="image/*" onChange={(e) => setSelectedSignature(e.target.files[0])} className="file-input" />
                  <button type="submit" className="btn btn-primary" disabled={!selectedSignature}><FaUpload /> Upload</button>
                </form>
                {uploadSigStatus && <p className="upload-status">{uploadSigStatus}</p>}
              </div>

              {/* NAVBAR IMAGE UPLOAD */}
              <div className="admin-section">
                <h3>Navbar Logo Image</h3>
                <div className="preview-container">
                  {currentNavbarImg && <img src={currentNavbarImg} alt="Current Navbar Logo" className="preview-img" style={{width: '32px', height: '32px'}} />}
                </div>
                <form onSubmit={(e) => { e.preventDefault(); handleUpload(selectedNavbarImg, 'navbar', setUploadNavStatus, fetchNavbarImage); setSelectedNavbarImg(null); e.target.reset(); }} className="upload-form">
                  <input type="file" accept="image/*" onChange={(e) => setSelectedNavbarImg(e.target.files[0])} className="file-input" />
                  <button type="submit" className="btn btn-primary" disabled={!selectedNavbarImg}><FaUpload /> Upload</button>
                </form>
                {uploadNavStatus && <p className="upload-status">{uploadNavStatus}</p>}
              </div>
            </div>
          </div>

          {/* PORTFOLIO STATS SECTION */}
          <div className="dashboard-content glass-panel mb-4">
            <div className="section-header">
              <h3>Portfolio Statistics</h3>
            </div>
            <form onSubmit={handleStatsSubmit} className="project-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Years of Experience (e.g., 2+)</label>
                  <input type="text" value={stats.years_exp} onChange={e => setStats({...stats, years_exp: e.target.value})} className="form-input" placeholder="2+" required />
                </div>
                <div className="form-group">
                  <label>Projects Completed (e.g., 10+)</label>
                  <input type="text" value={stats.projects_completed} onChange={e => setStats({...stats, projects_completed: e.target.value})} className="form-input" placeholder="10+" required />
                </div>
                <div className="form-group">
                  <label>Startups / Leadership (e.g., 2)</label>
                  <input type="text" value={stats.startups_leadership} onChange={e => setStats({...stats, startups_leadership: e.target.value})} className="form-input" placeholder="2" required />
                </div>
              </div>
              <div className="form-actions" style={{marginTop: '1rem'}}>
                <button type="submit" className="btn btn-primary" disabled={statsLoading}>
                  {statsLoading ? 'Updating...' : 'Update Statistics'}
                </button>
              </div>
            </form>
          </div>

          {/* PROJECTS SECTION */}
          <div className="dashboard-content glass-panel mb-4">
            <div className="section-header">
              <h3>Projects</h3>
              <button className="btn btn-primary btn-sm" onClick={() => { setShowProjectForm(!showProjectForm); setEditingProject(null); setProjectForm({ title: '', description: '', tags: '', link: '', github: '', pptLink: '' }); }}>
                <FaPlus /> Add Project
              </button>
            </div>

            {showProjectForm && (
              <form className="project-form" onSubmit={handleProjectSubmit}>
                <input type="text" placeholder="Title" value={projectForm.title} onChange={e => setProjectForm({...projectForm, title: e.target.value})} required className="form-input" />
                <textarea placeholder="Description" value={projectForm.description} onChange={e => setProjectForm({...projectForm, description: e.target.value})} required className="form-input" rows="3" />
                <input type="text" placeholder="Tags (comma separated)" value={projectForm.tags} onChange={e => setProjectForm({...projectForm, tags: e.target.value})} required className="form-input" />
                <div className="form-row">
                  <input type="text" placeholder="Live Link URL" value={projectForm.link} onChange={e => setProjectForm({...projectForm, link: e.target.value})} className="form-input" />
                  <input type="text" placeholder="GitHub URL" value={projectForm.github} onChange={e => setProjectForm({...projectForm, github: e.target.value})} className="form-input" />
                  <input type="text" placeholder="PPT Link URL" value={projectForm.pptLink || ''} onChange={e => setProjectForm({...projectForm, pptLink: e.target.value})} className="form-input" />
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">{editingProject ? 'Update' : 'Save'} Project</button>
                  <button type="button" className="btn btn-outline" onClick={() => setShowProjectForm(false)}>Cancel</button>
                </div>
              </form>
            )}

            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr><th>Title</th><th>Tags</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {projects.length > 0 ? projects.map(p => (
                    <tr key={p.id}>
                      <td>{p.title}</td>
                      <td>{p.tags}</td>
                      <td className="actions-cell">
                        <button onClick={() => { setEditingProject(p); setProjectForm(p); setShowProjectForm(true); }} className="edit-btn"><FaEdit /></button>
                        <button onClick={() => deleteProject(p.id)} className="delete-btn"><FaTrash /></button>
                      </td>
                    </tr>
                  )) : <tr><td colSpan="3" className="text-center">No projects found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          {/* CERTIFICATES SECTION */}
          <div className="dashboard-content glass-panel mb-4">
            <div className="section-header">
              <h3>Certificates</h3>
              <button className="btn btn-primary btn-sm" onClick={() => { setShowCertForm(!showCertForm); setEditingCert(null); setCertForm({ title: '', description: '', date: '', image: null }); }}>
                <FaPlus /> Add Certificate
              </button>
            </div>

            {showCertForm && (
              <form className="project-form" onSubmit={handleCertSubmit}>
                <input type="text" placeholder="Title" value={certForm.title} onChange={e => setCertForm({...certForm, title: e.target.value})} required className="form-input" />
                <textarea placeholder="Description" value={certForm.description} onChange={e => setCertForm({...certForm, description: e.target.value})} required className="form-input" rows="3" />
                <div className="form-row">
                  <input type="date" value={certForm.date} onChange={e => setCertForm({...certForm, date: e.target.value})} required className="form-input" />
                  <input type="file" accept="image/*" onChange={e => setCertForm({...certForm, image: e.target.files[0]})} className="form-input" />
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">{editingCert ? 'Update' : 'Save'} Certificate</button>
                  <button type="button" className="btn btn-outline" onClick={() => setShowCertForm(false)}>Cancel</button>
                </div>
              </form>
            )}

            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr><th>Title</th><th>Date</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {certificates.length > 0 ? certificates.map(c => (
                    <tr key={c.id}>
                      <td>{c.title}</td>
                      <td>{c.date}</td>
                      <td className="actions-cell">
                        <button onClick={() => { setEditingCert(c); setCertForm({ title: c.title, description: c.description, date: c.date, image: null }); setShowCertForm(true); }} className="edit-btn"><FaEdit /></button>
                        <button onClick={() => deleteCertificate(c.id)} className="delete-btn"><FaTrash /></button>
                      </td>
                    </tr>
                  )) : <tr><td colSpan="3" className="text-center">No certificates found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          {/* MEMORABLE IMAGES SECTION */}
          <div className="dashboard-content glass-panel mb-4">
            <div className="section-header">
              <h3>Memorable Images</h3>
              <button className="btn btn-primary btn-sm" onClick={() => { setShowMemImageForm(!showMemImageForm); setMemImageForm({ title: '', image: null }); }}>
                <FaPlus /> Add Memory
              </button>
            </div>

            {showMemImageForm && (
              <form className="project-form" onSubmit={handleMemImageSubmit}>
                <input type="text" placeholder="Image Title" value={memImageForm.title} onChange={e => setMemImageForm({...memImageForm, title: e.target.value})} required className="form-input" />
                <div className="form-row">
                  <input type="file" accept="image/*" onChange={e => setMemImageForm({...memImageForm, image: e.target.files[0]})} required className="form-input" />
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary" disabled={memImageLoading}>
                    {memImageLoading ? 'Uploading...' : 'Upload Image'}
                  </button>
                  <button type="button" className="btn btn-outline" onClick={() => setShowMemImageForm(false)}>Cancel</button>
                </div>
              </form>
            )}

            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr><th>Title</th><th>Upload Date & Time</th><th>Type</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {memorableImages.length > 0 ? memorableImages.map(img => (
                    <tr key={img.id}>
                      <td>{img.title}</td>
                      <td>{new Date(img.upload_date).toLocaleString()}</td>
                      <td style={{textTransform: 'capitalize'}}>{img.aspect_ratio}</td>
                      <td className="actions-cell">
                        <button onClick={() => deleteMemImage(img.id)} className="delete-btn"><FaTrash /></button>
                      </td>
                    </tr>
                  )) : <tr><td colSpan="4" className="text-center">No memorable images found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          {/* SKILLS SECTION */}
          <div className="dashboard-content glass-panel mb-4">
            <div className="section-header">
              <h3>Manage Skills</h3>
              <button className="btn btn-primary btn-sm" onClick={handleAddCategory}>
                <FaPlus /> Add Category
              </button>
            </div>
            
            <div className="skills-admin-list">
              {skillCategories.map((cat, catIdx) => (
                <div key={catIdx} className="admin-skill-category glass-panel mb-3">
                  <div className="category-header">
                    <div className="category-inputs">
                      <input 
                        type="text" 
                        value={cat.title} 
                        onChange={(e) => handleUpdateCategory(catIdx, 'title', e.target.value)}
                        className="form-input category-title-input"
                        placeholder="Category Title"
                      />
                      <input 
                        type="text" 
                        value={cat.icon} 
                        onChange={(e) => handleUpdateCategory(catIdx, 'icon', e.target.value)}
                        className="form-input category-icon-input"
                        placeholder="Icon (e.g. FaCode)"
                      />
                    </div>
                    <button onClick={() => handleDeleteCategory(catIdx)} className="delete-btn"><FaTrash /></button>
                  </div>
                  
                  <div className="category-skills-grid mt-3">
                    {cat.skills.map((skill, skillIdx) => (
                      <div key={skillIdx} className="admin-skill-item">
                        <input 
                          type="text" 
                          value={skill.name} 
                          onChange={(e) => handleUpdateSkill(catIdx, skillIdx, 'name', e.target.value)}
                          className="form-input skill-name-input"
                          placeholder="Skill Name"
                        />
                        <input 
                          type="text" 
                          value={skill.icon} 
                          onChange={(e) => handleUpdateSkill(catIdx, skillIdx, 'icon', e.target.value)}
                          className="form-input skill-icon-input"
                          placeholder="Icon (e.g. FaJs)"
                        />
                        <button onClick={() => handleDeleteSkill(catIdx, skillIdx)} className="delete-btn-small"><FaTrash /></button>
                      </div>
                    ))}
                    <button className="btn btn-outline btn-sm add-skill-btn" onClick={() => handleAddSkill(catIdx)}>
                      <FaPlus /> Add Skill
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="form-actions mt-3">
              <button onClick={handleSkillsSubmit} className="btn btn-primary" disabled={skillsLoading}>
                {skillsLoading ? 'Saving...' : 'Save All Skills Changes'}
              </button>
            </div>
          </div>

          {/* MESSAGES SECTION */}
          <div className="dashboard-content glass-panel">
            <div className="section-header contact-header">
              <h3 className="section-title-small" style={{ margin: 0 }}>Contact Submissions</h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-outline btn-sm" onClick={downloadCSV}>
                  Download CSV
                </button>
                <a href="https://docs.google.com/spreadsheets/d/1nkRm0hxYI0L8hNzEYPt_Dv4w39xKEyMRte-KGOtBRV8/edit?gid=1786163301#gid=1786163301" target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm">
                  Open Google Sheet
                </a>
              </div>
            </div>
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr><th>Date & Time</th><th>Name</th><th>Email</th><th>Message</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {messages.length > 0 ? messages.map(msg => (
                    <tr key={msg.id}>
                      <td>{new Date(msg.date).toLocaleString()}</td>
                      <td>{msg.name}</td>
                      <td><a href={`mailto:${msg.email}`}>{msg.email}</a></td>
                      <td className="msg-cell">{msg.message}</td>
                      <td><button onClick={() => deleteMessage(msg.id)} className="delete-btn"><FaTrash /></button></td>
                    </tr>
                  )) : <tr><td colSpan="5" className="text-center">No messages found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminDashboard;
