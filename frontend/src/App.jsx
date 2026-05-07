import { Routes, Route, Navigate } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { useEffect } from 'react'
import Portfolio from './pages/Portfolio'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import CertificateDetail from './pages/CertificateDetail'
import ProjectDetail from './pages/ProjectDetail'
import MemoriesPage from './pages/MemoriesPage'
import PersonalVault from './pages/PersonalVault'
import AllMessages from './pages/AllMessages'
import './App.css'

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
  }, []);

  return (
    <HelmetProvider>
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>
      
      <Routes>
        <Route path="/" element={<Portfolio />} />
        
        {/* Secure Admin Routes */}
        <Route path="/prem-login-2026" element={<AdminLogin />} />
        <Route path="/prem-dashboard-2026" element={<AdminDashboard />} />
        <Route path="/personal-vault" element={<PersonalVault />} />
        <Route path="/all-messages" element={<AllMessages />} />
        
        {/* Redirect old admin routes to home */}
        <Route path="/admin" element={<Navigate to="/" replace />} />
        <Route path="/dashboard" element={<Navigate to="/" replace />} />
        
        <Route path="/certificate/:id" element={<CertificateDetail />} />
        <Route path="/project/:id" element={<ProjectDetail />} />
        <Route path="/memories" element={<MemoriesPage />} />
        
        {/* Catch-all redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HelmetProvider>
  )
}

export default App
