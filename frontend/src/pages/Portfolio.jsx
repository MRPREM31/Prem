import React, { useEffect } from 'react'
import SEO from '../components/SEO'
import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import About from '../components/About'
import Skills from '../components/Skills'
import Experience from '../components/Experience'
import Projects from '../components/Projects'
import Certificates from '../components/Certificates'
import Journey from '../components/Journey'
import MemorableImages from '../components/MemorableImages'
import Contact from '../components/Contact'
import Footer from '../components/Footer'

const Portfolio = () => {
  return (
    <div className="portfolio-page">
      <SEO 
        title="Prem Prasad Pradhan (MR.PREM) | Software Developer Portfolio"
        description="Official portfolio of Prem Prasad Pradhan (MR.PREM), showcasing AI-powered projects, full-stack development, GitHub analytics, and modern SaaS-style web applications."
        keywords="software developer portfolio, MR.PREM portfolio, Prem developer, Prem Prasad Pradhan, React Developer, Full Stack Developer, NIST University"
      />
      <Navbar />
      <main className="main-content">
        <Hero />
        <About />
        <Skills />
        <Experience />
        <Projects />
        <Certificates />
        <Journey />
        <MemorableImages />
        <Contact />
      </main>
      <Footer />
    </div>
  )
}

export default Portfolio
