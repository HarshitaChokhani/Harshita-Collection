import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { adminListOrders, adminUpdateOrder } from "@/lib/admin.functions";
import { formatINR } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  head: () => ({ meta: [{ title: "Orders — Admin" }] }),
  component: AdminOrdersPage,
});

const STATUSES = ["pending","paid","processing","shipped","delivered","cancelled","refunded"] as const;

function AdminOrdersPage() {
  const list = useServerFn(adminListOrders);
  const update = useServerFn(adminUpdateOrder);
  const qc = useQueryClient();
  const { data: orders = [], isLoading } = useQuery({ queryKey: ["admin-orders"], queryFn: () => list() });
  const [busy, setBusy] = useState<string | null>(null);

  const onStatus = async (id: string, status: string) => {
    setBusy(id);
    try {
      await update({ data: { id, status: status as any } });
      toast.success("Status updated");
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setBusy(null); }
  };

  return (
    <>
      <h1 className="font-display text-4xl mb-8">Orders</h1>
      {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
        <div className="bg-ivory border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-beige/40 text-left text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <tr>
                <th className="p-3">Order</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Total</th>
                <th className="p-3">Payment</th>
                <th className="p-3">Status</th>
                <th className="p-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.map((o: any) => (
                <tr key={o.id}>
                  <td className="p-3 font-medium">#{o.order_number}</td>
                  <td className="p-3">{o.shipping_address?.full_name ?? "—"}<br/>
                    <span className="text-xs text-muted-foreground">{o.shipping_address?.city}, {o.shipping_address?.state}</span>
                  </td>
                  <td className="p-3">{formatINR(Number(o.total))}</td>
                  <td className="p-3 capitalize">{o.payment_status}</td>
                  <td className="p-3">
                    <select disabled={busy === o.id} value={o.status} onChange={(e) => onStatus(o.id, e.target.value)}
                      className="bg-transparent border border-border px-2 py-1 text-xs">
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString("en-IN")}</td>
                </tr>
              ))}
              {orders.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No orders yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
