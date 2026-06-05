import { createFileRoute } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { z } from "zod";
import { searchProducts } from "@/lib/catalog.functions";
import { ProductCard } from "@/components/site/ProductCard";

const searchSchema = z.object({ q: z.string().optional().default("") });

export const Route = createFileRoute("/search")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Search — Harshita Collection" }] }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const { data, isLoading } = useQuery(
    queryOptions({
      queryKey: ["search", q],
      queryFn: () => searchProducts({ data: { q } }),
      enabled: !!q,
    }),
  );

  return (
    <main className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="font-display text-3xl mb-2 text-center">Search Results</h1>
      <p className="text-center text-sm text-muted-foreground mb-10">{q ? `Results for "${q}"` : "Enter a search term"}</p>
      {isLoading && <p className="text-center text-muted-foreground">Searching…</p>}
      {data && data.length === 0 && <p className="text-center text-muted-foreground py-12">No pieces match your search.</p>}
      {data && data.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-12">
          {data.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </main>
  );
}
