import WaveDivider from '../../components/WaveDivider'

function Hero() {
  return (
    <section id="home" className="relative h-screen flex items-center justify-center">
      {/* Background Image Placeholder */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary-light">
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white text-6xl font-bold opacity-20">
            [HERO BACKGROUND IMAGE]
          </div>
        </div>
      </div>

      {/* Hero Content */}
      <div className="relative z-10 container mx-auto px-4 text-center text-white">
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
          Building a Foundation for Your Future
        </h1>
        <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
          Hero section lorem ipsum dolor sit amet, consectetur adipiscing elit.
          Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="#contact" className="btn-accent text-lg">
            Get Free Consultation
          </a>
          <a
            href="#about"
            className="bg-white text-primary hover:bg-gray-100 font-semibold py-3 px-8 rounded-lg transition-colors duration-300 text-lg"
          >
            Learn More
          </a>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 animate-bounce z-10">
        <svg
          className="w-6 h-6 text-white"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
        </svg>
      </div>

      {/* Wave Divider */}
      <WaveDivider position="bottom" />
    </section>
  )
}

export default Hero
