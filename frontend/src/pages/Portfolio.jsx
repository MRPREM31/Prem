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
        description="Official portfolio of Prem Prasad Pradhan. A passionate Software Developer specializing in full-stack web development, building scalable and user-centric digital solutions."
        keywords="Prem Prasad Pradhan, Software Developer, Portfolio, React Developer, Full Stack Developer, NIST University"
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
