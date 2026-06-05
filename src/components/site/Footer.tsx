import { Link } from "@tanstack/react-router";
import { Instagram, Facebook, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-espresso text-ivory/80 mt-24">
      <div className="max-w-7xl mx-auto px-4 py-16 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div className="md:col-span-2">
          <h3 className="font-display text-2xl text-ivory mb-3">Harshita Collection</h3>
          <p className="text-sm leading-relaxed max-w-md opacity-80">
            Crafting timeless elegance for the modern Indian woman. Each piece is hand-selected for those
            who find beauty in the subtle and strength in tradition.
          </p>
          <div className="flex gap-4 mt-6">
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="hover:text-gold">
              <Instagram className="size-5" />
            </a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="hover:text-gold">
              <Facebook className="size-5" />
            </a>
            <a href="mailto:contact@harshitacollection.com" aria-label="Email" className="hover:text-gold">
              <Mail className="size-5" />
            </a>
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
            <li><a href="#" className="hover:text-gold">Shipping Policy</a></li>
            <li><a href="#" className="hover:text-gold">Returns & Exchanges</a></li>
            <li><a href="#" className="hover:text-gold">Size Guide</a></li>
            <li><a href="#" className="hover:text-gold">Privacy Policy</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-ivory/10">
        <div className="max-w-7xl mx-auto px-4 py-6 text-[10px] uppercase tracking-[0.2em] opacity-50 text-center">
          © {new Date().getFullYear()} Harshita Collection · All Rights Reserved
        </div>
      </div>
    </footer>
  );
}
