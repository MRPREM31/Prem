import React, { useEffect } from 'react'
import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import About from '../components/About'
import Skills from '../components/Skills'
import Experience from '../components/Experience'
import Projects from '../components/Projects'
import Certificates from '../components/Certificates'
import Journey from '../components/Journey'
import Contact from '../components/Contact'
import Footer from '../components/Footer'

const Portfolio = () => {
  useEffect(() => {
    document.title = "Prem Prasad Pradhan | Software Developer Portfolio";
  }, []);
  return (
    <div className="portfolio-page">
      <Navbar />
      <main className="main-content">
        <Hero />
        <About />
        <Skills />
        <Experience />
        <Projects />
        <Certificates />
        <Journey />
        <Contact />
      </main>
      <Footer />
    </div>
  )
}

export default Portfolio
