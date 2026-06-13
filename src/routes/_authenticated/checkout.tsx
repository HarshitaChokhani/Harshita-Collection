import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Tag, Loader2 } from "lucide-react";
import { useCart } from "@/lib/store/cart";
import { listAddresses } from "@/lib/account.functions";
import { validateCoupon, createOrder } from "@/lib/checkout.functions";
import { createRazorpayOrder, verifyRazorpayPayment } from "@/lib/payment.functions";
import { formatINR } from "@/lib/format";
import { resolveImage } from "@/lib/asset-map";

declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export const Route = createFileRoute("/_authenticated/checkout")({
  head: () => ({ meta: [{ title: "Checkout — Harshita Collection" }] }),
  component: CheckoutPage,
});

const blank = {
  full_name: "", phone: "", line1: "", line2: "",
  city: "", state: "", pincode: "", country: "India",
};

function CheckoutPage() {
  const navigate = useNavigate();
  const items = useCart((s) => s.items);
  const clear = useCart((s) => s.clear);
  const fetchAddresses = useServerFn(listAddresses);
  const checkCoupon = useServerFn(validateCoupon);
  const placeOrder = useServerFn(createOrder);

  const { data: addresses = [] } = useQuery({ queryKey: ["addresses"], queryFn: () => fetchAddresses() });

  const [selectedId, setSelectedId] = useState<string | "new">("new");
  const [form, setForm] = useState(blank);
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [couponMsg, setCouponMsg] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [placing, setPlacing] = useState(false);

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const shipping = 0;
  const total = Math.max(0, subtotal - discount + shipping);

  useEffect(() => {
    if (addresses.length > 0 && selectedId === "new") {
      const def = addresses.find((a) => a.is_default) ?? addresses[0];
      setSelectedId(def.id);
    }
  }, [addresses, selectedId]);

  useEffect(() => {
    if (items.length === 0) {
      navigate({ to: "/cart", replace: true });
    }
  }, [items.length, navigate]);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponMsg(null);
    try {
      const res = await checkCoupon({ data: { code: couponCode.trim(), subtotal } });
      if (res.valid) {
        setDiscount(res.discount);
        setAppliedCode(res.code);
        setCouponMsg(`Applied — saved ${formatINR(res.discount)}`);
        toast.success("Coupon applied");
      } else {
        setDiscount(0); setAppliedCode(null);
        setCouponMsg(res.reason);
      }
    } catch {
      setCouponMsg("Could not validate coupon");
    }
  };

  const onPlace = async () => {
    const addr = selectedId === "new" ? form : addresses.find((a) => a.id === selectedId);
    if (!addr) { toast.error("Choose a shipping address"); return; }
    setPlacing(true);
    try {
      const res = await placeOrder({
        data: {
          items: items.map((i) => ({
            productId: i.productId,
            slug: i.slug,
            name: i.name,
            image: i.image,
            size: i.size ?? null,
            price: i.price,
            qty: i.qty,
          })),
          address: {
            full_name: addr.full_name,
            phone: addr.phone,
            line1: addr.line1,
            line2: addr.line2 ?? null,
            city: addr.city,
            state: addr.state,
            pincode: addr.pincode,
            country: addr.country,
          },
          coupon_code: appliedCode,
          notes: notes || null,
        },
      });
      clear();
      toast.success(`Order ${res.order_number} placed`);
      navigate({ to: "/orders/$id", params: { id: res.id }, replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not place order");
    } finally { setPlacing(false); }
  };

  return (
    <main className="max-w-6xl mx-auto px-4 py-10 sm:py-14">
      <h1 className="font-display text-4xl sm:text-5xl mb-8">Checkout</h1>
      <div className="grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <section>
            <h2 className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-4">1 · Shipping address</h2>
            {addresses.length > 0 && (
              <div className="space-y-2 mb-4">
                {addresses.map((a) => (
                  <label key={a.id} className={`block border p-4 cursor-pointer ${selectedId === a.id ? "border-gold bg-beige/30" : "border-border"}`}>
                    <input type="radio" name="addr" className="mr-3" checked={selectedId === a.id} onChange={() => setSelectedId(a.id)} />
                    <span className="font-medium">{a.full_name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{a.phone}</span>
                    <p className="text-sm text-muted-foreground mt-1 ml-6">
                      {a.line1}{a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} {a.pincode}
                    </p>
                  </label>
                ))}
                <label className={`block border p-4 cursor-pointer ${selectedId === "new" ? "border-gold bg-beige/30" : "border-border"}`}>
                  <input type="radio" name="addr" className="mr-3" checked={selectedId === "new"} onChange={() => setSelectedId("new")} />
                  Use a new address
                </label>
              </div>
            )}
            {selectedId === "new" && (
              <div className="grid sm:grid-cols-2 gap-3 bg-ivory border border-border p-5">
                {([
                  ["full_name", "Full name *", true, "sm:col-span-1"],
                  ["phone", "Phone *", true, "sm:col-span-1"],
                  ["line1", "Address line 1 *", true, "sm:col-span-2"],
                  ["line2", "Address line 2", false, "sm:col-span-2"],
                  ["city", "City *", true, ""],
                  ["state", "State *", true, ""],
                  ["pincode", "Pincode *", true, ""],
                  ["country", "Country *", true, ""],
                ] as const).map(([k, label, req, col]) => (
                  <div key={k} className={col}>
                    <label className="block text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-1">{label}</label>
                    <input value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} required={req}
                      className="w-full bg-transparent border border-border px-3 py-2 text-sm focus:outline-none focus:border-gold" />
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-4">2 · Order notes (optional)</h2>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} rows={3}
              placeholder="Gift wrap, special requests…"
              className="w-full bg-ivory border border-border p-3 text-sm focus:outline-none focus:border-gold" />
          </section>

          <section>
            <h2 className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-4">3 · Payment</h2>
            <div className="bg-beige/30 border border-border p-5 text-sm text-muted-foreground">
              Online payment (UPI, cards, net banking) becomes available once Razorpay keys are configured. For now you can place an order and we'll confirm via WhatsApp/email.
            </div>
          </section>
        </div>

        <aside className="bg-beige/30 border border-border p-6 h-fit space-y-4">
          <h2 className="font-display text-2xl">Order Summary</h2>
          <ul className="divide-y divide-border -mx-2 max-h-72 overflow-y-auto">
            {items.map((i) => (
              <li key={`${i.productId}-${i.size ?? ""}`} className="flex gap-3 py-3 px-2">
                <img src={resolveImage(i.image)} alt={i.name} className="w-14 h-16 object-cover bg-beige" />
                <div className="flex-1 min-w-0 text-sm">
                  <p className="truncate">{i.name}</p>
                  <p className="text-xs text-muted-foreground">Qty {i.qty}{i.size ? ` · ${i.size}` : ""}</p>
                </div>
                <p className="text-sm font-medium">{formatINR(i.price * i.qty)}</p>
              </li>
            ))}
          </ul>

          <div className="border-t border-border pt-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="Coupon code"
                  className="w-full bg-ivory border border-border pl-9 pr-3 py-2 text-sm uppercase tracking-wider focus:outline-none focus:border-gold" />
              </div>
              <button onClick={applyCoupon} type="button" className="bg-espresso text-ivory px-4 text-xs uppercase tracking-[0.2em]">Apply</button>
            </div>
            {couponMsg && <p className={`text-xs mt-2 ${appliedCode ? "text-gold" : "text-destructive"}`}>{couponMsg}</p>}
            <p className="text-[10px] text-muted-foreground mt-1">Try WELCOME10 or FESTIVE500</p>
          </div>

          <div className="space-y-2 text-sm pt-2 border-t border-border">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatINR(subtotal)}</span></div>
            {discount > 0 && <div className="flex justify-between text-gold"><span>Discount</span><span>− {formatINR(discount)}</span></div>}
            <div className="flex justify-between"><span>Shipping</span><span className="text-gold">Free</span></div>
            <div className="flex justify-between font-medium text-base pt-2 border-t border-border"><span>Total</span><span>{formatINR(total)}</span></div>
          </div>

          <button onClick={onPlace} disabled={placing} className="w-full bg-espresso text-ivory py-4 text-xs uppercase tracking-[0.25em] hover:bg-espresso/90 disabled:opacity-60 flex items-center justify-center gap-2">
            {placing && <Loader2 className="size-4 animate-spin" />}
            {placing ? "Placing order…" : "Place order"}
          </button>
          <Link to="/cart" className="block text-center text-[11px] uppercase tracking-[0.2em] text-muted-foreground hover:text-gold">← Back to cart</Link>
        </aside>
      </div>
    </main>
  );
}
