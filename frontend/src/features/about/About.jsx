import { useState, useEffect, useCallback } from "react";
import {
  FaBalanceScale,
  FaGem,
  FaBullseye,
  FaUsers,
  FaComments,
  FaStar,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";

const CAROUSEL_IMAGES = [
  {
    src: "/eduardoEvolutionPark.png",
    alt: "Eduardo Bernal - Evolution Park",
    position: "center center",
    fit: "contain",
  },
  {
    src: "/Consejero.jpg",
    alt: "Eduardo Bernal - Consejero",
    position: "center center",
  },
  { src: "/img2.jpg", alt: "Despacho", position: "center center" },
  { src: "/img3.jpg", alt: "Despacho", position: "center center" },
  { src: "/img4.jpeg", alt: "Despacho", position: "center center" },
  { src: "/eLanding.jpg", alt: "Eduardo Bernal", position: "center center" },
];

function AboutCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const next = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % CAROUSEL_IMAGES.length);
  }, []);

  const prev = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + CAROUSEL_IMAGES.length) % CAROUSEL_IMAGES.length,
    );
  };

  useEffect(() => {
    const interval = setInterval(next, 4000);
    return () => clearInterval(interval);
  }, [next]);

  return (
    <div className="relative w-full rounded-lg shadow-md overflow-hidden">
      {/* Images */}
      <div className="relative aspect-[4/3]">
        {CAROUSEL_IMAGES.map((image, index) => (
          <img
            key={image.src}
            src={image.src}
            alt={image.alt}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
              index === currentIndex ? "opacity-100" : "opacity-0"
            }`}
            style={{ objectPosition: image.position }}
          />
        ))}
      </div>

      {/* Prev / Next buttons */}
      <button
        onClick={prev}
        className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 transition-colors duration-200"
        aria-label="Anterior"
      >
        <FaChevronLeft className="w-4 h-4" />
      </button>
      <button
        onClick={next}
        className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 transition-colors duration-200"
        aria-label="Siguiente"
      >
        <FaChevronRight className="w-4 h-4" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
        {CAROUSEL_IMAGES.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2.5 h-2.5 rounded-full transition-colors duration-200 ${
              index === currentIndex ? "bg-white" : "bg-white/40"
            }`}
            aria-label={`Ir a imagen ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

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
          {/* Carrusel */}
          <div className="mb-8">
            <AboutCarousel />
          </div>

          {/* Texto */}
          <div>
            <h3 className="text-3xl font-bold text-primary mb-4">
              Eduardo Bernal Fernández
            </h3>

            <p className="text-sm text-gray-600 mb-6">
              Colegiado Nº 4941 – Ilustre Colegio de Abogados de Málaga (ICAMA)
            </p>

            <p className="text-gray-700 text-justify mb-4">
              Con más de 25 años de experiencia en el ejercicio de la abogacía,
              me dedico a desarrollar mi actividad profesional asesorando y
              representando a particulares, empresas e instituciones en materias
              de Derecho Civil, Penal y Contencioso-Administrativo, tanto en el
              ámbito judicial como en el extrajudicial.
            </p>

            <p className="text-gray-700 text-justify mb-4">
              A lo largo de mi trayectoria e participado en numerosos
              procedimientos ante distintos órganos jurisdiccionales, así como
              en el asesoramiento jurídico de operaciones empresariales y
              proyectos de desarrollo de especial complejidad, aportando
              seguridad jurídica, análisis estratégico y soluciones legales
              adaptadas a cada situación.
            </p>

            <p className="text-gray-700 text-justify mb-4">
              Entre los proyectos de mayor relevancia en los que e intervenido
              destaco por mi participación en el asesoramiento jurídico del
              proyecto Natura Park Carratraca, una iniciativa de carácter
              turístico, educativo y medioambiental concebida para el desarrollo
              de un complejo de divulgación científica y conservación de la
              naturaleza en la provincia de Málaga.
            </p>

            <p className="text-gray-700 text-justify mb-4">
              En el marco de este proyecto, mi labor se ha centrado en el
              análisis legal, la estructuración jurídica y la viabilidad
              administrativa, abordando aspectos relacionados con la normativa
              urbanística, administrativa y empresarial.
            </p>

            <p className="text-gray-700 text-justify mb-4">
              Mi ejercicio profesional se caracteriza por un enfoque riguroso,
              estratégico y orientado a la defensa eficaz de los intereses de
              mis clientes, combinando la experiencia procesal ante los
              tribunales con el asesoramiento preventivo en proyectos
              empresariales e institucionales.
            </p>

            <p className="text-gray-700 text-justify mb-4">
              Además de mi actividad profesional, e participado activamente en
              la vida pública local, habiendo desempeñado responsabilidades en
              el Ayuntamiento de Ardales, siempre en defensa del interés general
              y del desarrollo social y económico de su entorno.
            </p>

            <p className="text-gray-700 text-justify">
              Cuento asimismo con formación complementaria en materias como
              Derecho Notarial y Oratoria Jurídica, que refuerzan mi capacidad
              de análisis, argumentación y representación en el ejercicio de la
              profesión.
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
