function LegalNotice() {
  return (
    <main className="min-h-screen bg-gray-50 text-gray-800">
      <header className="bg-primary text-white">
        <div className="container mx-auto flex items-center justify-between px-4 py-5">
          <a href="/" className="text-xl font-bold hover:text-accent">
            Eduardo Bernal Abogado
          </a>
          <a
            href="/"
            className="rounded-lg border border-white px-4 py-2 text-sm font-semibold transition-colors hover:bg-white hover:text-primary"
          >
            Volver al inicio
          </a>
        </div>
      </header>

      <article className="container mx-auto max-w-4xl px-4 py-12 md:py-16">
        <h1 className="mb-8 text-4xl font-bold text-primary md:text-5xl">
          Aviso legal
        </h1>

        <div className="space-y-8 rounded-xl bg-white p-6 shadow-sm md:p-10">
          <section aria-labelledby="titularidad">
            <h2 id="titularidad" className="mb-3 text-2xl font-bold text-primary">
              Titularidad del sitio web
            </h2>
            <p>
              Este sitio web es titularidad de Eduardo Bernal, abogado ejerciente,
              con domicilio profesional en Ardales, Málaga.
            </p>
            <ul className="mt-3 list-inside list-disc space-y-1">
              <li>Teléfono: +34 607 43 39 25</li>
              <li>Correo electrónico: eduardobernalabogado@gmail.com</li>
              <li>
                Colegiado nº 4941 del Ilustre Colegio de Abogados de Málaga.
              </li>
            </ul>
          </section>

          <section aria-labelledby="actividad-profesional">
            <h2
              id="actividad-profesional"
              className="mb-3 text-2xl font-bold text-primary"
            >
              Actividad profesional
            </h2>
            <p>
              Eduardo Bernal ejerce la profesión de abogado. La actividad
              profesional se rige por la normativa aplicable a la abogacía en
              España y por las normas deontológicas correspondientes.
            </p>
          </section>

          <section aria-labelledby="objeto">
            <h2 id="objeto" className="mb-3 text-2xl font-bold text-primary">
              Objeto del sitio web
            </h2>
            <p>
              El sitio ofrece información sobre la actividad profesional y permite
              solicitar una cita. La información publicada tiene carácter general
              e informativo y no constituye asesoramiento jurídico para un caso
              concreto ni crea una relación profesional abogado-cliente.
            </p>
          </section>

          <section aria-labelledby="uso">
            <h2 id="uso" className="mb-3 text-2xl font-bold text-primary">
              Condiciones de uso
            </h2>
            <p>
              La persona usuaria se compromete a utilizar este sitio web de forma
              lícita, diligente y respetuosa con la normativa aplicable. Queda
              prohibido cualquier uso que pueda dañar, inutilizar o sobrecargar el
              sitio, sus sistemas o los derechos de terceros.
            </p>
          </section>

          <section aria-labelledby="propiedad-intelectual">
            <h2
              id="propiedad-intelectual"
              className="mb-3 text-2xl font-bold text-primary"
            >
              Propiedad intelectual
            </h2>
            <p>
              Los contenidos de este sitio web, incluidos textos, imágenes,
              logotipos, diseño y código, están protegidos por la normativa de
              propiedad intelectual e industrial. No podrán reproducirse,
              distribuirse o transformarse sin autorización previa, salvo en los
              casos permitidos por la ley.
            </p>
          </section>

          <section aria-labelledby="enlaces">
            <h2 id="enlaces" className="mb-3 text-2xl font-bold text-primary">
              Enlaces externos
            </h2>
            <p>
              Este sitio puede incluir enlaces a recursos de terceros. Eduardo
              Bernal no asume responsabilidad por sus contenidos, disponibilidad o
              políticas, que corresponden a sus respectivos titulares.
            </p>
          </section>

          <section aria-labelledby="responsabilidad">
            <h2
              id="responsabilidad"
              className="mb-3 text-2xl font-bold text-primary"
            >
              Limitación de responsabilidad
            </h2>
            <p>
              Se procura que la información del sitio sea exacta y esté actualizada,
              aunque no se garantiza la ausencia total de errores u omisiones. El
              contenido podrá actualizarse o modificarse cuando resulte necesario.
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}

export default LegalNotice;
