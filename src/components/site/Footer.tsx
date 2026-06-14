import { Link } from "@tanstack/react-router";
import { Instagram, Facebook, Mail, Phone, MapPin, MessageCircle } from "lucide-react";
import { CONTACT, telLink, waLink, mailLink } from "@/lib/contact";

export function Footer() {
  return (
    <footer className="bg-espresso text-ivory/80 mt-24">
      <div className="max-w-7xl mx-auto px-4 py-16 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div className="md:col-span-2">
          <h3 className="font-display text-2xl text-ivory mb-3">{CONTACT.brand}</h3>
          <p className="text-sm leading-relaxed max-w-md opacity-80">
            Crafting timeless elegance for the modern Indian woman. Each piece is hand-selected for those
            who find beauty in the subtle and strength in tradition.
          </p>
          <div className="mt-6 space-y-2 text-sm">
            <p className="flex items-start gap-2"><MapPin className="size-4 shrink-0 mt-0.5 text-gold" /> <span>{CONTACT.addressLine}</span></p>
            <p className="flex items-center gap-2"><Phone className="size-4 shrink-0 text-gold" /> <a href={telLink()} className="hover:text-gold">{CONTACT.phone}</a></p>
            <p className="flex items-center gap-2"><Mail className="size-4 shrink-0 text-gold" /> <a href={mailLink()} className="hover:text-gold">{CONTACT.email}</a></p>
          </div>
          <div className="flex gap-3 mt-6">
            <a href={CONTACT.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="hover:text-gold"><Instagram className="size-5" /></a>
            <a href={CONTACT.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="hover:text-gold"><Facebook className="size-5" /></a>
            <a href={waLink(`Hello ${CONTACT.brand}`)} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="hover:text-gold"><MessageCircle className="size-5" /></a>
            <a href={mailLink()} aria-label="Email" className="hover:text-gold"><Mail className="size-5" /></a>
          </div>
        </div>
        <div>
          <h4 className="text-[10px] uppercase tracking-[0.2em] mb-5 text-ivory font-medium">Shop</h4>
          <ul className="space-y-3 text-sm">
            <li><Link to="/category/$slug" params={{ slug: "new-arrivals" }} className="hover:text-gold">New Arrivals</Link></li>
            <li><Link to="/category/$slug" params={{ slug: "best-sellers" }} className="hover:text-gold">Best Sellers</Link></li>
            <li><Link to="/category/$slug" params={{ slug: "festive-collection" }} className="hover:text-gold">Festive Edit</Link></li>
            <li><Link to="/category/$slug" params={{ slug: "sarees" }} className="hover:text-gold">Sarees</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-[10px] uppercase tracking-[0.2em] mb-5 text-ivory font-medium">Care</h4>
          <ul className="space-y-3 text-sm">
            <li><Link to="/contact" className="hover:text-gold">Contact Us</Link></li>
            <li><Link to="/contact" hash="shipping" className="hover:text-gold">Shipping Policy</Link></li>
            <li><Link to="/contact" hash="returns" className="hover:text-gold">Returns &amp; Exchanges</Link></li>
            <li><Link to="/contact" hash="size-guide" className="hover:text-gold">Size Guide</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-ivory/10">
        <div className="max-w-7xl mx-auto px-4 py-6 text-[10px] uppercase tracking-[0.2em] opacity-60 text-center space-y-1">
          <p>Sold by {CONTACT.brand} · Owner: {CONTACT.owner} · {CONTACT.location}</p>
          <p className="opacity-70">© {new Date().getFullYear()} {CONTACT.brand} · All Rights Reserved</p>
        </div>
      </div>
    </footer>
  );
}
