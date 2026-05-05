import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTrash, FaSignOutAlt, FaUpload, FaEdit, FaPlus } from 'react-icons/fa';
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

  // Certificates states
  const [certificates, setCertificates] = useState([]);
  const [showCertForm, setShowCertForm] = useState(false);
  const [editingCert, setEditingCert] = useState(null);
  const [certForm, setCertForm] = useState({ title: '', description: '', date: '', image: null });

  const navigate = useNavigate();
  const token = localStorage.getItem('adminToken');

  useEffect(() => {
    if (!token) {
      navigate('/admin');
      return;
    }
    fetchMessages();
    fetchProfileImage();
    fetchResume();
    fetchProjects();
    fetchFavicon();
    fetchCertificates();
  }, [token, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin');
  };

  // --- FETCH DATA ---
  const fetchMessages = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/admin/messages', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.status === 403 || res.status === 401) return handleLogout();
      const data = await res.json();
      setMessages(data);
    } catch (err) { console.error(err); }
  };

  const fetchProfileImage = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/profile-image');
      const data = await res.json();
      setCurrentImage(data.imageUrl.startsWith('/uploads') ? `http://localhost:5000${data.imageUrl}` : data.imageUrl);
    } catch (err) { console.error(err); }
  };

  const fetchResume = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/resume');
      const data = await res.json();
      setCurrentResume(data.resumeUrl.startsWith('/uploads') ? `http://localhost:5000${data.resumeUrl}` : data.resumeUrl);
    } catch (err) { console.error(err); }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/projects?t=${Date.now()}`);
      const data = await res.json();
      setProjects(data);
    } catch (err) { console.error(err); }
  };

  const fetchFavicon = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/favicon?t=${Date.now()}`);
      const data = await res.json();
      const favUrl = data.faviconUrl.startsWith('/uploads') ? `http://localhost:5000${data.faviconUrl}?t=${Date.now()}` : data.faviconUrl;
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
      const res = await fetch(`http://localhost:5000/api/certificates?t=${Date.now()}`);
      const data = await res.json();
      setCertificates(data);
    } catch (err) { console.error(err); }
  };

  // --- UPLOADS ---
  const handleUpload = async (file, type, setStatusCallback, fetchCallback) => {
    if (!file) return setStatusCallback('Please select a file first.');
    const formData = new FormData();
    formData.append(type, file);
    try {
      setStatusCallback('Uploading...');
      let endpoint = '';
      if (type === 'image') endpoint = 'upload-profile';
      else if (type === 'resume') endpoint = 'upload-resume';
      else if (type === 'favicon') endpoint = 'upload-favicon';
      
      const res = await fetch(`http://localhost:5000/api/admin/${endpoint}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setStatusCallback('Upload successful!');
        fetchCallback();
      } else {
        setStatusCallback(`Upload failed: ${data.error}`);
      }
    } catch (err) {
      setStatusCallback('Error uploading file.');
    }
  };

  // --- PROJECTS CRUD ---
  const handleProjectSubmit = async (e) => {
    e.preventDefault();
    try {
      const method = editingProject ? 'PUT' : 'POST';
      const url = editingProject 
        ? `http://localhost:5000/api/admin/projects/${editingProject.id}` 
        : 'http://localhost:5000/api/admin/projects';
      
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
      }
    } catch (err) { console.error(err); }
  };

  const deleteProject = async (id) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    try {
      await fetch(`http://localhost:5000/api/admin/projects/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchProjects();
    } catch (err) { console.error(err); }
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
        ? `http://localhost:5000/api/admin/certificates/${editingCert.id}` 
        : 'http://localhost:5000/api/admin/certificates';
      
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
      }
    } catch (err) { console.error(err); }
  };

  const deleteCertificate = async (id) => {
    if (!window.confirm('Are you sure you want to delete this certificate?')) return;
    try {
      await fetch(`http://localhost:5000/api/admin/certificates/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchCertificates();
    } catch (err) { console.error(err); }
  };

  const deleteMessage = async (id) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    try {
      await fetch(`http://localhost:5000/api/admin/messages/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchMessages();
    } catch (err) { console.error(err); }
  };

  const downloadCSV = () => {
    if (messages.length === 0) return alert('No messages to download');
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

  return (
    <div className="admin-page dashboard-page">
      <div className="dashboard-header">
        <h2 className="gradient-text">Admin Dashboard</h2>
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
        </div>
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

      {/* MESSAGES SECTION */}
      <div className="dashboard-content glass-panel">
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
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
  );
};

export default AdminDashboard;
