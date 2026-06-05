import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { getHomepageProducts, getCategories } from "@/lib/catalog.functions";
import { ProductCard } from "@/components/site/ProductCard";
import { HERO_IMG, CATEGORY_IMG } from "@/lib/asset-map";
import { Instagram } from "lucide-react";

const homeQuery = queryOptions({ queryKey: ["home"], queryFn: () => getHomepageProducts() });
const catsQuery = queryOptions({ queryKey: ["categories"], queryFn: () => getCategories() });

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(homeQuery),
      context.queryClient.ensureQueryData(catsQuery),
    ]);
  },
  component: Home,
});

const TESTIMONIALS = [
  { quote: "The attention to detail in the embroidery is unlike anything I've seen. It felt like receiving a precious heirloom.", name: "Priyanka Sharma", city: "Mumbai" },
  { quote: "Wore the Banarasi for my daughter's wedding and felt like royalty. The quality is simply unmatched.", name: "Meenakshi Iyer", city: "Bengaluru" },
  { quote: "Every piece feels considered. The drape, the cut, the colours — Harshita is now my go-to boutique.", name: "Anjali Verma", city: "Delhi" },
];

function Home() {
  const { data } = useSuspenseQuery(homeQuery);
  const { data: cats } = useSuspenseQuery(catsQuery);
  const featuredCats = cats.filter((c) => ["suits", "kurtis", "sarees", "dupattas"].includes(c.slug));

  return (
    <main>
      {/* Hero */}
      <section className="px-4 py-6 sm:py-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 order-2 lg:order-1">
            <img src={HERO_IMG} alt="The Monsoon Silk Collection" width={1280} height={1600} className="w-full aspect-[4/5] object-cover rounded-sm" />
          </div>
          <div className="lg:col-span-5 order-1 lg:order-2 text-center lg:text-left">
            <span className="text-[11px] uppercase tracking-[0.3em] text-gold">The Monsoon Edit</span>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl leading-[1.05] mt-4 mb-5 text-balance">
              Elegance in Every Thread
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed max-w-md mx-auto lg:mx-0 mb-8">
              Discover hand-stitched ensembles that mirror the grace of Indian tradition — reimagined for the modern boutique woman.
            </p>
            <Link to="/category/$slug" params={{ slug: "new-arrivals" }} className="inline-block bg-espresso text-ivory px-10 py-4 text-xs font-medium uppercase tracking-[0.25em] hover:bg-gold transition-colors">
              Explore Collection
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="bg-blush py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl sm:text-4xl">Curated Categories</h2>
            <div className="h-px w-12 bg-gold mx-auto mt-3" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {featuredCats.map((cat) => (
              <Link key={cat.slug} to="/category/$slug" params={{ slug: cat.slug }} className="group">
                <div className="aspect-[3/4] bg-ivory overflow-hidden rounded-sm mb-3">
                  <img src={CATEGORY_IMG[cat.slug]} alt={cat.name} loading="lazy" width={800} height={1000} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                </div>
                <p className="text-center text-[11px] uppercase tracking-[0.2em] font-medium">{cat.name}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured */}
      {data.featured.length > 0 && (
        <section className="py-16 sm:py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-[11px] uppercase tracking-[0.3em] text-gold">Hand-Picked</span>
              <h2 className="font-display text-3xl sm:text-4xl mt-3">Featured This Season</h2>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-10">
              {data.featured.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* New Arrivals */}
      {data.newArrivals.length > 0 && (
        <section className="py-16 px-4 bg-beige/50">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-end mb-10">
              <div>
                <span className="text-[11px] uppercase tracking-[0.3em] text-gold">Just In</span>
                <h2 className="font-display text-3xl mt-2">New Arrivals</h2>
              </div>
              <Link to="/category/$slug" params={{ slug: "new-arrivals" }} className="text-[10px] uppercase tracking-[0.2em] border-b border-espresso/30 pb-0.5 hover:text-gold hover:border-gold">View All</Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-10">
              {data.newArrivals.slice(0, 4).map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* Best Sellers */}
      {data.bestSellers.length > 0 && (
        <section className="py-16 sm:py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-end mb-10">
              <div>
                <span className="text-[11px] uppercase tracking-[0.3em] text-gold">Loved By Many</span>
                <h2 className="font-display text-3xl mt-2">Best Sellers</h2>
              </div>
              <Link to="/category/$slug" params={{ slug: "best-sellers" }} className="text-[10px] uppercase tracking-[0.2em] border-b border-espresso/30 pb-0.5 hover:text-gold hover:border-gold">View All</Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-10">
              {data.bestSellers.slice(0, 4).map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      <section className="bg-espresso text-ivory py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-[11px] uppercase tracking-[0.3em] text-gold">Kind Words</span>
            <h2 className="font-display text-3xl mt-3">From Our Patrons</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-10">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="text-center">
                <div className="font-display text-gold text-4xl leading-none mb-3">“</div>
                <p className="font-display text-lg italic leading-relaxed mb-5 text-ivory/90">{t.quote}</p>
                <p className="text-[10px] uppercase tracking-[0.2em] font-medium">{t.name}</p>
                <p className="text-[10px] uppercase tracking-[0.15em] text-ivory/50 mt-1">{t.city}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Instagram */}
      <section className="py-20 px-4">
        <div className="text-center mb-10">
          <Instagram className="size-5 mx-auto mb-3 text-gold" />
          <h2 className="font-display text-2xl">Follow the Journey</h2>
          <p className="text-[10px] uppercase tracking-[0.25em] text-gold mt-2">@HarshitaCollection</p>
        </div>
        <div className="max-w-6xl mx-auto grid grid-cols-3 md:grid-cols-6 gap-1">
          {Object.values(CATEGORY_IMG).slice(0, 6).map((src, i) => (
            <a key={i} href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="aspect-square overflow-hidden bg-beige">
              <img src={src} alt="" loading="lazy" width={400} height={400} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
