import { useState } from 'react'

function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0)

  const testimonials = [
    {
      name: 'John Smith',
      rating: 5,
      text: 'Testimonial lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.',
      location: 'Syracuse, NY',
    },
    {
      name: 'Mary Johnson',
      rating: 5,
      text: 'Testimonial duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident.',
      location: 'Auburn, NY',
    },
    {
      name: 'Robert Davis',
      rating: 5,
      text: 'Testimonial sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque.',
      location: 'Oswego, NY',
    },
    {
      name: 'Sarah Williams',
      rating: 5,
      text: 'Testimonial laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.',
      location: 'Fulton, NY',
    },
  ]

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length)
  }

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  const currentTestimonial = testimonials[currentIndex]

  return (
    <section id="testimonials" className="relative py-20 bg-gray-50" style={{ marginTop: '-1px' }}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-primary mb-6">
            Client Testimonials
          </h2>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            Testimonials section lorem ipsum dolor sit amet, consectetur adipiscing
            elit. See what our clients have to say about us.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-xl p-8 md:p-12 relative">
            {/* Quote Icon */}
            <div className="text-accent text-6xl mb-4">"</div>

            {/* Testimonial Content */}
            <div className="mb-8">
              <p className="text-xl text-gray-700 italic mb-6">
                {currentTestimonial.text}
              </p>

              {/* Rating Stars */}
              <div className="flex justify-center mb-4">
                {[...Array(currentTestimonial.rating)].map((_, i) => (
                  <span key={i} className="text-accent text-2xl">
                    ★
                  </span>
                ))}
              </div>

              {/* Client Info */}
              <div className="text-center">
                <p className="font-bold text-primary text-lg">
                  {currentTestimonial.name}
                </p>
                <p className="text-gray-600">{currentTestimonial.location}</p>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-center items-center gap-4">
              <button
                onClick={prevTestimonial}
                className="bg-primary hover:bg-primary-light text-white rounded-full p-3 transition-colors duration-300"
                aria-label="Previous testimonial"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M15 19l-7-7 7-7"></path>
                </svg>
              </button>

              {/* Dots Indicator */}
              <div className="flex gap-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                      index === currentIndex ? 'bg-accent' : 'bg-gray-300'
                    }`}
                    aria-label={`Go to testimonial ${index + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={nextTestimonial}
                className="bg-primary hover:bg-primary-light text-white rounded-full p-3 transition-colors duration-300"
                aria-label="Next testimonial"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M9 5l7 7-7 7"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Testimonials
