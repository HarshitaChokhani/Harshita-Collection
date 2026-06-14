import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Phone, Mail, MapPin, MessageCircle, Clock, ShieldCheck } from "lucide-react";
import { CONTACT, telLink, waLink, mailLink } from "@/lib/contact";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us — Harshita Collection" },
      { name: "description", content: `Reach Harshita Collection — owned by ${CONTACT.owner} in ${CONTACT.location}. Call, WhatsApp, email, or send a message.` },
      { property: "og:title", content: "Contact Us — Harshita Collection" },
      { property: "og:description", content: `Get in touch with ${CONTACT.brand}. Hand-crafted Indian boutique wear.` },
      { property: "og:url", content: "https://harshita-collection.lovable.app/contact" },
    ],
    links: [{ rel: "canonical", href: "https://harshita-collection.lovable.app/contact" }],
  }),
  component: ContactPage,
});

const formSchema = z.object({
  name: z.string().trim().min(2, "Tell us your name").max(80),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  message: z.string().trim().min(10, "Add a few details").max(1000),
});

function ContactPage() {
  const [data, setData] = useState({ name: "", email: "", phone: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const parsed = formSchema.parse(data);
      // Hand-off to WhatsApp — no inbox required.
      const msg =
        `Hello ${CONTACT.brand},\n\n` +
        `Name: ${parsed.name}\n` +
        `Email: ${parsed.email}\n` +
        (parsed.phone ? `Phone: ${parsed.phone}\n` : "") +
        `\n${parsed.message}`;
      window.open(waLink(msg), "_blank", "noopener,noreferrer");
      toast.success("Opening WhatsApp to send your message…");
      setData({ name: "", email: "", phone: "", message: "" });
    } catch (err) {
      const m = err instanceof z.ZodError ? err.issues[0]?.message : "Please check your details";
      toast.error(m ?? "Please check your details");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="bg-beige/20">
      <section className="max-w-6xl mx-auto px-4 py-16 text-center">
        <p className="text-[11px] uppercase tracking-[0.3em] text-gold">Get in Touch</p>
        <h1 className="font-display text-4xl sm:text-5xl mt-3">We'd love to hear from you</h1>
        <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
          Have a question about a piece, sizing, or a custom order? Reach out — we typically reply within a few hours.
        </p>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-16 grid lg:grid-cols-[1fr_1.1fr] gap-10">
        {/* Quick actions + details */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <a href={telLink()} className="bg-espresso text-ivory p-5 flex flex-col items-center gap-2 hover:bg-espresso/90 transition">
              <Phone className="size-5 text-gold" />
              <span className="text-[10px] uppercase tracking-[0.25em]">Call</span>
              <span className="text-xs opacity-80">{CONTACT.phone}</span>
            </a>
            <a href={waLink(`Hello ${CONTACT.brand}, I have a question.`)} target="_blank" rel="noopener noreferrer"
              className="bg-[#25D366] text-white p-5 flex flex-col items-center gap-2 hover:opacity-90 transition">
              <MessageCircle className="size-5" />
              <span className="text-[10px] uppercase tracking-[0.25em]">WhatsApp</span>
              <span className="text-xs opacity-90">Chat now</span>
            </a>
            <a href={mailLink("Hello Harshita Collection")} className="bg-ivory border border-border p-5 flex flex-col items-center gap-2 hover:border-gold transition">
              <Mail className="size-5 text-gold" />
              <span className="text-[10px] uppercase tracking-[0.25em]">Email</span>
              <span className="text-xs text-muted-foreground truncate max-w-full">{CONTACT.email}</span>
            </a>
          </div>

          <div className="bg-ivory border border-border p-6 space-y-4">
            <h2 className="font-display text-2xl">Boutique details</h2>
            <div className="text-sm space-y-3">
              <p className="flex items-start gap-3"><ShieldCheck className="size-4 text-gold shrink-0 mt-0.5" />
                <span><span className="block text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Owner</span>{CONTACT.owner}</span>
              </p>
              <p className="flex items-start gap-3"><MapPin className="size-4 text-gold shrink-0 mt-0.5" />
                <span><span className="block text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Location</span>{CONTACT.addressLine}</span>
              </p>
              <p className="flex items-start gap-3"><Clock className="size-4 text-gold shrink-0 mt-0.5" />
                <span><span className="block text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Business Hours</span>{CONTACT.hours}</span>
              </p>
            </div>
          </div>

          <div className="bg-ivory border border-border overflow-hidden">
            <iframe
              title="Harshita Collection — Deoghar"
              src={CONTACT.mapsEmbed}
              className="w-full h-72 border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <div className="px-4 py-3 text-[10px] uppercase tracking-[0.25em] text-muted-foreground flex items-center justify-between">
              <span>{CONTACT.location}</span>
              <a href={CONTACT.mapsLink} target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">Open in Maps</a>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="bg-ivory border border-border p-6 sm:p-8 space-y-5 h-fit">
          <h2 className="font-display text-2xl">Send us a message</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Full name *" value={data.name} onChange={(v) => setData({ ...data, name: v })} required />
            <Field label="Email *" type="email" value={data.email} onChange={(v) => setData({ ...data, email: v })} required />
          </div>
          <Field label="Phone (optional)" type="tel" value={data.phone} onChange={(v) => setData({ ...data, phone: v })} />
          <div>
            <label className="block text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">Message *</label>
            <textarea
              rows={5} required maxLength={1000}
              value={data.message} onChange={(e) => setData({ ...data, message: e.target.value })}
              className="w-full bg-transparent border border-border px-4 py-3 text-sm focus:outline-none focus:border-gold resize-y"
            />
          </div>
          <button type="submit" disabled={submitting}
            className="w-full bg-espresso text-ivory py-3 text-xs uppercase tracking-[0.25em] hover:bg-espresso/90 disabled:opacity-50">
            {submitting ? "Sending…" : "Send via WhatsApp"}
          </button>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground text-center">
            Your message opens in WhatsApp — no signup needed.
          </p>
        </form>
      </section>

      {/* Policies (anchor targets for footer links) */}
      <section className="bg-ivory border-t border-border">
        <div className="max-w-4xl mx-auto px-4 py-16 space-y-12 text-sm leading-relaxed">
          <div id="shipping">
            <h2 className="font-display text-2xl mb-3">Shipping Policy</h2>
            <p className="text-muted-foreground">Complimentary shipping across India on all orders. Orders are dispatched within 2–3 business days and typically arrive in 4–7 business days depending on your location. You'll receive tracking once your order ships.</p>
          </div>
          <div id="returns">
            <h2 className="font-display text-2xl mb-3">Returns &amp; Exchanges</h2>
            <p className="text-muted-foreground">Easy 7-day returns from the date of delivery. Items must be unworn, unwashed, and in original condition with tags intact. Custom-stitched or made-to-measure pieces are non-returnable.</p>
          </div>
          <div id="size-guide">
            <h2 className="font-display text-2xl mb-3">Size Guide</h2>
            <p className="text-muted-foreground">A detailed size chart is available on every product page. Not sure which size to pick? Tap "Need Help Choosing Size?" on any product and message us your measurements — we'll recommend the best fit.</p>
          </div>
        </div>
      </section>
    </main>
  );
}

function Field({ label, value, onChange, type = "text", required }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean }) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">{label}</label>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} maxLength={255}
        className="w-full bg-transparent border border-border px-4 py-3 text-sm focus:outline-none focus:border-gold"
      />
    </div>
  );
}
