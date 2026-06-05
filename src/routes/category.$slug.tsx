import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { getProductsByCategory } from "@/lib/catalog.functions";
import { ProductCard } from "@/components/site/ProductCard";

const catQuery = (slug: string) =>
  queryOptions({
    queryKey: ["category", slug],
    queryFn: () => getProductsByCategory({ data: { slug } }),
  });

export const Route = createFileRoute("/category/$slug")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(catQuery(params.slug)),
  head: ({ params }) => ({
    meta: [
      { title: `${prettify(params.slug)} — Harshita Collection` },
      { name: "description", content: `Shop ${prettify(params.slug)} at Harshita Collection. Complimentary shipping across India.` },
    ],
  }),
  component: CategoryPage,
});

function prettify(slug: string) {
  return slug.split("-").map((s) => s[0].toUpperCase() + s.slice(1)).join(" ");
}

function CategoryPage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(catQuery(slug));

  return (
    <main className="max-w-7xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <span className="text-[11px] uppercase tracking-[0.3em] text-gold">Collection</span>
        <h1 className="font-display text-4xl sm:text-5xl mt-3">{data.category?.name ?? prettify(slug)}</h1>
        <p className="text-sm text-muted-foreground mt-3">{data.products.length} pieces</p>
      </div>
      {data.products.length === 0 ? (
        <p className="text-center text-muted-foreground py-20">More pieces arriving soon.</p>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-12">
          {data.products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </main>
  );
}
