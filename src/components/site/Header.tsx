import { Link } from "@tanstack/react-router";
import { Search, ShoppingBag, Heart, User, Menu, X } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/store/cart";
import { useWishlist } from "@/lib/store/wishlist";

const NAV = [
  { to: "/category/$slug", params: { slug: "new-arrivals" }, label: "New Arrivals" },
  { to: "/category/$slug", params: { slug: "suits" }, label: "Suits" },
  { to: "/category/$slug", params: { slug: "kurtis" }, label: "Kurtis" },
  { to: "/category/$slug", params: { slug: "kurti-pant-sets" }, label: "Kurti Pant Sets" },
  { to: "/category/$slug", params: { slug: "sarees" }, label: "Sarees" },
  { to: "/category/$slug", params: { slug: "dupattas" }, label: "Dupattas" },
  { to: "/category/$slug", params: { slug: "trousers" }, label: "Trousers" },
  { to: "/category/$slug", params: { slug: "festive-collection" }, label: "Festive" },
  { to: "/category/$slug", params: { slug: "best-sellers" }, label: "Best Sellers" },
  { to: "/contact", params: {}, label: "Contact" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const cartCount = useCart((s) => s.items.reduce((n, i) => n + i.qty, 0));
  const wlCount = useWishlist((s) => s.ids.length);

  return (
    <>
      <div className="bg-espresso text-ivory text-[10px] sm:text-xs tracking-[0.2em] uppercase text-center py-2 px-4 font-medium">
        Complimentary shipping across India · Elegance in Every Thread
      </div>
      <header className="sticky top-0 z-40 bg-ivory/95 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <button onClick={() => setOpen(true)} className="lg:hidden p-1 -ml-1" aria-label="Menu">
            <Menu className="size-5" />
          </button>
          <Link to="/" className="flex flex-col items-center lg:items-start leading-none">
            <span className="font-display text-2xl sm:text-3xl">Harshita Collection</span>
            <span className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground mt-0.5 hidden sm:block">
              Elegance in Every Thread
            </span>
          </Link>
          <div className="flex items-center gap-3 sm:gap-5">
            <button onClick={() => setSearchOpen((v) => !v)} className="p-1" aria-label="Search">
              <Search className="size-5" />
            </button>
            <Link to="/account" className="hidden sm:inline-flex p-1" aria-label="Account">
              <User className="size-5" />
            </Link>
            <Link to="/wishlist" className="relative p-1" aria-label="Wishlist">
              <Heart className="size-5" />
              {wlCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 size-4 rounded-full bg-gold text-ivory text-[9px] grid place-items-center font-medium">
                  {wlCount}
                </span>
              )}
            </Link>
            <Link to="/cart" className="relative p-1" aria-label="Cart">
              <ShoppingBag className="size-5" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 size-4 rounded-full bg-gold text-ivory text-[9px] grid place-items-center font-medium">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {searchOpen && (
          <form
            action="/search"
            className="border-t border-border bg-beige/40 px-4 py-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (q.trim()) {
                window.location.href = `/search?q=${encodeURIComponent(q.trim())}`;
              }
            }}
          >
            <input
              autoFocus
              type="search"
              name="q"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search sarees, kurtis, suits…"
              className="w-full max-w-2xl mx-auto block bg-ivory border border-border rounded-full px-5 py-2.5 text-sm focus:outline-none focus:border-gold"
            />
          </form>
        )}

        <nav className="hidden lg:flex gap-7 px-4 py-2.5 border-t border-border/60 justify-center bg-beige/20">
          {NAV.map((item) => (
            <Link
              key={item.params.slug}
              to={item.to}
              params={item.params}
              className="text-[11px] uppercase tracking-[0.18em] hover:text-gold transition-colors"
              activeProps={{ className: "text-gold" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-espresso/40" onClick={() => setOpen(false)} />
          <aside className="absolute top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-ivory p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <span className="font-display text-2xl">Harshita</span>
              <button onClick={() => setOpen(false)} aria-label="Close"><X className="size-5" /></button>
            </div>
            <ul className="space-y-1">
              {NAV.map((item) => (
                <li key={item.params.slug}>
                  <Link
                    to={item.to}
                    params={item.params}
                    onClick={() => setOpen(false)}
                    className="block py-3 border-b border-border text-sm uppercase tracking-[0.15em]"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li className="pt-6">
                <Link to="/account" onClick={() => setOpen(false)} className="block py-2 text-sm uppercase tracking-[0.15em]">Account</Link>
                <Link to="/wishlist" onClick={() => setOpen(false)} className="block py-2 text-sm uppercase tracking-[0.15em]">Wishlist</Link>
              </li>
            </ul>
          </aside>
        </div>
      )}
    </>
  );
}
