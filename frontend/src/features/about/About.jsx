import {
  FaBalanceScale,
  FaGem,
  FaBullseye,
  FaUsers,
  FaComments,
  FaStar,
} from "react-icons/fa";

function About() {
  const values = [
    { title: "Experiencia", icon: FaBalanceScale },
    { title: "Honestidad", icon: FaGem },
    { title: "Resultados", icon: FaBullseye },
    { title: "Compromiso", icon: FaUsers },
    { title: "Consultas Gratuitas", icon: FaComments },
    { title: "Atención Personalizada", icon: FaStar },
  ];

  return (
    <section
      id="about"
      className="relative py-20 bg-gray-50"
      style={{ marginTop: "-1px" }}
    >
      <div className="container mx-auto px-4">
        {/* Introduction */}
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-primary mb-6">
            Sobre el Despacho
          </h2>
          <p className="text-lg text-gray-700 mb-4">
            Despacho de abogados especializado en Derecho Penal, Civil y
            Contencioso-Administrativo, con más de 25 años de experiencia
            defendiendo los intereses de nuestros clientes en Málaga, Ronda,
            Antequera, Coín, Sevilla y Madrid.
          </p>
          <p className="text-lg text-gray-700">
            Ofrecemos tanto representación judicial ante los Tribunales como
            asesoramiento extrajudicial, con especial énfasis en el sector
            inmobiliario y asuntos de naturaleza negocial.
          </p>
        </div>

        {/* Meet Attorney Section */}
        <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg p-8 mb-16">
          {/* Imagen */}
          <div className="mb-8">
            <img
              src="/eduardoEvolutionPark.png"
              alt="Eduardo Bernal Fernández"
              className="w-full rounded-lg shadow-md"
            />
          </div>

          {/* Texto */}
          <div>
            <h3 className="text-3xl font-bold text-primary mb-4">
              Eduardo Bernal Fernández
            </h3>

            <p className="text-sm text-gray-600 mb-4">
              Colegiado Nº 4941 - Ilustre Colegio de Abogados de Málaga (ICAMA)
            </p>

            <p className="text-gray-700 mb-4">
              Abogado en ejercicio perteneciente al Ilustre Colegio de Abogados
              de Málaga. En el ejercicio de la Abogacía, siempre en el sector
              privado, si bien ha contado con clientes institucionales y
              entidades públicas; desarrolla su quehacer tanto en la faceta
              judicial compareciendo en representación y defensa de los
              intereses de sus clientes, en los órdenes y ante los Tribunales
              Penales, Civiles y Contencioso-Administrativos, tanto de Málaga,
              Ronda, Antequera, Coín, Sevilla y Madrid, preferentemente; como en
              la faceta extrajudicial, prioritariamente, en el sector
              inmobiliario y especialmente en asuntos de naturaleza negocial.
            </p>

            <p className="text-gray-700 mb-4">
              Desarrolla dicha profesión, de forma exclusiva, desde hace más de
              25 años, siendo distinguido por el Ilustre Colegio de Abogados de
              Málaga, por dicha razón, el pasado 21 de octubre de 2025. Acreedor
              de una mención de su Colegio Profesional por haber participado,
              siendo miembro de este, y a la vez concejal del Ayuntamiento de
              Ardales en defensa de los intereses democráticos imperantes en
              nuestro sistema político, social y judicial.
            </p>

            <p className="text-gray-700">
              Cuenta con numerosos cursos de especialización en diferentes
              materias propias de su profesión como Derecho Notarial u Oratoria.
            </p>
          </div>
        </div>

        {/* Values Grid */}
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl font-bold text-primary text-center mb-12">
            Nuestros Valores
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {values.map((value, index) => {
              const IconComponent = value.icon;
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
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export default About;
