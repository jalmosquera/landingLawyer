import Header from './features/header/Header'
import Hero from './features/hero/Hero'
import About from './features/about/About'
import ContactForm from './features/contact-form/ContactForm'
import PracticeAreas from './features/practice-areas/PracticeAreas'
import Testimonials from './features/testimonials/Testimonials'
import Footer from './features/footer/Footer'

function App() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <Hero />
        <About />
        <PracticeAreas />
        <Testimonials />
        <ContactForm />
      </main>
      <Footer />
    </div>
  )
}

export default App
