import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { adminListCustomers } from "@/lib/admin.functions";
import { formatINR } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/customers")({
  head: () => ({ meta: [{ title: "Customers — Admin" }] }),
  component: AdminCustomersPage,
});

function AdminCustomersPage() {
  const list = useServerFn(adminListCustomers);
  const { data: customers = [], isLoading } = useQuery({ queryKey: ["admin-customers"], queryFn: () => list() });
  return (
    <>
      <h1 className="font-display text-4xl mb-8">Customers</h1>
      {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
        <div className="bg-ivory border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-beige/40 text-left text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <tr>
                <th className="p-3">Name</th><th className="p-3">Phone</th><th className="p-3">Orders</th><th className="p-3">Spent</th><th className="p-3">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {customers.map((c: any) => (
                <tr key={c.id} className="hover:bg-beige/20">
                  <td className="p-3 font-medium">{c.full_name || "—"}</td>
                  <td className="p-3">{c.phone || "—"}</td>
                  <td className="p-3">{c.orders}</td>
                  <td className="p-3">{formatINR(c.spent)}</td>
                  <td className="p-3 text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString("en-IN")}</td>
                </tr>
              ))}
              {customers.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No customers yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
