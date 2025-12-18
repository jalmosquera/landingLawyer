import { FaHome, FaGavel, FaBalanceScale, FaUsers, FaBriefcase, FaLandmark, FaHandshake } from 'react-icons/fa'
import WaveDivider from '../../components/WaveDivider'

function PracticeAreas() {
  const areas = [
    {
      title: 'Derecho Penal',
      description: 'Defensa y representación en procesos penales ante los tribunales de Málaga, Ronda, Antequera y otras jurisdicciones.',
      icon: FaGavel,
    },
    {
      title: 'Derecho Civil',
      description: 'Asesoramiento y litigación en asuntos civiles, incluyendo contratos, responsabilidad civil y reclamaciones.',
      icon: FaBalanceScale,
    },
    {
      title: 'Derecho Contencioso-Administrativo',
      description: 'Representación ante tribunales administrativos en defensa de los derechos frente a la Administración Pública.',
      icon: FaLandmark,
    },
    {
      title: 'Derecho Inmobiliario',
      description: 'Especialización en transacciones inmobiliarias, contratos de compraventa, arrendamientos y conflictos de propiedad.',
      icon: FaHome,
    },
    {
      title: 'Derecho Familiar',
      description: 'Asesoramiento en divorcios, custodia, pensiones alimenticias y otros asuntos de derecho de familia.',
      icon: FaUsers,
    },
    {
      title: 'Derecho Mercantil',
      description: 'Consultoría y representación en asuntos comerciales, sociedades y contratos mercantiles.',
      icon: FaBriefcase,
    },
    {
      title: 'Asesoramiento Negocial',
      description: 'Mediación y asesoramiento extrajudicial para la resolución de conflictos y negociaciones.',
      icon: FaHandshake,
    },
  ]

  return (
    <section id="practice-areas" className="relative py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-primary mb-6">
            Áreas de Práctica
          </h2>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            Más de 25 años de experiencia en múltiples especialidades del derecho,
            ofreciendo servicios integrales tanto en sede judicial como extrajudicial.
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
                <p className="text-gray-700 text-center">{area.description}</p>
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
