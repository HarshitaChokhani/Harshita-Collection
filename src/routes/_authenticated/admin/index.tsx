import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { adminStats } from "@/lib/admin.functions";
import { formatINR } from "@/lib/format";
import { ShoppingBag, Package, Users, IndianRupee } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Admin — Harshita Collection" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const fn = useServerFn(adminStats);
  const { data } = useQuery({ queryKey: ["admin-stats"], queryFn: () => fn() });

  const cards = [
    { label: "Revenue (paid)", value: data ? formatINR(data.revenue) : "—", icon: IndianRupee },
    { label: "Total orders", value: data?.orders ?? "—", icon: ShoppingBag },
    { label: "Active products", value: data?.products ?? "—", icon: Package },
    { label: "Customers", value: data?.customers ?? "—", icon: Users },
  ];

  return (
    <>
      <h1 className="font-display text-4xl mb-8">Dashboard</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-ivory border border-border p-6">
            <c.icon className="size-5 text-gold mb-3" />
            <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{c.label}</p>
            <p className="font-display text-3xl mt-2">{c.value}</p>
          </div>
        ))}
      </div>
      <p className="mt-10 text-sm text-muted-foreground">Welcome back. Manage your storefront from the sidebar.</p>
    </>
  );
}
