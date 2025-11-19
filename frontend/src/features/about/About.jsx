import { FaBalanceScale, FaGem, FaBullseye, FaUsers, FaComments, FaStar } from 'react-icons/fa'

function About() {
  const values = [
    { title: 'Experience', icon: FaBalanceScale },
    { title: 'Honesty', icon: FaGem },
    { title: 'Results', icon: FaBullseye },
    { title: 'Community', icon: FaUsers },
    { title: 'Free Consultations', icon: FaComments },
    { title: 'Client Focus', icon: FaStar },
  ]

  return (
    <section id="about" className="relative py-20 bg-gray-50" style={{ marginTop: '-1px' }}>
      <div className="container mx-auto px-4">
        {/* Introduction */}
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-primary mb-6">
            About Our Firm
          </h2>
          <p className="text-lg text-gray-700 mb-4">
            About section lorem ipsum dolor sit amet, consectetur adipiscing elit,
            sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
            enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
            aliquip ex ea commodo consequat.
          </p>
          <p className="text-lg text-gray-700">
            About section duis aute irure dolor in reprehenderit in voluptate velit
            esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat
            cupidatat non proident, sunt in culpa qui officia deserunt mollit anim
            id est laborum.
          </p>
        </div>

        {/* Meet Attorney Section */}
        <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg p-8 mb-16">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="w-full md:w-1/3">
              <div className="aspect-square bg-gradient-to-br from-primary to-primary-light rounded-lg flex items-center justify-center">
                <span className="text-white text-4xl font-bold">
                  [ATTORNEY PHOTO]
                </span>
              </div>
            </div>
            <div className="w-full md:w-2/3">
              <h3 className="text-3xl font-bold text-primary mb-4">
                Meet Daniel Testa
              </h3>
              <p className="text-gray-700 mb-4">
                Attorney profile lorem ipsum dolor sit amet, consectetur adipiscing
                elit, sed do eiusmod tempor incididunt ut labore et dolore magna
                aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco.
              </p>
              <p className="text-gray-700 mb-4">
                Attorney profile duis aute irure dolor in reprehenderit in voluptate
                velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint
                occaecat cupidatat non proident.
              </p>
              <p className="text-gray-700">
                Attorney profile sunt in culpa qui officia deserunt mollit anim id
                est laborum. Sed ut perspiciatis unde omnis iste natus error sit
                voluptatem accusantium.
              </p>
            </div>
          </div>
        </div>

        {/* Values Grid */}
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl font-bold text-primary text-center mb-12">
            Our Values
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {values.map((value, index) => {
              const IconComponent = value.icon
              return (
                <div
                  key={index}
                  className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 text-center"
                >
                  <div className="text-4xl mb-3 text-accent">
                    <IconComponent className="mx-auto" />
                  </div>
                  <h4 className="font-semibold text-primary">{value.title}</h4>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

export default About
