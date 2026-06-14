import { MessageCircle } from "lucide-react";
import { CONTACT, waLink } from "@/lib/contact";

export function WhatsAppFab() {
  return (
    <a
      href={waLink(`Hello ${CONTACT.brand}, I'd like more information.`)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-5 right-5 z-40 bg-[#25D366] text-white rounded-full shadow-lg grid place-items-center hover:scale-105 active:scale-95 transition-transform"
      style={{ width: 56, height: 56 }}
    >
      <MessageCircle className="size-6" />
    </a>
  );
}
