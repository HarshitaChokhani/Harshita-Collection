import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { adminListProducts } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/inventory")({
  head: () => ({ meta: [{ title: "Inventory — Admin" }] }),
  component: InventoryPage,
});

function InventoryPage() {
  const list = useServerFn(adminListProducts);
  const { data: products = [], isLoading } = useQuery({ queryKey: ["admin-products"], queryFn: () => list() });
  const lowStock = products.filter((p: any) => p.stock <= 5);
  const out = products.filter((p: any) => p.stock === 0);
  return (
    <>
      <h1 className="font-display text-4xl mb-8">Inventory</h1>
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <Card label="Total SKUs" value={products.length} />
        <Card label="Low stock (≤5)" value={lowStock.length} accent />
        <Card label="Out of stock" value={out.length} accent />
      </div>
      {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
        <div className="bg-ivory border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-beige/40 text-left text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <tr><th className="p-3">Product</th><th className="p-3">Category</th><th className="p-3">Stock</th><th className="p-3">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.map((p: any) => (
                <tr key={p.id}>
                  <td className="p-3 font-medium">{p.name}</td>
                  <td className="p-3 text-muted-foreground">{p.categories?.name ?? "—"}</td>
                  <td className="p-3"><span className={p.stock === 0 ? "text-destructive" : p.stock <= 5 ? "text-gold" : ""}>{p.stock}</span></td>
                  <td className="p-3 text-[10px] uppercase tracking-[0.2em]">{p.stock === 0 ? "Out" : p.stock <= 5 ? "Low" : "OK"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function Card({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="bg-ivory border border-border p-6">
      <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{label}</p>
      <p className={`font-display text-3xl mt-2 ${accent ? "text-gold" : ""}`}>{value}</p>
    </div>
  );
}
