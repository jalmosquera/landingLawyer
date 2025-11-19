import { useState, useEffect } from 'react'

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const menuItems = [
    { label: 'Home', href: '#home' },
    { label: 'About', href: '#about' },
    { label: 'Practice Areas', href: '#practice-areas' },
    { label: 'Testimonials', href: '#testimonials' },
    { label: 'Contact', href: '#contact' },
  ]

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
  }, [isMenuOpen])

  return (
    <>
      <header className="bg-primary text-white shadow-lg sticky top-0 z-50">
        <nav className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center">
              <div className="text-2xl font-bold">
                <span className="text-accent">Law</span> Firm
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {menuItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="hover:text-accent transition-colors duration-300"
                >
                  {item.label}
                </a>
              ))}
            </div>

            {/* Contact Button */}
            <div className="hidden md:flex items-center space-x-4">
              <a href="tel:(315)255-3368" className="text-accent font-semibold text-lg">
                (315) 255-3368
              </a>
              <button className="btn-accent">Free Consultation</button>
            </div>

            {/* Mobile Menu Button - Hamburger */}
            <button
              className="md:hidden relative w-8 h-8 flex flex-col justify-center items-center focus:outline-none group"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              <span
                className={`block w-7 h-0.5 bg-white transition-all duration-300 ${
                  isMenuOpen ? 'rotate-45 translate-y-2' : 'mb-1.5'
                }`}
              ></span>
              <span
                className={`block h-0.5 bg-white transition-all duration-300 ${
                  isMenuOpen ? 'opacity-0 w-0' : 'opacity-100 w-6 mb-1.5'
                }`}
              ></span>
              <span
                className={`block w-4 h-0.5 bg-white transition-all duration-300 ${
                  isMenuOpen ? '-rotate-45 -translate-y-2 w-7' : ''
                }`}
              ></span>
            </button>
          </div>
        </nav>
      </header>

      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-300 md:hidden ${
          isMenuOpen ? 'opacity-40 z-40' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMenuOpen(false)}
      />

      {/* Fullwidth Mobile Menu */}
      <div
        className={`fixed inset-0 w-screen h-screen text-white transition-transform duration-500 ease-in-out md:hidden z-50 flex flex-col ${
          isMenuOpen ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        {/* Upper Section - Menu */}
        <div className="flex-1 bg-primary flex flex-col">
          {/* Header inside menu */}
          <div className="px-6 py-4 flex justify-between items-center">
            {/* Logo */}
            <div className="text-2xl font-bold">
              <span className="text-accent">Law</span> Firm
            </div>

            {/* Close Button */}
            <button
              className="relative w-8 h-8 flex flex-col justify-center items-center focus:outline-none"
              onClick={() => setIsMenuOpen(false)}
              aria-label="Close menu"
            >
              <span className="block w-7 h-0.5 bg-white rotate-45 translate-y-2"></span>
              <span className="block w-7 h-0.5 bg-white -rotate-45 -translate-y-2"></span>
            </button>
          </div>

          {/* Menu Title */}
          <div className="px-6 pt-8 pb-4">
            <h2 className="text-sm font-bold tracking-[0.3em] mb-8">MENU</h2>
          </div>

          {/* Menu Items */}
          <nav className="px-6 flex-1 flex flex-col justify-center">
            <div className="space-y-6">
              {menuItems.map((item, index) => (
                <a
                  key={item.label}
                  href={item.href}
                  className={`flex items-baseline hover:text-accent transition-all duration-300 transform group ${
                    isMenuOpen
                      ? 'translate-y-0 opacity-100'
                      : 'translate-y-12 opacity-0'
                  }`}
                  style={{
                    transitionDelay: isMenuOpen ? `${index * 100}ms` : '0ms',
                  }}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span className="text-sm text-gray-400 mr-3 font-light">
                    {String(index + 1).padStart(2, '0')}—
                  </span>
                  <span className="text-xl md:text-2xl font-light tracking-wide group-hover:translate-x-2 transition-transform duration-300">
                    {item.label}
                  </span>
                </a>
              ))}
            </div>
          </nav>
        </div>

        {/* Lower Section - Contact Info */}
        <div className="bg-primary-dark px-6 py-8">
          <h2 className="text-sm font-bold tracking-[0.3em] mb-6">OFFICE</h2>

          <div
            className={`space-y-3 transition-all duration-300 transform ${
              isMenuOpen
                ? 'translate-y-0 opacity-100'
                : 'translate-y-12 opacity-0'
            }`}
            style={{
              transitionDelay: isMenuOpen ? `${menuItems.length * 100}ms` : '0ms',
            }}
          >
            <p className="text-base font-semibold">NEW YORK</p>
            <p className="text-sm text-gray-300">
              Lorem Ipsum Street, 123
              <br />
              Syracuse, NY 13202
            </p>
            <a
              href="tel:(315)255-3368"
              className="block text-base text-accent hover:text-accent-light transition-colors duration-300 mt-3"
            >
              (315) 255-3368
            </a>
            <a
              href="mailto:info@lawfirm.com"
              className="block text-sm text-gray-300 hover:text-white transition-colors duration-300"
            >
              info@lawfirm.com
            </a>
            <button className="btn-accent w-full mt-6">
              Free Consultation
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default Header
