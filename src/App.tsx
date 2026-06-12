import Nav from './components/Nav'
import Hero from './components/Hero'
import Lab from './components/Lab'
import About from './components/About'
import Experience from './components/Experience'
import Projects from './components/Projects'
import Publications from './components/Publications'
import Skills from './components/Skills'
import Education from './components/Education'
import Footer from './components/Footer'

export default function App() {
  return (
    <>
      <div className="noise" aria-hidden="true" />
      <Nav />
      <main>
        <Hero />
        <Lab />
        <About />
        <Experience />
        <Projects />
        <Publications />
        <Skills />
        <Education />
      </main>
      <Footer />
    </>
  )
}
