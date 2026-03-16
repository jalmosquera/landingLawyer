import { useEffect, useState } from "react";
import WaveDivider from "../../components/WaveDivider";

function Hero() {
  const desktopImages = ["/landing.jpg", "/img2.jpg", "/img3.jpg"];
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % desktopImages.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [desktopImages.length]);

  return (
    <section
      id="home"
      className="relative h-screen flex items-center justify-center overflow-hidden"
    >
      {/* MOBILE HERO */}
      <div className="absolute inset-0 md:hidden">
        <img
          src="/mobile2.jpg"
          alt="Eduardo Bernal Abogado"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      {/* DESKTOP CAROUSEL */}
      <div className="absolute inset-0 hidden md:block">
        {desktopImages.map((image, index) => {
          const positions = [
            "78% 0%", // landing.jpg
            "50% 18%", // img2.jpg
            "50% 12%", // img3.jpg
          ];

          return (
            <img
              key={image}
              src={image}
              alt={`Hero background ${index + 1}`}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
                index === currentIndex ? "opacity-100" : "opacity-0"
              }`}
              style={{ objectPosition: positions[index] }}
            />
          );
        })}
      </div>

      {/* overlay */}
      <div className="absolute inset-0 bg-black/30"></div>

      {/* Hero Content */}
      <div className="relative z-10 container px-4 text-white">
        <div className="max-w-3xl pt-44 md:pt-0 text-left">
          <h1 className="hidden md:block text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
            Eduardo Bernal Fernández
          </h1>

          <p className="text-base md:text-2xl mb-3 md:mb-4 max-w-md md:max-w-2xl">
            Abogado Colegiado Nº 4941 ICAMA
          </p>

          <p className="text-sm md:text-xl mb-6 md:mb-8 max-w-md md:max-w-2xl leading-relaxed">
            Más de 25 años de experiencia en Derecho Penal, Civil y
            Contencioso-Administrativo
          </p>

          <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
            <a
              href="#contact"
              className="btn-accent text-base md:text-lg text-center"
            >
              Consulta Gratuita
            </a>

            <a
              href="#about"
              className="bg-white text-primary hover:bg-gray-100 font-semibold py-3 px-8 rounded-lg transition-colors duration-300 text-base md:text-lg text-center"
            >
              Conoce Más
            </a>
          </div>
        </div>
      </div>

      <WaveDivider position="bottom" />
    </section>
  );
}

export default Hero;
