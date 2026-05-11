import { Routes, Route, Navigate } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { useEffect } from 'react'
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
import ScrollManager from './components/ScrollManager'
import ChatBot from './components/ChatBot'
import './App.css'

// MANDATORY: Disable browser's native scroll restoration globally to take full control.
// This prevents the browser from jumping to incorrect positions during React hydration.
if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

function App() {
  useEffect(() => {
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
        link.href = data.faviconUrl.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL}${data.faviconUrl}?t=${new Date().getTime()}` : data.faviconUrl;
      } catch (err) {
        console.error('Error fetching favicon:', err);
      }
    };
    fetchFavicon();
    
    // Track Visitor with Session ID
    let sessionId = sessionStorage.getItem('visitor_session_id');
    if (!sessionId) {
      sessionId = Math.random().toString(36).substring(2, 15) + Date.now();
      sessionStorage.setItem('visitor_session_id', sessionId);
    }

    fetch(`${import.meta.env.VITE_API_URL}/api/track-visitor`, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId })
    })
      .catch(err => console.error('Visitor tracking failed:', err));
  }, []);

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
        <Route path="/admin/reviews" element={<ManageReviews />} />
        <Route path="/memories" element={<MemoriesPage />} />
        <Route path="/memory/:idOrSlug" element={<MemoryDetail />} />
        <Route path="/github-insights" element={<GithubInsights />} />
        
        {/* Catch-all redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ChatBot />
    </HelmetProvider>
  )
}

export default App
