import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";
import { LayoutDashboard, Package, ShoppingBag, Tag, Users, Star, Boxes, Settings, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin")({
  ssr: false,
  beforeLoad: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw redirect({ to: "/auth" });
    const { data: role } = await supabase
      .from("user_roles").select("role").eq("user_id", u.user.id).eq("role", "admin").maybeSingle();
    if (!role) throw redirect({ to: "/account" });
  },
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <div className="grid lg:grid-cols-[240px_1fr] min-h-[calc(100vh-12rem)]">
      <aside className="bg-espresso text-ivory p-6 lg:p-8">
        <p className="font-display text-2xl mb-1">Harshita</p>
        <p className="text-[10px] uppercase tracking-[0.3em] text-ivory/60 mb-8">Admin Panel</p>
        <nav className="flex lg:flex-col gap-2 lg:gap-1 text-sm">
          {[
            { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
            { to: "/admin/products", label: "Products", icon: Package },
            { to: "/admin/orders", label: "Orders", icon: ShoppingBag },
            { to: "/admin/customers", label: "Customers", icon: Users },
            { to: "/admin/reviews", label: "Reviews", icon: Star },
            { to: "/admin/inventory", label: "Inventory", icon: Boxes },
            { to: "/admin/coupons", label: "Coupons", icon: Tag },
            { to: "/admin/contact-info", label: "Contact Info", icon: Phone },
            { to: "/admin/settings", label: "Settings", icon: Settings },
          ].map((l) => (
            <Link
              key={l.to as string}
              to={l.to as any}
              activeOptions={{ exact: l.exact }}
              className="flex items-center gap-3 px-3 py-2.5 rounded text-ivory/80 hover:bg-ivory/10 hover:text-ivory"
              activeProps={{ className: "flex items-center gap-3 px-3 py-2.5 rounded bg-gold text-espresso font-medium" }}
            >
              <l.icon className="size-4" /> {l.label}
            </Link>
          ))}
        </nav>
        <Link to="/" className="block mt-10 text-[10px] uppercase tracking-[0.25em] text-ivory/60 hover:text-gold">← Back to store</Link>
      </aside>
      <main className="bg-beige/20 p-6 lg:p-10">
        <Outlet />
      </main>
    </div>
  );
}
