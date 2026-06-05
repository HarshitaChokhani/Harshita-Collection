import { MessageCircle } from "lucide-react";

export function WhatsAppFab() {
  return (
    <a
      href="https://wa.me/919999999999?text=Hello%20Harshita%20Collection"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-5 right-5 z-40 bg-[#25D366] text-white size-13 rounded-full shadow-lg grid place-items-center hover:scale-105 active:scale-95 transition-transform"
      style={{ width: 52, height: 52 }}
    >
      <MessageCircle className="size-6" />
    </a>
  );
}
