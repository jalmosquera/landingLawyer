import { FaBalanceScale, FaGem, FaBullseye, FaUsers, FaComments, FaStar } from 'react-icons/fa'

function About() {
  const values = [
    { title: 'Experiencia', icon: FaBalanceScale },
    { title: 'Honestidad', icon: FaGem },
    { title: 'Resultados', icon: FaBullseye },
    { title: 'Compromiso', icon: FaUsers },
    { title: 'Consultas Gratuitas', icon: FaComments },
    { title: 'Atención Personalizada', icon: FaStar },
  ]

  return (
    <section id="about" className="relative py-20 bg-gray-50" style={{ marginTop: '-1px' }}>
      <div className="container mx-auto px-4">
        {/* Introduction */}
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-primary mb-6">
            Sobre el Despacho
          </h2>
          <p className="text-lg text-gray-700 mb-4">
            Despacho de abogados especializado en Derecho Penal, Civil y Contencioso-Administrativo,
            con más de 25 años de experiencia defendiendo los intereses de nuestros clientes
            en Málaga, Ronda, Antequera, Coín, Sevilla y Madrid.
          </p>
          <p className="text-lg text-gray-700">
            Ofrecemos tanto representación judicial ante los Tribunales como asesoramiento
            extrajudicial, con especial énfasis en el sector inmobiliario y asuntos de naturaleza negocial.
          </p>
        </div>

        {/* Meet Attorney Section */}
        <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg p-8 mb-16">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="w-full md:w-1/3">
              <div className="aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-primary to-primary-light">
                <img
                  src="/Consejero.jpg"
                  alt="Consejero"
                  className="w-full h-full object-cover block"
                />
              </div>
            </div>

            <div className="w-full md:w-2/3">
              <h3 className="text-3xl font-bold text-primary mb-4">
                Eduardo Bernal Fernández
              </h3>

              <p className="text-sm text-gray-600 mb-4">
                Colegiado Nº 4941 - Ilustre Colegio de Abogados de Málaga (ICAMA)
              </p>

              <p className="text-gray-700 mb-4">
                Abogado en ejercicio con más de 25 años de experiencia exclusiva en el sector privado,
                habiendo representado tanto a clientes institucionales como entidades públicas. Desarrolla
                su labor profesional en la faceta judicial, compareciendo en representación y defensa de
                los intereses de sus clientes ante los Tribunales Penales, Civiles y Contencioso-Administrativos.
              </p>

              <p className="text-gray-700 mb-4">
                Distinguido por el Ilustre Colegio de Abogados de Málaga el 21 de octubre de 2025 por
                sus 25 años de ejercicio profesional. Acreedor de una mención por su participación
                como concejal del Ayuntamiento de Ardales en defensa de los intereses democráticos
                imperantes en nuestro sistema político, social y judicial.
              </p>

              <p className="text-gray-700">
                Cuenta con numerosos cursos de especialización en diferentes materias propias de su
                profesión, incluyendo Derecho Notarial y Oratoria.
              </p>
            </div>
          </div>
        </div>

        {/* Values Grid */}
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl font-bold text-primary text-center mb-12">
            Nuestros Valores
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
