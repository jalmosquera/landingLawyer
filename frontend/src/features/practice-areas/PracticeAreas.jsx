import { FaHome, FaClipboardList, FaBalanceScale, FaUsers, FaHeart, FaBriefcase, FaAmbulance } from 'react-icons/fa'
import WaveDivider from '../../components/WaveDivider'

function PracticeAreas() {
  const areas = [
    {
      title: 'Real Estate',
      description: 'Practice area lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      icon: FaHome,
    },
    {
      title: 'Estate Planning',
      description: 'Practice area sed do eiusmod tempor incididunt ut labore et dolore.',
      icon: FaClipboardList,
    },
    {
      title: 'Estate Administration',
      description: 'Practice area ut enim ad minim veniam, quis nostrud exercitation.',
      icon: FaBalanceScale,
    },
    {
      title: 'Family Law',
      description: 'Practice area ullamco laboris nisi ut aliquip ex ea commodo consequat.',
      icon: FaUsers,
    },
    {
      title: 'Adoption',
      description: 'Practice area duis aute irure dolor in reprehenderit in voluptate.',
      icon: FaHeart,
    },
    {
      title: 'Bankruptcy',
      description: 'Practice area velit esse cillum dolore eu fugiat nulla pariatur.',
      icon: FaBriefcase,
    },
    {
      title: 'Personal Injury',
      description: 'Practice area excepteur sint occaecat cupidatat non proident.',
      icon: FaAmbulance,
    },
  ]

  return (
    <section id="practice-areas" className="relative py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-primary mb-6">
            Areas of Practice
          </h2>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            Practice areas section lorem ipsum dolor sit amet, consectetur adipiscing
            elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {areas.map((area, index) => {
            const IconComponent = area.icon
            return (
              <div
                key={index}
                className="relative bg-white rounded-xl p-8 pt-16 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-t-4 border-accent mt-8"
              >
                {/* Overlapping Icon */}
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                  <div className="bg-primary w-16 h-16 rounded-full flex items-center justify-center shadow-lg">
                    <IconComponent className="text-white text-3xl" />
                  </div>
                </div>

                {/* Card Content */}
                <h3 className="text-2xl font-bold text-primary mb-3 text-center">
                  {area.title}
                </h3>
                <p className="text-gray-700 mb-4 text-center">{area.description}</p>
                <div className="text-center">
                  <button className="text-accent font-semibold hover:underline">
                    Learn More →
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Wave Divider */}
      <WaveDivider position="bottom" />
    </section>
  )
}

export default PracticeAreas
