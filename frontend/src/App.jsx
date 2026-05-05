import { Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import Portfolio from './pages/Portfolio'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import CertificateDetail from './pages/CertificateDetail'
import ProjectDetail from './pages/ProjectDetail'
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
    <>
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>
      
      <Routes>
        <Route path="/" element={<Portfolio />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/dashboard" element={<AdminDashboard />} />
        <Route path="/certificate/:id" element={<CertificateDetail />} />
        <Route path="/project/:id" element={<ProjectDetail />} />
      </Routes>
    </>
  )
}

export default App
