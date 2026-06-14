import { createFileRoute, Link } from "@tanstack/react-router";
import { CONTACT } from "@/lib/contact";

export const Route = createFileRoute("/_authenticated/admin/contact-info")({
  head: () => ({ meta: [{ title: "Contact Information — Admin" }] }),
  component: () => (
    <>
      <h1 className="font-display text-4xl mb-8">Contact Information</h1>
      <div className="bg-ivory border border-border p-6 max-w-2xl text-sm space-y-3">
        <p className="text-muted-foreground">These details appear on the public Contact page, footer, product pages, and WhatsApp buttons.</p>
        <ul className="space-y-2 pt-2 border-t border-border">
          <li><strong>Brand:</strong> {CONTACT.brand}</li>
          <li><strong>Owner:</strong> {CONTACT.owner}</li>
          <li><strong>Location:</strong> {CONTACT.addressLine}</li>
          <li><strong>Phone:</strong> {CONTACT.phone}</li>
          <li><strong>WhatsApp:</strong> +{CONTACT.whatsapp}</li>
          <li><strong>Email:</strong> {CONTACT.email}</li>
          <li><strong>Business hours:</strong> {CONTACT.hours}</li>
        </ul>
        <p className="text-xs text-muted-foreground pt-3">To edit, update <code className="bg-beige/40 px-1.5 py-0.5">src/lib/contact.ts</code>.</p>
        <Link to="/contact" className="inline-block mt-2 text-xs uppercase tracking-[0.2em] text-espresso hover:text-gold">View public contact page →</Link>
      </div>
    </>
  ),
});
