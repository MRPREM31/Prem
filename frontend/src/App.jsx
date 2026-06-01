import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { useEffect, useState } from 'react'
import Portfolio from './pages/Portfolio'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import CertificateDetail from './pages/CertificateDetail'
import ProjectDetail from './pages/ProjectDetail'
import ReviewPage from './pages/ReviewPage'
import ManageReviews from './pages/ManageReviews'
import MemoriesPage from './pages/MemoriesPage'
import MemoryDetail from './pages/MemoryDetail'
import PersonalVault from './pages/PersonalVault'
import AllMessages from './pages/AllMessages'
import AllVisitors from './pages/AllVisitors'
import AllProjects from './pages/AllProjects'
import AllCertificates from './pages/AllCertificates'
import GithubInsights from './pages/GithubInsights'
import MediaLibrary from './pages/MediaLibrary'
import PublicImageDetail from './pages/PublicImageDetail'
import SecurePortal from './pages/SecurePortal'
import AdminVault from './pages/AdminVault'
import ScrollManager from './components/ScrollManager'
import ChatBot from './components/ChatBot'
import Maintenance from './pages/Maintenance'
import maintenanceConfig from './config/maintenanceConfig'
import SubscriptionPopup from './components/SubscriptionPopup'
import { Toaster } from 'react-hot-toast'
import './App.css'

// MANDATORY: Disable browser's native scroll restoration globally to take full control.
// This prevents the browser from jumping to incorrect positions during React hydration.
if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

function App() {
  const location = useLocation();

  // Helper to determine if the frontend emergency maintenance is active and within bounds
  const isEmergencyMaintenanceActive = () => {
    if (!maintenanceConfig || !maintenanceConfig.enabled) return false;
    const now = new Date();
    const end = new Date(maintenanceConfig.endDate);
    return now < end;
  };

  // Initialize state instantly to support offline / fast load
  const [maintenance, setMaintenance] = useState(() => {
    const active = isEmergencyMaintenanceActive();
    return {
      active: active,
      start_time: active ? new Date().toISOString() : null,
      end_time: active ? maintenanceConfig.endDate : null,
      message: active ? maintenanceConfig.message : ''
    };
  });

  const [loading, setLoading] = useState(true);

  const checkMaintenance = async () => {
    const emergencyActive = isEmergencyMaintenanceActive();
    
    // If the frontend hardcoded emergency maintenance override is active, immediately use the frontend configuration
    if (emergencyActive) {
      setMaintenance({
        active: true,
        fallback: true,
        start_time: new Date().toISOString(),
        end_time: maintenanceConfig.endDate,
        message: maintenanceConfig.message
      });
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/maintenance-status`);
      if (!res.ok) throw new Error("Backend response error");
      const data = await res.json();
      
      setMaintenance(data);
    } catch (err) {
      console.log("Backend unavailable. Checking frontend maintenance fallback.");
      const isFallbackActive = isEmergencyMaintenanceActive();
      setMaintenance({
        active: isFallbackActive,
        fallback: true,
        start_time: isFallbackActive ? new Date().toISOString() : null,
        end_time: isFallbackActive ? maintenanceConfig.endDate : null,
        message: maintenanceConfig.message || "The portfolio is currently undergoing scheduled maintenance and upgrades. We will resume automatically once completed!"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkMaintenance();
    
    // Poll maintenance status every 30 seconds
    const interval = setInterval(checkMaintenance, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (loading || maintenance.active) return;

    const fetchFavicon = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/favicon`);
        const data = await res.json();
        let link = document.querySelector("link[rel~='icon']");
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.getElementsByTagName('head')[0].appendChild(link);
        }
        if (data && data.faviconUrl) {
          link.href = (data.faviconUrl && typeof data.faviconUrl === 'string' && data.faviconUrl.startsWith('/uploads')) 
            ? `${import.meta.env.VITE_API_URL}${data.faviconUrl}?t=${new Date().getTime()}` 
            : data.faviconUrl;
        }
      } catch (err) {
        console.warn('[Resilience] Error fetching favicon:', err.message || err);
      }
    };
    fetchFavicon();
    
    // Track Visitor with unified localStorage Session ID
    let sessionId = localStorage.getItem('mrprem_session_id');
    if (!sessionId) {
      sessionId = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      localStorage.setItem('mrprem_session_id', sessionId);
    }
    sessionStorage.setItem('visitor_session_id', sessionId);

    fetch(`${import.meta.env.VITE_API_URL}/api/track-visitor`, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId })
    })
      .catch(err => console.warn('[Resilience] Visitor tracking backend is currently sleeping.'));
  }, [loading, maintenance.active]);

  const isAdminPath = (path) => {
    const adminRoutes = [
      '/prem-login-2026',
      '/prem-dashboard-2026',
      '/personal-vault',
      '/all-messages',
      '/all-visitors',
      '/all-projects',
      '/all-certificates',
      '/prem-manage-reviews',
      '/prem-media-library',
      '/admin/manage-vault'
    ];
    return adminRoutes.some(route => path.toLowerCase().startsWith(route));
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#0b1120',
        color: '#f1f5f9',
        fontFamily: "'Inter', sans-serif"
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          border: '3px solid rgba(99, 102, 241, 0.1)',
          borderTopColor: '#6366f1',
          animation: 'spin 1s infinite linear'
        }} />
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (maintenance.active && !isAdminPath(location.pathname)) {
    return (
      <HelmetProvider>
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <Toaster position="top-center" reverseOrder={false} />
        <Maintenance 
          settings={maintenance} 
          onUnlock={() => setMaintenance(prev => ({ ...prev, active: false }))} 
        />
      </HelmetProvider>
    );
  }

  return (
    <HelmetProvider>
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>
      <ScrollManager />
      
      <Routes>
        <Route path="/" element={<Portfolio />} />
        
        {/* Secure Admin Routes */}
        <Route path="/prem-login-2026" element={<AdminLogin />} />
        <Route path="/prem-dashboard-2026" element={<AdminDashboard />} />
        <Route path="/personal-vault" element={<PersonalVault />} />
        <Route path="/all-messages" element={<AllMessages />} />
        <Route path="/all-visitors" element={<AllVisitors />} />
        <Route path="/all-projects" element={<AllProjects />} />
        <Route path="/all-certificates" element={<AllCertificates />} />
        
        {/* Redirect old admin routes to home */}
        <Route path="/admin" element={<Navigate to="/" replace />} />
        <Route path="/dashboard" element={<Navigate to="/" replace />} />
        
        <Route path="/certificate/:idOrSlug" element={<CertificateDetail />} />
        <Route path="/project/:idOrSlug" element={<ProjectDetail />} />
        <Route path="/review/:slug" element={<ReviewPage />} />
        <Route path="/prem-manage-reviews" element={<ManageReviews />} />
        <Route path="/memories" element={<MemoriesPage />} />
        <Route path="/memory/:idOrSlug" element={<MemoryDetail />} />
        <Route path="/github-insights" element={<GithubInsights />} />
        <Route path="/prem-media-library" element={<MediaLibrary />} />
        <Route path="/cdn/:slug" element={<PublicImageDetail />} />
        <Route path="/secure-portal" element={<SecurePortal />} />
        <Route path="/admin/manage-vault" element={<AdminVault />} />
        
        {/* Catch-all redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ChatBot />
      <SubscriptionPopup />
      <Toaster position="top-center" reverseOrder={false} />
    </HelmetProvider>
  )
}

export default App
