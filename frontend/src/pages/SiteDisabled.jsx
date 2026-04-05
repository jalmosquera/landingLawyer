/**
 * SiteDisabled Page — MosqueraSoft branded
 *
 * Shown when the site is disabled (payment deadline exceeded or manual override).
 * Uses MosqueraSoft brand colors: black background, orange (#f97316) accents.
 */

const DEFAULT_TITLE = "Tu sitio web está temporalmente inactivo";
const DEFAULT_MESSAGE =
  "Hemos detectado un pago pendiente asociado a este servicio. " +
  "Para reactivar tu sitio, por favor regulariza tu cuenta con nuestro equipo. " +
  "Una vez confirmado el pago, tu sitio estará disponible nuevamente en minutos.";

function SiteDisabled({
  title = DEFAULT_TITLE,
  message = DEFAULT_MESSAGE,
  contactEmail = "",
}) {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(249,115,22,0.15) 0%, transparent 60%)," +
          "radial-gradient(ellipse 60% 40% at 50% 110%, rgba(249,115,22,0.08) 0%, transparent 60%)," +
          "#080808",
      }}
    >
      {/* Grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0.025,
          backgroundImage:
            "linear-gradient(rgba(249,115,22,1) 1px, transparent 1px)," +
            "linear-gradient(90deg, rgba(249,115,22,1) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />
      {/* Corner glows */}
      <div
        className="absolute top-0 left-0 w-52 h-52 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 0 0, rgba(249,115,22,0.12) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute bottom-0 right-0 w-52 h-52 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 100% 100%, rgba(249,115,22,0.10) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 w-full max-w-lg text-center">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img
            src="ms-icon-removebg-preview.png"
            alt="MosqueraSoft"
            className="w-[120px] h-[120px] sm:w-44 sm:h-44 md:w-52 md:h-52 object-contain rounded-2xl"
            style={{
              filter:
                "drop-shadow(0 0 8px #f97316) drop-shadow(0 0 24px rgba(249,115,22,0.5))",
              animation: "neon-pulse 3s ease-in-out infinite",
            }}
          />
        </div>

        {/* Brand name */}
        <p
          className="text-xs font-bold tracking-widest uppercase mb-8"
          style={{ color: "rgba(249,115,22,0.7)", letterSpacing: "0.2em" }}
        >
          MosqueraSoft
        </p>

        {/* Card */}
        <div
          className="rounded-3xl px-9 py-10"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(249,115,22,0.25)",
            backdropFilter: "blur(20px)",
            boxShadow:
              "0 0 60px rgba(249,115,22,0.15), 0 0 120px rgba(249,115,22,0.06), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
            style={{
              background: "rgba(249,115,22,0.1)",
              border: "1px solid rgba(249,115,22,0.3)",
            }}
          >
            <span className="relative flex h-2 w-2">
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
                style={{ background: "#f97316" }}
              />
              <span
                className="relative inline-flex rounded-full h-2 w-2"
                style={{ background: "#f97316" }}
              />
            </span>
            <span
              className="text-xs font-bold tracking-widest uppercase"
              style={{ color: "#f97316", letterSpacing: "0.12em" }}
            >
              Servicio suspendido
            </span>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-black text-white leading-tight mb-1 text-center">
            Tu sitio web está
          </h1>
          <h1
            className="text-2xl font-black leading-tight mb-6 text-center"
            style={{
              background: "linear-gradient(135deg, #f97316, #fb923c)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            temporalmente inactivo
          </h1>

          {/* Divider */}
          <div
            className="mb-6"
            style={{
              height: "1px",
              background:
                "linear-gradient(90deg, transparent, rgba(249,115,22,0.5), transparent)",
            }}
          />

          {/* Message */}
          <p
            className="text-sm leading-relaxed mb-3 text-center"
            style={{ color: "#a1a1aa" }}
          >
            Hemos detectado un{" "}
            <strong className="text-zinc-200">pago pendiente</strong> asociado a
            este servicio. Para reactivar tu sitio, por favor regulariza tu
            cuenta con nuestro equipo.
          </p>
          <p
            className="text-sm leading-relaxed mb-8 text-center"
            style={{ color: "#71717a" }}
          >
            Una vez confirmado el pago, tu sitio estará disponible nuevamente en
            minutos. Gracias por tu comprensión. 🙏
          </p>

          {/* CTA */}
          {contactEmail && (
            <div className="flex justify-center mb-7">
              <a
                href={`mailto:${contactEmail}`}
                className="inline-flex items-center gap-2 font-bold text-white px-8 py-3.5 rounded-2xl transition-opacity hover:opacity-90"
                style={{
                  background: "linear-gradient(135deg, #f97316, #ea580c)",
                  boxShadow:
                    "0 4px 30px rgba(249,115,22,0.45), inset 0 1px 0 rgba(255,255,255,0.1)",
                  textDecoration: "none",
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                Regularizar mi cuenta
              </a>
            </div>
          )}

          {/* Admin note */}
          <div
            className="text-center px-4 py-3.5 rounded-2xl"
            style={{
              background: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <p className="text-xs leading-relaxed" style={{ color: "#52525b" }}>
              ¿Eres el administrador? —{" "}
              <a
                href="/admin"
                style={{ color: "#f97316", textDecoration: "underline" }}
              >
                Accede al panel
              </a>{" "}
              · Si ya pagaste, contáctanos para activación inmediata.
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-xs text-center" style={{ color: "#27272a" }}>
          © {new Date().getFullYear()} MosqueraSoft · Todos los derechos
          reservados
        </p>
      </div>

      {/* Neon pulse keyframe injected */}
      <style>{`
        @keyframes neon-pulse {
          0%, 100% { filter: drop-shadow(0 0 8px #f97316) drop-shadow(0 0 20px rgba(249,115,22,0.5)); }
          50%       { filter: drop-shadow(0 0 16px #f97316) drop-shadow(0 0 40px rgba(249,115,22,0.8)); }
        }
      `}</style>
    </div>
  );
}

export default SiteDisabled;
