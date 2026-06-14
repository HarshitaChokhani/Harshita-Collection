// Central contact info for Harshita Collection. Update these in one place.
export const CONTACT = {
  brand: "Harshita Collection",
  owner: "Ruchi Chokhani",
  location: "Deoghar, Jharkhand, India",
  addressLine: "Deoghar, Jharkhand 814112, India",
  phone: "+91 93340 73761",
  phoneE164: "+919334073761",
  whatsapp: "919334073761",
  email: "hello@harshitacollection.com",
  hours: "Monday – Saturday · 10:00 AM – 8:00 PM IST",
  instagram: "https://instagram.com/harshitacollection",
  facebook: "https://facebook.com/harshitacollection",
  mapsEmbed:
    "https://www.google.com/maps?q=Deoghar%2C%20Jharkhand%2C%20India&output=embed",
  mapsLink: "https://www.google.com/maps/place/Deoghar,+Jharkhand",
};

export function waLink(message: string) {
  return `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(message)}`;
}

export function telLink() {
  return `tel:${CONTACT.phoneE164.replace(/\s+/g, "")}`;
}

export function mailLink(subject?: string, body?: string) {
  const params = new URLSearchParams();
  if (subject) params.set("subject", subject);
  if (body) params.set("body", body);
  const qs = params.toString();
  return `mailto:${CONTACT.email}${qs ? `?${qs}` : ""}`;
}
