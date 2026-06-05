import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listMyOrders } from "@/lib/checkout.functions";
import { formatINR } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/orders")({
  head: () => ({ meta: [{ title: "My Orders — Harshita Collection" }] }),
  component: OrdersPage,
});

const STATUS_COLORS: Record<string, string> = {
  pending: "text-muted-foreground",
  paid: "text-gold",
  processing: "text-gold",
  shipped: "text-blue-600",
  delivered: "text-emerald-600",
  cancelled: "text-destructive",
  refunded: "text-muted-foreground",
};

function OrdersPage() {
  const fetchOrders = useServerFn(listMyOrders);
  const { data: orders = [], isLoading } = useQuery({ queryKey: ["my-orders"], queryFn: () => fetchOrders() });

  return (
    <main className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
      <Link to="/account" className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground hover:text-gold">← Account</Link>
      <h1 className="font-display text-4xl sm:text-5xl mt-2 mb-8">My Orders</h1>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : orders.length === 0 ? (
        <div className="text-center border border-dashed border-border py-16">
          <p className="text-muted-foreground mb-6">No orders yet.</p>
          <Link to="/" className="inline-block bg-espresso text-ivory px-8 py-3 text-xs uppercase tracking-[0.25em]">Start Shopping</Link>
        </div>
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {orders.map((o) => (
            <li key={o.id}>
              <Link to="/orders/$id" params={{ id: o.id }} className="flex items-center justify-between gap-4 py-5 hover:bg-beige/30 px-2 -mx-2">
                <div>
                  <p className="font-medium">#{o.order_number}</p>
                  <p className="text-xs text-muted-foreground mt-1">{new Date(o.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatINR(Number(o.total))}</p>
                  <p className={`text-[10px] uppercase tracking-[0.2em] mt-1 ${STATUS_COLORS[o.status] ?? ""}`}>{o.status}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
