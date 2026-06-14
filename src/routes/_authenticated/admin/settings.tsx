import { createFileRoute } from "@tanstack/react-router";
import { CONTACT } from "@/lib/contact";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  head: () => ({ meta: [{ title: "Settings — Admin" }] }),
  component: () => (
    <>
      <h1 className="font-display text-4xl mb-8">Settings</h1>
      <div className="bg-ivory border border-border p-6 space-y-4 text-sm max-w-2xl">
        <p className="text-muted-foreground">Store-wide settings. Contact details are edited in <code className="text-xs bg-beige/40 px-1.5 py-0.5">src/lib/contact.ts</code>.</p>
        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border">
          <Row label="Brand" value={CONTACT.brand} />
          <Row label="Owner" value={CONTACT.owner} />
          <Row label="Location" value={CONTACT.location} />
          <Row label="Phone" value={CONTACT.phone} />
          <Row label="WhatsApp" value={`+${CONTACT.whatsapp}`} />
          <Row label="Email" value={CONTACT.email} />
        </div>
      </div>
    </>
  ),
});

function Row({ label, value }: { label: string; value: string }) {
  return <div><p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{label}</p><p className="mt-1">{value}</p></div>;
}
