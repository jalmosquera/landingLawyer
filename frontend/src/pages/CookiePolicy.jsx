function CookiePolicy() {
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
          Política de cookies
        </h1>

        <div className="space-y-8 rounded-xl bg-white p-6 shadow-sm md:p-10">
          <section aria-labelledby="que-son">
            <h2 id="que-son" className="mb-3 text-2xl font-bold text-primary">
              Qué son las cookies
            </h2>
            <p>
              Las cookies son pequeños archivos que un sitio web puede almacenar
              en el dispositivo de la persona usuaria. También puede utilizarse
              almacenamiento local del navegador para que determinadas funciones
              técnicas operen correctamente.
            </p>
          </section>

          <section aria-labelledby="uso">
            <h2 id="uso" className="mb-3 text-2xl font-bold text-primary">
              Cookies y almacenamiento utilizados
            </h2>
            <p>
              Este sitio no utiliza cookies analíticas, publicitarias ni de
              perfilado. El área privada puede utilizar almacenamiento local del
              navegador para conservar la sesión de las personas usuarias
              autenticadas y proteger el acceso a sus gestiones.
            </p>
          </section>

          <section aria-labelledby="gestion">
            <h2 id="gestion" className="mb-3 text-2xl font-bold text-primary">
              Gestión del almacenamiento técnico
            </h2>
            <p>
              Puede borrar el almacenamiento del navegador desde sus opciones de
              privacidad. Al hacerlo, será necesario iniciar sesión de nuevo para
              acceder al área privada. Bloquear el almacenamiento técnico puede
              impedir el funcionamiento de esa área.
            </p>
          </section>

          <section aria-labelledby="actualizaciones">
            <h2
              id="actualizaciones"
              className="mb-3 text-2xl font-bold text-primary"
            >
              Actualizaciones
            </h2>
            <p>
              Esta política podrá actualizarse si se incorporan nuevas tecnologías
              o servicios. Si se añadieran cookies no técnicas, se solicitará el
              consentimiento antes de activarlas.
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}

export default CookiePolicy;
