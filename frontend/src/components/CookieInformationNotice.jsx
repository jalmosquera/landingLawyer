import { useState } from "react";

function CookieInformationNotice() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) {
    return null;
  }

  return (
    <section
      aria-label="Información sobre cookies"
      className="fixed bottom-4 left-4 right-4 z-40 mx-auto max-w-2xl rounded-xl bg-primary p-4 text-white shadow-xl md:bottom-6"
    >
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-relaxed">
          Usamos únicamente almacenamiento técnico necesario para el acceso al
          área privada. No utilizamos cookies analíticas ni publicitarias.
          <a href="/politica-de-cookies" className="ml-1 font-semibold underline">
            Más información
          </a>
        </p>
        <button
          type="button"
          onClick={() => setIsVisible(false)}
          className="shrink-0 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-dark focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary"
        >
          Entendido
        </button>
      </div>
    </section>
  );
}

export default CookieInformationNotice;
