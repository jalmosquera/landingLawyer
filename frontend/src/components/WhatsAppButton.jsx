import { FaWhatsapp } from "react-icons/fa";

const WHATSAPP_URL = "https://wa.me/34607433925";

function WhatsAppButton() {
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noreferrer"
      aria-label="Contactar por WhatsApp al +34 607 43 39 25"
      className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-green-600 px-4 py-3 font-semibold text-white shadow-lg transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-700 focus:ring-offset-2"
    >
      <FaWhatsapp aria-hidden="true" className="h-6 w-6" />
      <span className="hidden sm:inline">WhatsApp</span>
    </a>
  );
}

export default WhatsAppButton;
