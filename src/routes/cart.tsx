import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/lib/store/cart";
import { resolveImage } from "@/lib/asset-map";
import { formatINR } from "@/lib/format";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Your Cart — Harshita Collection" }] }),
  component: CartPage,
});

function CartPage() {
  const items = useCart((s) => s.items);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);

  if (items.length === 0) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-24 text-center">
        <h1 className="font-display text-4xl mb-4">Your cart is empty</h1>
        <p className="text-muted-foreground mb-8">Begin your journey through our latest collection.</p>
        <Link to="/" className="inline-block bg-espresso text-ivory px-8 py-3 text-xs uppercase tracking-[0.25em]">Continue Shopping</Link>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="font-display text-3xl sm:text-4xl mb-10 text-center">Your Cart</h1>
      <div className="grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 divide-y divide-border">
          {items.map((i) => (
            <div key={`${i.productId}-${i.size ?? ""}`} className="flex gap-4 py-5">
              <Link to="/product/$slug" params={{ slug: i.slug }} className="shrink-0">
                <img src={resolveImage(i.image)} alt={i.name} className="w-24 h-32 object-cover bg-beige" />
              </Link>
              <div className="flex-1 min-w-0">
                <Link to="/product/$slug" params={{ slug: i.slug }} className="text-sm font-medium hover:text-gold">{i.name}</Link>
                {i.size && <p className="text-xs text-muted-foreground mt-1">Size: {i.size}</p>}
                <p className="text-sm font-medium mt-2">{formatINR(i.price)}</p>
                <div className="flex items-center justify-between mt-3">
                  <div className="inline-flex items-center border border-border">
                    <button onClick={() => setQty(i.productId, Math.max(1, i.qty - 1), i.size)} className="size-8 grid place-items-center hover:bg-beige"><Minus className="size-3" /></button>
                    <span className="w-10 text-center text-sm">{i.qty}</span>
                    <button onClick={() => setQty(i.productId, i.qty + 1, i.size)} className="size-8 grid place-items-center hover:bg-beige"><Plus className="size-3" /></button>
                  </div>
                  <button onClick={() => remove(i.productId, i.size)} className="text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <aside className="bg-beige/50 p-6 h-fit space-y-4">
          <h2 className="font-display text-xl mb-2">Order Summary</h2>
          <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatINR(subtotal)}</span></div>
          <div className="flex justify-between text-sm"><span>Shipping</span><span className="text-gold">Free</span></div>
          <div className="border-t border-border pt-4 flex justify-between font-medium"><span>Total</span><span>{formatINR(subtotal)}</span></div>
          <p className="text-[11px] text-muted-foreground">✦ Complimentary shipping across India on all orders</p>
          <button disabled className="w-full bg-espresso text-ivory py-4 text-xs uppercase tracking-[0.25em] opacity-60 cursor-not-allowed">Checkout (coming soon)</button>
          <p className="text-[10px] text-center text-muted-foreground">Sign-in & payments arrive in the next phase.</p>
        </aside>
      </div>
    </main>
  );
}
