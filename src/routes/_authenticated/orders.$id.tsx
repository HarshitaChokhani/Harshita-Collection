import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getMyOrder } from "@/lib/checkout.functions";
import { formatINR } from "@/lib/format";
import { resolveImage } from "@/lib/asset-map";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/orders/$id")({
  head: () => ({ meta: [{ title: "Order Details — Harshita Collection" }] }),
  component: OrderDetailPage,
});

function OrderDetailPage() {
  const { id } = Route.useParams();
  const fetchOrder = useServerFn(getMyOrder);
  const { data: order, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: () => fetchOrder({ data: { id } }),
  });

  if (isLoading) return <main className="max-w-3xl mx-auto px-4 py-16"><p className="text-sm text-muted-foreground">Loading…</p></main>;
  if (!order) return (
    <main className="max-w-3xl mx-auto px-4 py-16 text-center">
      <p className="text-muted-foreground">Order not found.</p>
      <Link to="/orders" className="inline-block mt-6 text-xs uppercase tracking-[0.25em] text-gold">← All orders</Link>
    </main>
  );

  const addr = order.shipping_address as Record<string, string>;
  return (
    <main className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
      <Link to="/orders" className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground hover:text-gold">← All orders</Link>

      <header className="mt-4 mb-10 text-center bg-beige/30 border border-border p-8">
        <CheckCircle2 className="size-12 text-gold mx-auto mb-4" />
        <h1 className="font-display text-3xl sm:text-4xl">Thank you for your order</h1>
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mt-2">Order #{order.order_number}</p>
        <p className="text-sm text-muted-foreground mt-4">We'll email you when it ships. You can also reach us on WhatsApp anytime.</p>
      </header>

      <section className="grid sm:grid-cols-2 gap-6 mb-10">
        <div className="border border-border p-5">
          <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">Status</p>
          <p className="font-medium capitalize">{order.status}</p>
          <p className="text-xs text-muted-foreground mt-1">Payment: <span className="capitalize">{order.payment_status}</span></p>
          {order.tracking_number && <p className="text-xs mt-2">Tracking: <span className="font-mono">{order.tracking_number}</span></p>}
        </div>
        <div className="border border-border p-5">
          <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">Shipping to</p>
          <p className="font-medium">{addr.full_name}</p>
          <p className="text-sm text-muted-foreground">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}, {addr.city}, {addr.state} {addr.pincode} · {addr.phone}</p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="font-display text-2xl mb-4">Items</h2>
        <ul className="divide-y divide-border border-y border-border">
          {(order.order_items ?? []).map((it: any) => (
            <li key={it.id} className="flex gap-4 py-4">
              <img src={resolveImage(it.image_url)} alt={it.product_name} className="w-16 h-20 object-cover bg-beige" />
              <div className="flex-1 min-w-0">
                <Link to="/product/$slug" params={{ slug: it.product_slug }} className="text-sm font-medium hover:text-gold">{it.product_name}</Link>
                <p className="text-xs text-muted-foreground mt-1">Qty {it.qty}{it.size ? ` · Size ${it.size}` : ""}</p>
              </div>
              <p className="text-sm font-medium">{formatINR(Number(it.price) * it.qty)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="ml-auto max-w-sm space-y-2 text-sm">
        <div className="flex justify-between"><span>Subtotal</span><span>{formatINR(Number(order.subtotal))}</span></div>
        {Number(order.discount) > 0 && <div className="flex justify-between text-gold"><span>Discount{order.coupon_code ? ` (${order.coupon_code})` : ""}</span><span>− {formatINR(Number(order.discount))}</span></div>}
        <div className="flex justify-between"><span>Shipping</span><span className="text-gold">Free</span></div>
        <div className="flex justify-between font-medium pt-2 border-t border-border text-base"><span>Total</span><span>{formatINR(Number(order.total))}</span></div>
      </section>
    </main>
  );
}
