import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { getHomepageProducts } from "@/lib/catalog.functions";
import { ProductCard } from "@/components/site/ProductCard";
import { useWishlist } from "@/lib/store/wishlist";

const allQuery = queryOptions({ queryKey: ["home"], queryFn: () => getHomepageProducts() });

export const Route = createFileRoute("/wishlist")({
  head: () => ({ meta: [{ title: "Wishlist — Harshita Collection" }] }),
  component: WishlistPage,
});

function WishlistPage() {
  const ids = useWishlist((s) => s.ids);
  const { data } = useQuery(allQuery);
  const all = [...(data?.featured ?? []), ...(data?.newArrivals ?? []), ...(data?.bestSellers ?? [])];
  const seen = new Set<string>();
  const items = all.filter((p) => ids.includes(p.id) && !seen.has(p.id) && seen.add(p.id));

  return (
    <main className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="font-display text-3xl sm:text-4xl mb-10 text-center">Your Wishlist</h1>
      {items.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground mb-6">No favourites saved yet.</p>
          <Link to="/" className="inline-block bg-espresso text-ivory px-8 py-3 text-xs uppercase tracking-[0.25em]">Browse Collection</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-12">
          {items.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </main>
  );
}
