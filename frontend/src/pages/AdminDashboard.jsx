import React, { useEffect, useState } from 'react';
import SEO from '../components/SEO';
import { useNavigate, Link } from 'react-router-dom';
import { FaTrash, FaSignOutAlt, FaUpload, FaEdit, FaPlus, FaEye, FaEnvelope, FaClock, FaUser, FaReply, FaTimes, FaStar, FaLink, FaQrcode, FaEyeSlash, FaImage, FaShieldAlt } from 'react-icons/fa';
import { QRCodeCanvas } from 'qrcode.react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ChatBot from '../components/ChatBot';
import ConfirmNotificationModal from '../components/ConfirmNotificationModal';
import { RESUME_LINK } from '../config';
import {
  fetchMaintenanceSettingsForAdmin,
  saveMaintenanceSettings,
} from '../services/maintenanceService';
import './Admin.css';

const AdminDashboard = () => {
  const [messages, setMessages] = useState([]);
  const [totalMessages, setTotalMessages] = useState(0);
  const [recentVisitors, setRecentVisitors] = useState([]);
  const [totalVisitors, setTotalVisitors] = useState(0);
  const [selectedMessage, setSelectedMessage] = useState(null);
  
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
  const [projectImages, setProjectImages] = useState([]);
  const [uploadingProjectImages, setUploadingProjectImages] = useState(false);
  const [projectForm, setProjectForm] = useState({
    title: '', description: '', tags: '', link: '', github: '', pptLink: '', image_alt: '', image_description: ''
  });

  // Project Reviews states
  const [allReviews, setAllReviews] = useState([]);
  const [showReviewManager, setShowReviewManager] = useState(false);
  const [selectedProjectForQR, setSelectedProjectForQR] = useState(null);

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

  // Push Notification & Confirmation Modal States
  const [notifyProjects, setNotifyProjects] = useState(false);
  const [notifyCertificates, setNotifyCertificates] = useState(false);
  const [notifyMemories, setNotifyMemories] = useState(false);
  const [notifySkills, setNotifySkills] = useState(false);
  const [notifyProfile, setNotifyProfile] = useState(false);
  const [notifyStats, setNotifyStats] = useState(false);

  // Custom Standalone Broadcast states
  const [customNotifyTitle, setCustomNotifyTitle] = useState('');
  const [customNotifyMessage, setCustomNotifyMessage] = useState('');
  const [customNotifyUrl, setCustomNotifyUrl] = useState('');
  const [broadcastLoading, setBroadcastLoading] = useState(false);

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    titleText: "Send Push Notification",
    onConfirm: null
  });

  // Push Notification REST API caller
  const sendPushNotificationAPI = async ({ title, message, url }) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/send`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ title, message, url })
      });
      if (res.ok) {
        showToast('Push Notification sent to subscribers successfully! 🚀');
      } else {
        const errData = await res.json();
        console.error('Failed to send push notification:', errData.error);
        showToast(errData.error || 'Failed to send notification', 'error');
      }
    } catch (error) {
      console.error('Error sending push notification:', error);
      showToast('Network error while sending notification.', 'error');
    }
  };

  const handleSendCustomBroadcast = async () => {
    if (!customNotifyTitle || !customNotifyMessage) {
      showToast('Title and Message are required to send a notification.', 'error');
      return;
    }
    
    setConfirmModal({
      isOpen: true,
      titleText: "🚀 Send Standalone Broadcast",
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setBroadcastLoading(true);
        try {
          await sendPushNotificationAPI({
            title: customNotifyTitle,
            message: customNotifyMessage,
            url: customNotifyUrl || "https://mrprem.in"
          });
          setCustomNotifyTitle('');
          setCustomNotifyMessage('');
          setCustomNotifyUrl('');
        } catch (err) {
          console.error(err);
        } finally {
          setBroadcastLoading(false);
        }
      }
    });
  };

  // Push Notification Interceptor Handlers for all Admin Actions
  const handleProjectSubmitIntercept = async (e) => {
    e.preventDefault();
    if (notifyProjects) {
      setConfirmModal({
        isOpen: true,
        titleText: "🚀 Send New Project Notification",
        onConfirm: async () => {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          await handleProjectSubmit(e);
          await sendPushNotificationAPI({
            title: "🚀 New Project Added",
            message: `Explore the latest portfolio project: "${projectForm.title || 'New Project'}" now live.`,
            url: "https://mrprem.in/#projects"
          });
          setNotifyProjects(false);
        }
      });
    } else {
      await handleProjectSubmit(e);
    }
  };

  const handleCertSubmitIntercept = async (e) => {
    e.preventDefault();
    if (notifyCertificates) {
      setConfirmModal({
        isOpen: true,
        titleText: "🏆 Send New Achievement Notification",
        onConfirm: async () => {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          await handleCertSubmit(e);
          await sendPushNotificationAPI({
            title: "🏆 New Achievement Added",
            message: `A new certification has been added: "${certForm.title || 'New Certificate'}" to the portfolio.`,
            url: "https://mrprem.in/#certificates"
          });
          setNotifyCertificates(false);
        }
      });
    } else {
      await handleCertSubmit(e);
    }
  };

  const handleMemImageSubmitIntercept = async (e) => {
    e.preventDefault();
    if (notifyMemories) {
      setConfirmModal({
        isOpen: true,
        titleText: "📸 Send New Memories Notification",
        onConfirm: async () => {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          await handleMemImageSubmit(e);
          await sendPushNotificationAPI({
            title: "📸 New Memories Uploaded",
            message: `Check out the latest memorable moment: "${memImageForm.title || 'New Memory'}" now available.`,
            url: "https://mrprem.in/#memories"
          });
          setNotifyMemories(false);
        }
      });
    } else {
      await handleMemImageSubmit(e);
    }
  };

  const handleSkillsSubmitIntercept = async () => {
    if (notifySkills) {
      setConfirmModal({
        isOpen: true,
        titleText: "⚡ Send Skills Update Notification",
        onConfirm: async () => {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          await handleSkillsSubmit();
          await sendPushNotificationAPI({
            title: "⚡ Skills Updated",
            message: "New technical skills have been added to the portfolio.",
            url: "https://mrprem.in/#skills"
          });
          setNotifySkills(false);
        }
      });
    } else {
      await handleSkillsSubmit();
    }
  };

  const handleStatsSubmitIntercept = async (e) => {
    e.preventDefault();
    if (notifyStats) {
      setConfirmModal({
        isOpen: true,
        titleText: "⚡ Send Statistics Update Notification",
        onConfirm: async () => {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          await handleStatsSubmit(e);
          await sendPushNotificationAPI({
            title: "⚡ Portfolio Statistics Updated",
            message: "Explore the latest portfolio improvements and statistics.",
            url: "https://mrprem.in"
          });
          setNotifyStats(false);
        }
      });
    } else {
      await handleStatsSubmit(e);
    }
  };

  const handleProfileImageSubmitIntercept = async (e) => {
    e.preventDefault();
    if (notifyProfile) {
      setConfirmModal({
        isOpen: true,
        titleText: "👤 Send Profile Update Notification",
        onConfirm: async () => {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          await handleUpload(selectedImage, 'image', setUploadImgStatus, fetchProfileImage);
          setSelectedImage(null);
          e.target.reset();
          await sendPushNotificationAPI({
            title: "👤 Portfolio Profile Updated",
            message: "Explore the latest portfolio improvements and profile image.",
            url: "https://mrprem.in"
          });
          setNotifyProfile(false);
        }
      });
    } else {
      await handleUpload(selectedImage, 'image', setUploadImgStatus, fetchProfileImage);
      setSelectedImage(null);
      e.target.reset();
    }
  };

  // Certificates states
  const [certificates, setCertificates] = useState([]);
  const [showCertForm, setShowCertForm] = useState(false);
  const [editingCert, setEditingCert] = useState(null);
  const [certForm, setCertForm] = useState({ title: '', description: '', date: '', image: null, image_alt: '' });

  // Memorable Images states
  const [memorableImages, setMemorableImages] = useState([]);
  const [showMemImageForm, setShowMemImageForm] = useState(false);
  const [memImageForm, setMemImageForm] = useState({ title: '', image: null, image_alt: '', image_description: '' });
  const [memImageLoading, setMemImageLoading] = useState(false);

  // Skills states
  const [skillCategories, setSkillCategories] = useState([]);
  const [skillsLoading, setSkillsLoading] = useState(false);

  // Whitelist states
  const [whitelist, setWhitelist] = useState([]);
  const [showWhitelistForm, setShowWhitelistForm] = useState(false);
  const [whitelistForm, setWhitelistForm] = useState({ email: '', password: '' });
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Change Password states
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Admin Reset states
  const [resettingAdmin, setResettingAdmin] = useState(null); // stores admin object
  const [adminResetPass, setAdminResetPass] = useState('');

  // Maintenance System states
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);
  const [maintenanceStartDate, setMaintenanceStartDate] = useState('');
  const [maintenanceStartTime, setMaintenanceStartTime] = useState('');
  const [maintenanceEndDate, setMaintenanceEndDate] = useState('');
  const [maintenanceEndTime, setMaintenanceEndTime] = useState('');
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);

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
    fetchAdminReviews();
    fetchFavicon();
    fetchCertificates();
    fetchSignature();
    fetchStats();
    fetchNavbarImage();
    fetchSkills();
    fetchMemorableImages();
    fetchVisitors();
    fetchMaintenance();
    
    const adminEmail = localStorage.getItem('adminEmail');
    if (adminEmail === 'mr.prem2006@gmail.com') {
      setIsSuperAdmin(true);
      fetchWhitelist();
    }
  }, [token, navigate]);

  useEffect(() => {
    if (selectedMessage) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [selectedMessage]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/prem-login-2026');
  };

  const fetchMaintenance = async () => {
    try {
      const data = await fetchMaintenanceSettingsForAdmin();
      setMaintenanceEnabled(data.maintenance_enabled || false);
      setMaintenanceMessage(data.message || '');

      if (data.start_time) {
        const start = new Date(data.start_time);
        const yyyy = start.getFullYear();
        const mm = String(start.getMonth() + 1).padStart(2, '0');
        const dd = String(start.getDate()).padStart(2, '0');
        setMaintenanceStartDate(`${yyyy}-${mm}-${dd}`);

        const hh = String(start.getHours()).padStart(2, '0');
        const min = String(start.getMinutes()).padStart(2, '0');
        setMaintenanceStartTime(`${hh}:${min}`);
      } else {
        setMaintenanceStartDate('');
        setMaintenanceStartTime('');
      }

      if (data.end_time) {
        const end = new Date(data.end_time);
        const yyyy = end.getFullYear();
        const mm = String(end.getMonth() + 1).padStart(2, '0');
        const dd = String(end.getDate()).padStart(2, '0');
        setMaintenanceEndDate(`${yyyy}-${mm}-${dd}`);

        const hh = String(end.getHours()).padStart(2, '0');
        const min = String(end.getMinutes()).padStart(2, '0');
        setMaintenanceEndTime(`${hh}:${min}`);
      } else {
        setMaintenanceEndDate('');
        setMaintenanceEndTime('');
      }
    } catch (err) {
      console.error('Error fetching maintenance settings:', err);
    }
  };

  const handleMaintenanceSubmit = async (e) => {
    e.preventDefault();
    setMaintenanceLoading(true);

    let start_time = null;
    if (maintenanceStartDate && maintenanceStartTime) {
      start_time = new Date(`${maintenanceStartDate}T${maintenanceStartTime}`).toISOString();
    } else if (maintenanceStartDate) {
      start_time = new Date(`${maintenanceStartDate}T00:00`).toISOString();
    }

    let end_time = null;
    if (maintenanceEndDate && maintenanceEndTime) {
      end_time = new Date(`${maintenanceEndDate}T${maintenanceEndTime}`).toISOString();
    } else if (maintenanceEndDate) {
      end_time = new Date(`${maintenanceEndDate}T00:00`).toISOString();
    }

    try {
      const res = await saveMaintenanceSettings(
        {
          maintenance_enabled: maintenanceEnabled,
          start_time,
          end_time,
          message: maintenanceMessage,
        },
        token
      );

      if (res.ok) {
        showToast('Maintenance settings updated successfully!');
        fetchMaintenance();
      } else {
        showToast('Failed to update maintenance settings', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error', 'error');
    } finally {
      setMaintenanceLoading(false);
    }
  };

  // --- FETCH DATA ---
  const fetchMessages = async () => {
    try {
      // Fetch top 10 for dashboard
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/messages?limit=10`, { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      if (res.status === 403 || res.status === 401) return handleLogout();
      const data = await res.json();
      setMessages(data.messages || []);
      setTotalMessages(data.totalCount || 0);
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
    if (RESUME_LINK && RESUME_LINK !== "https://your-resume-link-here.pdf") {
      setCurrentResume(RESUME_LINK);
      return;
    }
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

  const fetchVisitors = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/visitors?limit=5`, { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      if (res.ok) {
        const data = await res.json();
        setRecentVisitors(data.visitors || []);
        setTotalVisitors(data.totalCount || 0);
      }
    } catch (err) { console.error(err); }
  };

  const fetchWhitelist = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/whitelist`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setWhitelist(data);
    } catch (err) { console.error(err); }
  };

  const handleWhitelistSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/whitelist`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(whitelistForm)
      });
      if (res.ok) {
        fetchWhitelist();
        setShowWhitelistForm(false);
        setWhitelistForm({ email: '', password: '' });
        showToast('Admin added to whitelist');
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to add admin', 'error');
      }
    } catch (err) { console.error(err); }
  };

  const handleAdminPasswordReset = async (e) => {
    e.preventDefault();
    if (!adminResetPass) return showToast('Please enter a new password', 'error');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/reset-admin-password`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ adminId: resettingAdmin.id, newPassword: adminResetPass })
      });
      if (res.ok) {
        showToast(`Password for ${resettingAdmin.email} has been reset.`);
        setResettingAdmin(null);
        setAdminResetPass('');
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to reset password', 'error');
      }
    } catch (err) { console.error(err); }
  };

  const removeAdmin = async (id) => {
    if (!window.confirm('Remove this admin from whitelist?')) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/whitelist/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchWhitelist();
        showToast('Admin removed');
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to remove admin', 'error');
      }
    } catch (err) { console.error(err); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return showToast('New passwords do not match', 'error');
    }
    setPasswordLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/change-password`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: localStorage.getItem('adminEmail'),
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Password updated successfully');
        setShowPasswordForm(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        showToast(data.error || 'Failed to update password', 'error');
      }
    } catch (err) { console.error(err); }
    setPasswordLoading(false);
  };

  // --- UPLOADS ---
  const handleUpload = async (file, type, setStatusCallback, fetchCallback) => {
    if (!file) return showToast('Please select a file first.', 'error');
    try {
      setStatusCallback('Uploading...');
      
      let endpoint = '';
      if (type === 'image') endpoint = 'upload-profile';
      else if (type === 'resume') endpoint = 'upload-resume';
      else if (type === 'favicon') endpoint = 'upload-favicon';
      else if (type === 'signature') endpoint = 'upload-signature';
      else if (type === 'navbar') endpoint = 'upload-navbar';

      // 1. Get secure signature from Worker
      console.log('token exists =', !!token);
      const signRes = await fetch(`/api/admin/cloudinary-sign`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ folder: 'portfolio' })
      });
      
      if (!signRes.ok) {
        throw new Error('Failed to obtain upload signature from server.');
      }
      
      const { signature, timestamp, apiKey, cloudName, folder } = await signRes.json();

      // 2. Post file directly to Cloudinary CDN
      const cloudinaryForm = new FormData();
      cloudinaryForm.append('file', file);
      cloudinaryForm.append('api_key', apiKey);
      cloudinaryForm.append('timestamp', timestamp);
      cloudinaryForm.append('signature', signature);
      if (folder) cloudinaryForm.append('folder', folder);

      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
        method: 'POST',
        body: cloudinaryForm
      });

      if (!uploadRes.ok) {
        const errData = await uploadRes.json();
        throw new Error(errData.error?.message || 'Direct CDN upload failed.');
      }

      const uploadData = await uploadRes.json();
      const secureUrl = uploadData.secure_url;

      // 3. Save the resulting URL to Supabase via Worker/Render
      const res = await fetch(`/api/admin/${endpoint}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ imageUrl: secureUrl })
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
      console.error(err);
      setStatusCallback('Error');
      showToast(err.message || 'Error during upload', 'error');
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
        const data = await res.json();
        fetchProjects();
        if (!editingProject && data.id) {
          // If new project, keep form open to allow image uploads
          const newProject = { id: data.id, ...projectForm };
          setEditingProject(newProject);
          fetchProjectImages(data.id);
          showToast('Project created! You can now add images below.');
        } else {
          setShowProjectForm(false);
          setEditingProject(null);
          setProjectForm({ title: '', description: '', tags: '', link: '', github: '', pptLink: '', image_alt: '', image_description: '' });
          showToast(editingProject ? 'Project updated' : 'Project created');
        }
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to save project', 'error');
      }
    } catch (err) { 
      console.error(err);
      showToast('Network error: Could not connect to the backend.', 'error');
    }
  };

  const fetchProjectImages = async (projectId) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${projectId}`);
      const data = await res.json();
      setProjectImages(data.images || []);
    } catch (err) { console.error(err); }
  };

  const handleProjectImagesUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !editingProject) return;

    setUploadingProjectImages(true);
    try {
      // 1. Get secure signature from Worker
      console.log('token exists =', !!token);
      const signRes = await fetch(`/api/admin/cloudinary-sign`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ folder: 'portfolio' })
      });
      
      if (!signRes.ok) {
        throw new Error('Failed to obtain upload signature from server.');
      }
      
      const { signature, timestamp, apiKey, cloudName, folder } = await signRes.json();

      const uploadedImages = [];

      // 2. Upload each file directly to Cloudinary
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const cloudinaryForm = new FormData();
        cloudinaryForm.append('file', file);
        cloudinaryForm.append('api_key', apiKey);
        cloudinaryForm.append('timestamp', timestamp);
        cloudinaryForm.append('signature', signature);
        if (folder) cloudinaryForm.append('folder', folder);

        const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
          method: 'POST',
          body: cloudinaryForm
        });

        if (!uploadRes.ok) {
          throw new Error(`Direct CDN upload failed for image: ${file.name}`);
        }

        const uploadData = await uploadRes.json();
        uploadedImages.push({
          image_url: uploadData.secure_url,
          alt_text: projectForm.image_alt || editingProject.title
        });
      }

      // 3. Save the resulting image URLs to the database
      const res = await fetch(`/api/admin/projects/${editingProject.id}/images`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ images: uploadedImages })
      });

      if (res.ok) {
        showToast('Images uploaded successfully');
        fetchProjectImages(editingProject.id);
      } else {
        const data = await res.json();
        showToast(data.error || 'Upload failed', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Error during upload', 'error');
    } finally {
      setUploadingProjectImages(false);
      e.target.value = ''; // Reset file input
    }
  };

  const deleteProjectImage = async (imageId) => {
    if (!window.confirm('Delete this image?')) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/project-images/${imageId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast('Image deleted');
        fetchProjectImages(editingProject.id);
      }
    } catch (err) { console.error(err); }
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

  const fetchAdminReviews = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/reviews`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setAllReviews(data);
    } catch (err) { console.error(err); }
  };

  const deleteReview = async (id) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/reviews/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast('Review deleted');
        fetchAdminReviews();
      }
    } catch (err) { console.error(err); }
  };

  const toggleReviewVisibility = async (reviewId, currentHidden) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/reviews/${reviewId}/toggle-visibility`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_hidden: !currentHidden })
      });
      if (res.ok) {
        showToast(`Review ${currentHidden ? 'visible' : 'hidden'}`);
        fetchAdminReviews();
      }
    } catch (err) { console.error(err); }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showToast('Link copied to clipboard');
  };

  const handleCertSubmit = async (e) => {
    e.preventDefault();
    try {
      let imageUrl = editingCert ? editingCert.image : null;

      // 1. If a new image is selected, upload directly to Cloudinary first
      if (certForm.image) {
        console.log('token exists =', !!token);
        const signRes = await fetch(`/api/admin/cloudinary-sign`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify({ folder: 'portfolio' })
        });
        
        if (!signRes.ok) {
          throw new Error('Failed to obtain upload signature from server.');
        }
        
        const { signature, timestamp, apiKey, cloudName, folder } = await signRes.json();

        const cloudinaryForm = new FormData();
        cloudinaryForm.append('file', certForm.image);
        cloudinaryForm.append('api_key', apiKey);
        cloudinaryForm.append('timestamp', timestamp);
        cloudinaryForm.append('signature', signature);
        if (folder) cloudinaryForm.append('folder', folder);

        const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
          method: 'POST',
          body: cloudinaryForm
        });

        if (!uploadRes.ok) {
          throw new Error('Direct CDN upload failed for certificate image.');
        }

        const uploadData = await uploadRes.json();
        imageUrl = uploadData.secure_url;
      } else if (!editingCert) {
        return showToast("Please select a certificate image first.", "error");
      }

      // 2. Submit certificate metadata as JSON
      const method = editingCert ? 'PUT' : 'POST';
      const url = editingCert 
        ? `/api/admin/certificates/${editingCert.id}` 
        : `/api/admin/certificates`;
      
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          title: certForm.title,
          description: certForm.description,
          date: certForm.date,
          image_alt: certForm.image_alt,
          image: imageUrl
        })
      });

      if (res.ok) {
        fetchCertificates();
        setShowCertForm(false);
        setEditingCert(null);
        setCertForm({ title: '', description: '', date: '', image: null, image_alt: '' });
        showToast(editingCert ? 'Certificate updated' : 'Certificate created');
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to save certificate', 'error');
      }
    } catch (err) { 
      console.error(err);
      showToast(err.message || 'Error saving certificate', 'error');
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
      // 1. Get secure signature from Worker
      console.log('token exists =', !!token);
      const signRes = await fetch(`/api/admin/cloudinary-sign`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ folder: 'portfolio' })
      });
      
      if (!signRes.ok) {
        throw new Error('Failed to obtain upload signature from server.');
      }
      
      const { signature, timestamp, apiKey, cloudName, folder } = await signRes.json();

      // 2. Upload image directly to Cloudinary
      const cloudinaryForm = new FormData();
      cloudinaryForm.append('file', memImageForm.image);
      cloudinaryForm.append('api_key', apiKey);
      cloudinaryForm.append('timestamp', timestamp);
      cloudinaryForm.append('signature', signature);
      if (folder) cloudinaryForm.append('folder', folder);

      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
        method: 'POST',
        body: cloudinaryForm
      });

      if (!uploadRes.ok) {
        throw new Error('Direct CDN upload failed for memorable image.');
      }

      const uploadData = await uploadRes.json();
      const secureUrl = uploadData.secure_url;

      // 3. Save memory details as JSON
      const res = await fetch(`/api/admin/memorable-images`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          title: memImageForm.title,
          image_alt: memImageForm.image_alt,
          image_description: memImageForm.image_description,
          imageUrl: secureUrl
        })
      });

      if (res.ok) {
        fetchMemorableImages();
        setShowMemImageForm(false);
        setMemImageForm({ title: '', image: null, image_alt: '', image_description: '' });
        showToast('Memorable image uploaded');
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to upload image', 'error');
      }
    } catch (err) { 
      console.error(err);
      showToast(err.message || 'Error uploading memorable image', 'error');
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
    
    const escapeCSV = (str) => {
      if (!str) return "";
      let result = str.toString();
      if (result.includes(',') || result.includes('"') || result.includes('\n') || result.includes('\r')) {
        result = '"' + result.replace(/"/g, '""') + '"';
      }
      return result;
    };

    const headers = ['Date', 'Name', 'Email', 'Message'];
    const csvRows = [headers.join(',')];
    
    messages.forEach(msg => {
      const date = escapeCSV(new Date(msg.date).toLocaleString());
      const name = escapeCSV(msg.name);
      const email = escapeCSV(msg.email);
      const message = escapeCSV(msg.message);
      csvRows.push([date, name, email, message].join(','));
    });
    
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `contact_messages_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
      {/* QR MODAL */}
      {selectedProjectForQR && (
        <div className="modal-overlay" onClick={() => setSelectedProjectForQR(null)}>
          <div className="modal-content text-center" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="gradient-text">Project QR Ecosystem</h3>
              <button className="close-btn" onClick={() => setSelectedProjectForQR(null)}><FaTimes /></button>
            </div>
            <div className="modal-body p-4">
              <p className="mb-4 text-muted">Scan to open <strong>{selectedProjectForQR.title}</strong> on any device.</p>
              <div className="qr-container bg-white p-4 rounded-3xl inline-block shadow-2xl mb-4">
                <QRCodeCanvas 
                  value={`${window.location.origin}/project/${selectedProjectForQR.slug || selectedProjectForQR.id}`} 
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <div className="form-actions mt-4">
                <button className="btn btn-outline btn-sm w-100" onClick={() => copyToClipboard(`${window.location.origin}/project/${selectedProjectForQR.slug || selectedProjectForQR.id}`)}>
                  Copy Project Link
                </button>
                <button className="btn btn-outline btn-sm w-100" onClick={() => copyToClipboard(`${window.location.origin}/review/${selectedProjectForQR.slug || selectedProjectForQR.id}`)}>
                  Copy Review Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ChatBot />
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
            <div className="dashboard-actions">
              {isSuperAdmin && (
                <button onClick={() => navigate('/prem-media-library')} className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #10b981, #3b82f6)' }}>
                  <FaImage /> Media Library / CDN
                </button>
              )}
              {isSuperAdmin && (
                <button onClick={() => navigate('/admin/manage-vault')} className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
                  <FaShieldAlt /> Manage Secure Vault
                </button>
              )}
              {isSuperAdmin && (
                <button onClick={() => navigate('/personal-vault')} className="btn btn-primary">
                  Access Personal Data
                </button>
              )}
              <button onClick={() => setShowPasswordForm(!showPasswordForm)} className="btn btn-outline">
                {showPasswordForm ? 'Cancel' : 'Change Password'}
              </button>
              <button onClick={handleLogout} className="btn btn-outline"><FaSignOutAlt /> Logout</button>
            </div>
          </div>

          {showPasswordForm && (
            <div className="dashboard-content glass-panel mb-4">
              <h3>Change Password</h3>
              <form onSubmit={handleChangePassword} className="project-form">
                <div className="form-row">
                  <input 
                    type="password" 
                    placeholder="Current Password" 
                    value={passwordData.currentPassword} 
                    onChange={e => setPasswordData({...passwordData, currentPassword: e.target.value})} 
                    required 
                    className="form-input" 
                  />
                  <input 
                    type="password" 
                    placeholder="New Password" 
                    value={passwordData.newPassword} 
                    onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})} 
                    required 
                    className="form-input" 
                  />
                  <input 
                    type="password" 
                    placeholder="Confirm New Password" 
                    value={passwordData.confirmPassword} 
                    onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})} 
                    required 
                    className="form-input" 
                  />
                </div>
                <div className="form-actions" style={{marginTop: '1rem'}}>
                  <button type="submit" className="btn btn-primary" disabled={passwordLoading}>
                    {passwordLoading ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* IMAGE UPLOAD & FILES */}
          <div id="admin-uploads" className="dashboard-content glass-panel mb-4">
            <div className="admin-grid">
              {/* IMAGE UPLOAD */}
              <div className="admin-section">
                <h3>Profile Image</h3>
                <div className="preview-container">
                  {currentImage && <img src={currentImage} alt="Current Profile" className="preview-img" />}
                </div>
                <form onSubmit={handleProfileImageSubmitIntercept} className="upload-form">
                  <input type="file" accept=".jpg,.jpeg,.png" onChange={(e) => setSelectedImage(e.target.files[0])} className="file-input" />
                  <div className="notify-checkbox-wrapper mb-2" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={notifyProfile} 
                        onChange={(e) => setNotifyProfile(e.target.checked)} 
                        style={{ cursor: 'pointer' }}
                      />
                      <span>Notify Subscribers</span>
                    </label>
                  </div>
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
          <div id="admin-stats" className="dashboard-content glass-panel mb-4">
            <div className="section-header">
              <h3>Portfolio Statistics</h3>
            </div>
            <form onSubmit={handleStatsSubmitIntercept} className="project-form">
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
              <div className="form-actions" style={{marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '15px'}}>
                <div className="notify-checkbox-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem', color: 'var(--text-muted)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={notifyStats} 
                      onChange={(e) => setNotifyStats(e.target.checked)} 
                      style={{ cursor: 'pointer' }}
                    />
                    <span>Notify Subscribers</span>
                  </label>
                </div>
                <button type="submit" className="btn btn-primary" disabled={statsLoading}>
                  {statsLoading ? 'Updating...' : 'Update Statistics'}
                </button>
              </div>
            </form>
          </div>

          {/* MAINTENANCE MODE SYSTEM SECTION */}
          <div id="admin-maintenance" className="dashboard-content glass-panel mb-4">
            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Maintenance Mode System</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="tiny-text" style={{ fontSize: '0.9rem', color: maintenanceEnabled ? 'var(--accent-tertiary)' : 'var(--text-muted)', fontWeight: 600 }}>
                  {maintenanceEnabled ? 'Active / Scheduled' : 'Deactivated'}
                </span>
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={maintenanceEnabled} 
                    onChange={e => setMaintenanceEnabled(e.target.checked)} 
                  />
                  <span className="slider"></span>
                </label>
              </div>
            </div>
            
            <form onSubmit={handleMaintenanceSubmit} className="project-form">
              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Start Date</label>
                  <input 
                    type="date" 
                    value={maintenanceStartDate} 
                    onChange={e => setMaintenanceStartDate(e.target.value)} 
                    className="form-input" 
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Start Time</label>
                  <input 
                    type="time" 
                    value={maintenanceStartTime} 
                    onChange={e => setMaintenanceStartTime(e.target.value)} 
                    className="form-input" 
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>End Date</label>
                  <input 
                    type="date" 
                    value={maintenanceEndDate} 
                    onChange={e => setMaintenanceEndDate(e.target.value)} 
                    className="form-input" 
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>End Time</label>
                  <input 
                    type="time" 
                    value={maintenanceEndTime} 
                    onChange={e => setMaintenanceEndTime(e.target.value)} 
                    className="form-input" 
                  />
                </div>
              </div>

              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Custom Maintenance Message</label>
                <textarea 
                  placeholder="Sorry for the inconvenience. The portfolio is currently under maintenance and will automatically resume once the upgrade is completed." 
                  value={maintenanceMessage} 
                  onChange={e => setMaintenanceMessage(e.target.value)} 
                  required 
                  className="form-input" 
                  rows="3" 
                />
              </div>

              <div className="form-actions" style={{ marginTop: '1rem' }}>
                <button type="submit" className="btn btn-primary" disabled={maintenanceLoading}>
                  {maintenanceLoading ? 'Updating settings...' : 'Save Maintenance Settings'}
                </button>
              </div>
            </form>
          </div>

          {/* PROJECTS SECTION */}
          <div id="admin-projects" className="dashboard-content glass-panel mb-4">
            <div className="section-header">
              <h3>Projects</h3>
              <div className="header-actions">
                <Link to="/prem-manage-reviews" className="btn btn-outline btn-sm mr-2">
                  <FaStar /> Manage Reviews
                </Link>
                <button className="btn btn-primary btn-sm" onClick={() => { setShowProjectForm(!showProjectForm); setEditingProject(null); setProjectForm({ title: '', description: '', tags: '', link: '', github: '', pptLink: '', image_alt: '', image_description: '' }); }}>
                  <FaPlus /> Add Project
                </button>
              </div>
            </div>

            <>
              {showProjectForm && (
                <form className="project-form" onSubmit={handleProjectSubmitIntercept}>
                  <input type="text" placeholder="Title" value={projectForm.title} onChange={e => setProjectForm({...projectForm, title: e.target.value})} required className="form-input" />
                  <textarea placeholder="Description" value={projectForm.description} onChange={e => setProjectForm({...projectForm, description: e.target.value})} required className="form-input" rows="3" />
                  <input type="text" placeholder="Tags (comma separated)" value={projectForm.tags} onChange={e => setProjectForm({...projectForm, tags: e.target.value})} required className="form-input" />
                  <div className="form-row">
                    <input type="text" placeholder="Live Link URL" value={projectForm.link} onChange={e => setProjectForm({...projectForm, link: e.target.value})} className="form-input" />
                    <input type="text" placeholder="GitHub URL" value={projectForm.github} onChange={e => setProjectForm({...projectForm, github: e.target.value})} className="form-input" />
                    <input type="text" placeholder="PPT Link URL" value={projectForm.pptLink || ''} onChange={e => setProjectForm({...projectForm, pptLink: e.target.value})} className="form-input" />
                  </div>
                  <div className="form-row">
                    <input type="text" placeholder="Base Image Alt Text (SEO)" value={projectForm.image_alt || ''} onChange={e => setProjectForm({...projectForm, image_alt: e.target.value})} className="form-input" />
                    <input type="text" placeholder="Base Image SEO Description" value={projectForm.image_description || ''} onChange={e => setProjectForm({...projectForm, image_description: e.target.value})} className="form-input" />
                  </div>

                  {editingProject && (
                    <div className="project-image-manager glass-panel mb-3 p-3">
                      <h4 className="small-title mb-2">Project Image Gallery</h4>
                      <div className="form-group mb-3">
                        <label className="btn btn-outline btn-sm w-100" style={{cursor: 'pointer'}}>
                          <FaUpload /> {uploadingProjectImages ? 'Uploading...' : 'Upload Project Images (Multiple)'}
                          <input type="file" multiple accept="image/*" onChange={handleProjectImagesUpload} style={{display: 'none'}} />
                        </label>
                      </div>

                      <div className="project-images-grid">
                        {projectImages.length > 0 ? projectImages.map((img, idx) => (
                          <div key={img.id} className="project-image-item">
                            <img src={img.image_url} alt={img.alt_text} />
                            <div className="image-overlay">
                              <span className="image-num">#{idx + 1}</span>
                              <button type="button" onClick={() => deleteProjectImage(img.id)} className="delete-icon-btn"><FaTrash /></button>
                            </div>
                          </div>
                        )) : <p className="text-muted small">No images added to this project yet.</p>}
                      </div>
                    </div>
                  )}

                  <div className="notify-checkbox-wrapper mb-2" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={notifyProjects} 
                        onChange={(e) => setNotifyProjects(e.target.checked)} 
                        style={{ cursor: 'pointer' }}
                      />
                      <span>Notify Subscribers</span>
                    </label>
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="btn btn-primary">{editingProject ? 'Update Info' : 'Save & Add Images'}</button>
                    <button type="button" className="btn btn-outline" onClick={() => { setShowProjectForm(false); setEditingProject(null); setProjectImages([]); }}>Cancel</button>
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
                        <td data-label="Title">{p.title}</td>
                        <td data-label="Tags">{p.tags}</td>
                        <td className="actions-cell" data-label="Actions">
                          <div className="share-tools-mini">
                            <button onClick={() => copyToClipboard(`${window.location.origin}/project/${p.slug || p.id}`)} title="Copy Project Link" className="edit-btn"><FaLink /></button>
                            <button onClick={() => copyToClipboard(`${window.location.origin}/review/${p.slug || p.id}`)} title="Copy Review Link" className="edit-btn"><FaStar /></button>
                            <button onClick={() => setSelectedProjectForQR(p)} title="Generate QR" className="edit-btn"><FaQrcode /></button>
                          </div>
                          <button onClick={() => { 
                            setEditingProject(p);
                            setProjectForm({ ...p, image_alt: p.image_alt || '', image_description: p.image_description || '' });
                            setShowProjectForm(true);
                            fetchProjectImages(p.id);
                          }} className="edit-btn"><FaEdit /></button>
                          <button onClick={() => deleteProject(p.id)} className="delete-btn"><FaTrash /></button>
                        </td>
                      </tr>
                    )) : <tr><td colSpan="3" className="text-center py-4">No projects found.</td></tr>}
                  </tbody>
                </table>
              </div>
            </>
          </div>

          {/* CERTIFICATES SECTION */}
          <div id="admin-certificates" className="dashboard-content glass-panel mb-4">
            <div className="section-header">
              <h3>Certificates</h3>
              <button className="btn btn-primary btn-sm" onClick={() => { setShowCertForm(!showCertForm); setEditingCert(null); setCertForm({ title: '', description: '', date: '', image: null, image_alt: '' }); }}>
                <FaPlus /> Add Certificate
              </button>
            </div>

            {showCertForm && (
              <form className="project-form" onSubmit={handleCertSubmitIntercept}>
                <input type="text" placeholder="Title" value={certForm.title} onChange={e => setCertForm({...certForm, title: e.target.value})} required className="form-input" />
                <textarea placeholder="Description" value={certForm.description} onChange={e => setCertForm({...certForm, description: e.target.value})} required className="form-input" rows="3" />
                <div className="form-row">
                  <input type="date" value={certForm.date} onChange={e => setCertForm({...certForm, date: e.target.value})} required className="form-input" />
                  <input type="text" placeholder="Image Alt Text (SEO)" value={certForm.image_alt || ''} onChange={e => setCertForm({...certForm, image_alt: e.target.value})} className="form-input" />
                  <input type="file" accept="image/*" onChange={e => setCertForm({...certForm, image: e.target.files[0]})} className="form-input" />
                </div>
                <div className="notify-checkbox-wrapper mb-2" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={notifyCertificates} 
                      onChange={(e) => setNotifyCertificates(e.target.checked)} 
                      style={{ cursor: 'pointer' }}
                    />
                    <span>Notify Subscribers</span>
                  </label>
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
                        <button onClick={() => { setEditingCert(c); setCertForm({ title: c.title, description: c.description, date: c.date, image: null, image_alt: c.image_alt || '' }); setShowCertForm(true); }} className="edit-btn"><FaEdit /></button>
                        <button onClick={() => deleteCertificate(c.id)} className="delete-btn"><FaTrash /></button>
                      </td>
                    </tr>
                  )) : <tr><td colSpan="3" className="text-center">No certificates found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          {/* MEMORABLE IMAGES SECTION */}
          <div id="admin-memories" className="dashboard-content glass-panel mb-4">
            <div className="section-header">
              <h3>Memorable Images</h3>
              <button className="btn btn-primary btn-sm" onClick={() => { setShowMemImageForm(!showMemImageForm); setMemImageForm({ title: '', image: null, image_alt: '', image_description: '' }); }}>
                <FaPlus /> Add Memory
              </button>
            </div>

            {showMemImageForm && (
              <form className="project-form" onSubmit={handleMemImageSubmitIntercept}>
                <input type="text" placeholder="Image Title" value={memImageForm.title} onChange={e => setMemImageForm({...memImageForm, title: e.target.value})} required className="form-input" />
                <div className="form-row">
                  <input type="text" placeholder="Image Alt Text (SEO)" value={memImageForm.image_alt || ''} onChange={e => setMemImageForm({...memImageForm, image_alt: e.target.value})} className="form-input" />
                  <input type="text" placeholder="Image SEO Description" value={memImageForm.image_description || ''} onChange={e => setMemImageForm({...memImageForm, image_description: e.target.value})} className="form-input" />
                  <input type="file" accept="image/*" onChange={e => setMemImageForm({...memImageForm, image: e.target.files[0]})} required className="form-input" />
                </div>
                <div className="notify-checkbox-wrapper mb-2" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={notifyMemories} 
                      onChange={(e) => setNotifyMemories(e.target.checked)} 
                      style={{ cursor: 'pointer' }}
                    />
                    <span>Notify Subscribers</span>
                  </label>
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
          <div id="admin-skills" className="dashboard-content glass-panel mb-4">
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
              <div className="notify-checkbox-wrapper mb-2" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={notifySkills} 
                    onChange={(e) => setNotifySkills(e.target.checked)} 
                    style={{ cursor: 'pointer' }}
                  />
                  <span>Notify Subscribers</span>
                </label>
              </div>
              <button onClick={handleSkillsSubmitIntercept} className="btn btn-primary" disabled={skillsLoading}>
                {skillsLoading ? 'Saving...' : 'Save All Skills Changes'}
              </button>
            </div>
          </div>
          
          {/* ADMIN WHITELIST SECTION (Super Admin Only) */}
          {isSuperAdmin && (
            <div id="admin-whitelist" className="dashboard-content glass-panel mb-4" style={{ border: '1px solid var(--primary-color)' }}>
              <div className="section-header">
                <h3>Admin Access Whitelist</h3>
                <button className="btn btn-primary btn-sm" onClick={() => setShowWhitelistForm(!showWhitelistForm)}>
                  <FaPlus /> {showWhitelistForm ? 'Cancel' : 'Authorize New Admin'}
                </button>
              </div>

              {showWhitelistForm && (
                <form className="project-form" onSubmit={handleWhitelistSubmit}>
                  <div className="form-row">
                    <input 
                      type="email" 
                      placeholder="Email Address" 
                      value={whitelistForm.email} 
                      onChange={e => setWhitelistForm({...whitelistForm, email: e.target.value})} 
                      required 
                      className="form-input" 
                    />
                    <input 
                      type="password" 
                      placeholder="Temporary Password" 
                      value={whitelistForm.password} 
                      onChange={e => setWhitelistForm({...whitelistForm, password: e.target.value})} 
                      required 
                      className="form-input" 
                    />
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="btn btn-primary">Add to Whitelist</button>
                    <button type="button" className="btn btn-outline" onClick={() => setShowWhitelistForm(false)}>Cancel</button>
                  </div>
                </form>
              )}

              {resettingAdmin && (
                <form className="project-form mb-4" onSubmit={handleAdminPasswordReset} style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '15px', borderRadius: '8px' }}>
                  <p>Resetting password for: <strong>{resettingAdmin.email}</strong></p>
                  <div className="form-row">
                    <input 
                      type="password" 
                      placeholder="New Password" 
                      value={adminResetPass} 
                      onChange={e => setAdminResetPass(e.target.value)} 
                      required 
                      className="form-input" 
                    />
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="btn btn-primary">Update Password</button>
                    <button type="button" className="btn btn-outline" onClick={() => { setResettingAdmin(null); setAdminResetPass(''); }}>Cancel</button>
                  </div>
                </form>
              )}

              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr><th>Email</th><th>Status</th><th>Added On</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {whitelist.map(adm => (
                      <tr key={adm.id}>
                        <td>{adm.email}</td>
                        <td>{adm.is_super_admin ? <span className="tag" style={{background: 'var(--primary-color)'}}>Primary</span> : <span className="tag">Secondary</span>}</td>
                        <td>{new Date(adm.created_at).toLocaleDateString()}</td>
                        <td className="actions-cell" style={{ justifyContent: adm.is_super_admin ? 'center' : 'flex-start' }}>
                          {!adm.is_super_admin ? (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button 
                                onClick={() => setResettingAdmin(adm)} 
                                className="btn btn-outline btn-sm" 
                                style={{ fontSize: '12px', padding: '4px 8px' }}
                              >
                                Reset Password
                              </button>
                              <button 
                                onClick={() => removeAdmin(adm.id)} 
                                className="delete-btn" 
                                title="Remove Admin"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VISITOR ANALYTICS SECTION */}
          <div id="admin-analytics" className="dashboard-content glass-panel mb-4">
            <div className="section-header contact-header">
              <div>
                <h3 className="section-title-small" style={{ margin: 0 }}>Recent Visitor Traffic</h3>
                <p className="text-muted small">Showing latest 5 of {totalVisitors} sessions. (Active subscribers: {recentVisitors.filter(v => v.subscription_status === 'subscribed').length || 0} in this list)</p>
              </div>
              <div>
                <Link to="/all-visitors" className="btn btn-outline btn-sm">Full View</Link>
              </div>
            </div>
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>IP Address</th>
                    <th>Device Info</th>
                    <th>Push Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentVisitors.length > 0 ? recentVisitors.map((v, idx) => (
                    <tr key={idx}>
                      <td>{new Date(v.visited_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                      <td><code>{v.ip}</code></td>
                      <td className="msg-cell" title={v.user_agent}>{v.user_agent ? (v.user_agent.length > 40 ? v.user_agent.substring(0, 40) + '...' : v.user_agent) : 'Unknown'}</td>
                      <td>
                        {v.subscription_status === 'subscribed' ? (
                          <span className="tag" style={{ background: '#10B981', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>Subscribed</span>
                        ) : v.subscription_status === 'dismissed' ? (
                          <span className="tag" style={{ background: '#F59E0B', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>Dismissed</span>
                        ) : (
                          <span className="tag" style={{ background: '#6B7280', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>Not Subscribed</span>
                        )}
                      </td>
                    </tr>
                  )) : <tr><td colSpan="4" className="text-center">No recent visits recorded.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          {/* BROADCAST PUSH NOTIFICATION SECTION */}
          <div id="admin-broadcast" className="dashboard-content glass-panel mb-4">
            <div className="section-header">
              <div>
                <h3 className="section-title-small" style={{ margin: 0 }}>Broadcast Custom Push Notification</h3>
                <p className="text-muted small">Send a manual custom message notification to all subscribed users immediately.</p>
              </div>
            </div>
            
            <div className="project-form mt-3" style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <div className="form-group mb-3">
                <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Notification Title</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Check out my new project!" 
                  value={customNotifyTitle} 
                  onChange={(e) => setCustomNotifyTitle(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>
              <div className="form-group mb-3">
                <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Notification Message</label>
                <textarea 
                  className="form-input" 
                  placeholder="Enter the body of your message..." 
                  value={customNotifyMessage} 
                  onChange={(e) => setCustomNotifyMessage(e.target.value)}
                  style={{ width: '100%', minHeight: '80px', boxSizing: 'border-box' }}
                />
              </div>
              <div className="form-group mb-3">
                <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Destination URL</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. https://mrprem.in/#projects (Defaults to home page)" 
                  value={customNotifyUrl} 
                  onChange={(e) => setCustomNotifyUrl(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>
              <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '15px' }}>
                <button 
                  onClick={handleSendCustomBroadcast} 
                  className="btn btn-primary" 
                  disabled={broadcastLoading}
                >
                  {broadcastLoading ? 'Sending...' : 'Send Broadcast Notification 🚀'}
                </button>
              </div>
            </div>
          </div>

          {/* MESSAGES SECTION */}
          <div id="admin-messages" className="dashboard-content glass-panel">
            <div className="section-header contact-header">
              <div>
                <h3 className="section-title-small" style={{ margin: 0 }}>Recent Contact Submissions</h3>
                <p className="text-muted small">Showing latest 10 of {totalMessages} messages</p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <Link to="/all-messages" className="btn btn-outline btn-sm">See All Messages</Link>
                <button className="btn btn-outline btn-sm" onClick={downloadCSV}>
                  Download CSV
                </button>
              </div>
            </div>
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr><th>Date & Time</th><th>Name</th><th>Email</th><th>Message Preview</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {messages.length > 0 ? messages.map(msg => (
                    <tr key={msg.id} className="message-row">
                      <td>{new Date(msg.date).toLocaleDateString()}</td>
                      <td>{msg.name}</td>
                      <td><a href={`mailto:${msg.email}`} className="email-link">{msg.email}</a></td>
                      <td className="msg-cell">
                        {msg.message.split(' ').slice(0, 4).join(' ')}{msg.message.split(' ').length > 4 ? '...' : ''}
                      </td>
                      <td className="actions-cell">
                        <button onClick={() => setSelectedMessage(msg)} className="edit-btn" title="View Details"><FaEye /></button>
                        <button onClick={() => deleteMessage(msg.id)} className="delete-btn" title="Delete"><FaTrash /></button>
                      </td>
                    </tr>
                  )) : <tr><td colSpan="5" className="text-center">No messages found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          {/* MESSAGE DETAIL MODAL */}
          {selectedMessage && (
            <div className="modal-overlay" onClick={() => setSelectedMessage(null)}>
              <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>Message Details</h3>
                  <button className="close-btn" onClick={() => setSelectedMessage(null)}><FaTimes /></button>
                </div>
                <div className="modal-body">
                  <div className="detail-item">
                    <label><FaUser /> From:</label>
                    <p>{selectedMessage.name} ({selectedMessage.email})</p>
                  </div>
                  <div className="detail-item">
                    <label><FaClock /> Received On:</label>
                    <p>{new Date(selectedMessage.date).toLocaleString()}</p>
                  </div>
                  <div className="detail-item mt-3">
                    <label>Full Message:</label>
                    <div className="full-message-box">
                      {selectedMessage.message}
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <a 
                    href={`mailto:${selectedMessage.email}?subject=Reply from Prem Prasad Pradhan&body=Hello ${selectedMessage.name}, regarding your message: "${selectedMessage.message.substring(0, 50)}..."\n\n`}
                    className="btn btn-primary"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FaReply /> Reply via Gmail
                  </a>
                  <button className="btn btn-outline" onClick={() => setSelectedMessage(null)}>Close</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
      
      {/* Push Notification Confirmation Modal */}
      <ConfirmNotificationModal
        isOpen={confirmModal.isOpen}
        titleText={confirmModal.titleText}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
      />
    </div>
  );
};

export default AdminDashboard;
