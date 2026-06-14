import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useState } from "react";
import { Heart, Star, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { getProductBySlug } from "@/lib/catalog.functions";
import { resolveImage } from "@/lib/asset-map";
import { formatINR } from "@/lib/format";
import { useCart } from "@/lib/store/cart";
import { useWishlist } from "@/lib/store/wishlist";

const productQuery = (slug: string) =>
  queryOptions({
    queryKey: ["product", slug],
    queryFn: () => getProductBySlug({ data: { slug } }),
  });

export const Route = createFileRoute("/product/$slug")({
  loader: async ({ context, params }) => {
    const p = await context.queryClient.ensureQueryData(productQuery(params.slug));
    if (!p) throw notFound();
  },
  head: ({ loaderData, params }) => ({
    meta: [
      { title: `${prettify(params.slug)} — Harshita Collection` },
      { name: "description", content: "Shop hand-crafted Indian boutique pieces at Harshita Collection." },
    ],
  }),
  component: ProductPage,
  notFoundComponent: () => (
    <div className="min-h-[60vh] grid place-items-center"><p className="text-muted-foreground">Product not found.</p></div>
  ),
});

function prettify(slug: string) {
  return slug.split("-").map((s) => s[0].toUpperCase() + s.slice(1)).join(" ");
}

function ProductPage() {
  const { slug } = Route.useParams();
  const { data: product } = useSuspenseQuery(productQuery(slug));
  const navigate = useNavigate();
  const [size, setSize] = useState<string | undefined>();
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const addToCart = useCart((s) => s.add);
  const wished = useWishlist((s) => product ? s.ids.includes(product.id) : false);
  const toggleWl = useWishlist((s) => s.toggle);

  if (!product) return null;

  const sizes = Array.from(new Set((product.variants ?? []).map((v) => v.size).filter(Boolean))) as string[];
  const mainImg = resolveImage(product.images[activeImg]?.url ?? product.images[0]?.url);

  const handleAdd = (then?: "checkout") => {
    addToCart(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        image: product.images[0]?.url ?? "",
        size,
      },
      qty,
    );
    toast.success("Added to cart");
    if (then === "checkout") navigate({ to: "/cart" });
  };

  return (
    <main className="max-w-7xl mx-auto px-4 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
        <div>
          <div className="aspect-[4/5] bg-beige overflow-hidden rounded-sm mb-3">
            <img src={mainImg} alt={`${product.name}${product.fabric ? ` — ${product.fabric}` : ""}${product.category_name ? ` ${product.category_name}` : ""} from Harshita Collection`} width={800} height={1000} fetchPriority="high" className="w-full h-full object-cover" />
          </div>
          {product.images.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {product.images.map((img, i) => (
                <button key={i} onClick={() => setActiveImg(i)} className={`aspect-square overflow-hidden border ${i === activeImg ? "border-gold" : "border-transparent"}`}>
                  <img src={resolveImage(img.url)} alt="" loading="lazy" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          {product.category_name && (
            <p className="text-[11px] uppercase tracking-[0.25em] text-gold mb-3">{product.category_name}</p>
          )}
          <h1 className="font-display text-3xl sm:text-4xl mb-4">{product.name}</h1>
          <div className="flex items-center gap-2 mb-5">
            <Star className="size-3.5 fill-gold text-gold" />
            <span className="text-sm">{product.rating.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">({product.rating_count} reviews)</span>
          </div>
          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-2xl font-medium">{formatINR(product.price)}</span>
            {product.mrp && product.mrp > product.price && (
              <>
                <span className="text-sm text-muted-foreground line-through">{formatINR(product.mrp)}</span>
                <span className="text-xs text-gold uppercase tracking-wider">{product.discount_pct}% off</span>
              </>
            )}
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground mb-6">{product.description}</p>
          {product.fabric && (
            <p className="text-sm mb-6"><span className="uppercase text-[10px] tracking-[0.2em] text-muted-foreground mr-2">Fabric</span>{product.fabric}</p>
          )}

          {sizes.length > 0 && (
            <div className="mb-6">
              <p className="text-[10px] uppercase tracking-[0.25em] mb-3 text-muted-foreground">Size</p>
              <div className="flex gap-2">
                {sizes.map((s) => (
                  <button key={s} onClick={() => setSize(s)} className={`size-11 text-xs border rounded-sm ${size === s ? "border-espresso bg-espresso text-ivory" : "border-border hover:border-espresso"}`}>{s}</button>
                ))}
              </div>
            </div>
          )}

          <div className="mb-8">
            <p className="text-[10px] uppercase tracking-[0.25em] mb-3 text-muted-foreground">Quantity</p>
            <div className="inline-flex items-center border border-border">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity" className="size-10 grid place-items-center hover:bg-beige"><Minus className="size-3.5" /></button>
              <span className="w-12 text-center text-sm" aria-live="polite">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} aria-label="Increase quantity" className="size-10 grid place-items-center hover:bg-beige"><Plus className="size-3.5" /></button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={() => handleAdd()} className="flex-1 bg-espresso text-ivory py-4 text-xs uppercase tracking-[0.25em] font-medium hover:bg-gold transition-colors">Add to Cart</button>
            <button onClick={() => handleAdd("checkout")} className="flex-1 bg-gold text-ivory py-4 text-xs uppercase tracking-[0.25em] font-medium hover:bg-espresso transition-colors">Buy Now</button>
            <button onClick={() => { toggleWl(product.id); toast(wished ? "Removed from wishlist" : "Added to wishlist"); }} aria-label="Wishlist" className="border border-border p-4 hover:border-gold">
              <Heart className={`size-5 ${wished ? "fill-gold text-gold" : ""}`} />
            </button>
          </div>

          <div className="mt-8 pt-8 border-t border-border text-xs text-muted-foreground space-y-2">
            <p>✦ Complimentary shipping across India</p>
            <p>✦ Easy 7-day returns</p>
            <p>✦ Crafted with care, shipped with love</p>
          </div>
        </div>
      </div>
    </main>
  );
}
