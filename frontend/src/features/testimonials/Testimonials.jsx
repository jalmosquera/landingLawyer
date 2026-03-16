import { useState } from "react";

function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const testimonials = [
    {
      name: "Antonio Ruiz",
      rating: 5,
      text: "Excelente profesional. Me asesoró en un asunto civil bastante complejo y desde el primer momento me transmitió seguridad y claridad. El resultado fue muy favorable y siempre estuvo disponible para resolver cualquier duda.",
      location: "Málaga, España",
    },
    {
      name: "María Fernández",
      rating: 5,
      text: "Gran trato y mucha profesionalidad. Eduardo Bernal llevó mi caso con total dedicación y me explicó cada paso del proceso legal de forma clara. Sin duda lo recomiendo.",
      location: "Ronda, España",
    },
    {
      name: "José Manuel García",
      rating: 5,
      text: "Un abogado muy serio y comprometido con su trabajo. Me ayudó con un procedimiento administrativo complicado y supo encontrar la mejor estrategia para resolverlo.",
      location: "Antequera, España",
    },
    {
      name: "Laura Sánchez",
      rating: 5,
      text: "Muy buena experiencia. Recibí un asesoramiento muy claro desde la primera consulta y siempre sentí que mi caso estaba en buenas manos. Totalmente recomendable.",
      location: "Coín, España",
    },
  ];

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length,
    );
  };

  const currentTestimonial = testimonials[currentIndex];

  return (
    <section
      id="testimonials"
      className="relative py-20 bg-gray-50"
      style={{ marginTop: "-1px" }}
    >
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-primary mb-6">
            Testimonios de Clientes
          </h2>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            Conoce la experiencia de algunos de nuestros clientes y la confianza
            que han depositado en nuestro despacho.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-xl p-8 md:p-12 relative">
            <div className="text-accent text-6xl mb-4">"</div>

            <div className="mb-8">
              <p className="text-xl text-gray-700 italic mb-6">
                {currentTestimonial.text}
              </p>

              <div className="flex justify-center mb-4">
                {[...Array(currentTestimonial.rating)].map((_, i) => (
                  <span key={i} className="text-accent text-2xl">
                    ★
                  </span>
                ))}
              </div>

              <div className="text-center">
                <p className="font-bold text-primary text-lg">
                  {currentTestimonial.name}
                </p>
                <p className="text-gray-600">{currentTestimonial.location}</p>
              </div>
            </div>

            <div className="flex justify-center items-center gap-4">
              <button
                onClick={prevTestimonial}
                className="bg-primary hover:bg-primary-light text-white rounded-full p-3 transition-colors duration-300"
                aria-label="Testimonio anterior"
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

              <div className="flex gap-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                      index === currentIndex ? "bg-accent" : "bg-gray-300"
                    }`}
                    aria-label={`Ir al testimonio ${index + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={nextTestimonial}
                className="bg-primary hover:bg-primary-light text-white rounded-full p-3 transition-colors duration-300"
                aria-label="Siguiente testimonio"
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
  );
}

export default Testimonials;
