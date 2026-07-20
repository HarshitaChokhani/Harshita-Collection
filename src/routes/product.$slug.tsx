import { createFileRoute, notFound, useNavigate, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useState } from "react";
import { Heart, Star, Minus, Plus, Ruler, MessageCircle, Share2, ShieldCheck, Truck, RotateCcw, Maximize2 } from "lucide-react";
import { toast } from "sonner";
import { getProductBySlug } from "@/lib/catalog.functions";
import { resolveImage } from "@/lib/asset-map";
import { formatINR } from "@/lib/format";
import { useCart } from "@/lib/store/cart";
import { useWishlist } from "@/lib/store/wishlist";
import { SizeChart } from "@/components/site/SizeChart";
import { ProductGallery } from "@/components/site/ProductGallery";
import { CONTACT, waLink } from "@/lib/contact";

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
  head: ({ params }) => ({
    meta: [
      { title: `${prettify(params.slug)} — Harshita Collection` },
      { name: "description", content: "Shop hand-crafted Indian boutique pieces at Harshita Collection." },
      { property: "og:url", content: `https://harshita-collection.lovable.app/product/${params.slug}` },
      { property: "og:type", content: "product" },
    ],
    links: [{ rel: "canonical", href: `https://harshita-collection.lovable.app/product/${params.slug}` }],
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
  const [sizeChartOpen, setSizeChartOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const debugImages = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("debugImages");
  const addToCart = useCart((s) => s.add);
  const wished = useWishlist((s) => product ? s.ids.includes(product.id) : false);
  const toggleWl = useWishlist((s) => s.toggle);

  if (!product) return null;

  const sizes = Array.from(new Set((product.variants ?? []).map((v) => v.size).filter(Boolean))) as string[];
  const images = product.images.length > 0 ? product.images : [{ url: "", alt: product.name, sort_order: 0 }];
  const mainImg = resolveImage(images[activeImg]?.url ?? images[0]?.url);

  const shareUrl = typeof window !== "undefined" ? window.location.href : `https://harshita-collection.lovable.app/product/${product.slug}`;
  const askMsg = `Hello ${CONTACT.brand}, I'd like more information about "${product.name}" (${formatINR(product.price)}).\n${shareUrl}`;
  const shareMsg = `Check out this beautiful piece from ${CONTACT.brand}: "${product.name}" — ${formatINR(product.price)}\n${shareUrl}`;

  const handleAdd = (then?: "checkout") => {
    addToCart(
      { productId: product.id, slug: product.slug, name: product.name, price: product.price, image: product.images[0]?.url ?? "", size },
      qty,
    );
    toast.success("Added to cart");
    if (then === "checkout") navigate({ to: "/cart" });
  };

  const inStock = product.stock > 0;

  return (
    <main className="max-w-7xl mx-auto px-4 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
        {/* Image column */}
        <div>
          <div className="relative aspect-[4/5] bg-beige overflow-hidden rounded-sm mb-3 group">
            <img
              src={mainImg}
              alt={`${product.name}${product.fabric ? ` — ${product.fabric}` : ""}${product.category_name ? ` ${product.category_name}` : ""} from Harshita Collection`}
              width={800}
              height={1000}
              fetchPriority="high"
              className="w-full h-full object-cover cursor-zoom-in"
              onClick={() => setGalleryOpen(true)}
              onLoad={(event) => {
                if (!debugImages) return;
                const image = event.currentTarget;
                console.info("[product-image-debug][product-page][load]", {
                  productId: product.id,
                  productName: product.name,
                  storedUrl: images[activeImg]?.url ?? images[0]?.url ?? null,
                  renderedSrc: image.currentSrc,
                  naturalWidth: image.naturalWidth,
                  naturalHeight: image.naturalHeight,
                });
              }}
              onError={(event) => {
                if (!debugImages) return;
                const image = event.currentTarget;
                console.error("[product-image-debug][product-page][error]", {
                  productId: product.id,
                  productName: product.name,
                  storedUrl: images[activeImg]?.url ?? images[0]?.url ?? null,
                  renderedSrc: image.currentSrc || image.src,
                });
              }}
            />
            <button
              onClick={() => setGalleryOpen(true)}
              aria-label="Open full-screen gallery"
              className="absolute bottom-3 right-3 bg-ivory/90 backdrop-blur p-2.5 rounded-full hover:bg-ivory transition"
            >
              <Maximize2 className="size-4" />
            </button>
            {images.length > 1 && (
              <span className="absolute bottom-3 left-3 bg-espresso/80 text-ivory text-[10px] uppercase tracking-[0.2em] px-3 py-1.5 rounded-full backdrop-blur">
                {activeImg + 1} / {images.length}
              </span>
            )}
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {images.map((img, i) => (
                <button key={i} onClick={() => setActiveImg(i)}
                  aria-label={`Show image ${i + 1}`}
                  className={`aspect-square overflow-hidden border-2 ${i === activeImg ? "border-gold" : "border-transparent hover:border-border"}`}>
                  <img src={resolveImage(img.url)} alt="" loading="lazy" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details column */}
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
          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-2xl font-medium">{formatINR(product.price)}</span>
            {product.mrp && product.mrp > product.price && (
              <>
                <span className="text-sm text-muted-foreground line-through">{formatINR(product.mrp)}</span>
                <span className="text-xs text-gold uppercase tracking-wider">{product.discount_pct}% off</span>
              </>
            )}
          </div>
          <p className={`text-[11px] uppercase tracking-[0.2em] mb-6 ${inStock ? "text-green-700" : "text-destructive"}`}>
            {inStock ? `✦ In stock${product.stock <= 5 ? ` — only ${product.stock} left` : ""}` : "Out of stock"}
          </p>

          {product.description && (
            <p className="text-sm leading-relaxed text-muted-foreground mb-6 whitespace-pre-line">{product.description}</p>
          )}

          {/* Colors */}
          {product.colors && product.colors.length > 0 && (
            <div className="mb-6">
              <p className="text-[10px] uppercase tracking-[0.25em] mb-3 text-muted-foreground">Colors Available</p>
              <div className="flex flex-wrap gap-3">
                {product.colors.map((c) => (
                  <div key={c.name} className="flex items-center gap-2 text-xs">
                    <span className="size-6 rounded-full border border-border shadow-sm" style={{ background: c.hex }} aria-hidden />
                    <span>{c.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Size with chart trigger */}
          {sizes.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Size</p>
                <button onClick={() => setSizeChartOpen(true)} className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-espresso hover:text-gold">
                  <Ruler className="size-3.5" /> Size Chart
                </button>
              </div>
              <div className="flex gap-2 flex-wrap">
                {sizes.map((s) => (
                  <button key={s} onClick={() => setSize(s)} className={`size-11 text-xs border rounded-sm ${size === s ? "border-espresso bg-espresso text-ivory" : "border-border hover:border-espresso"}`}>{s}</button>
                ))}
              </div>
            </div>
          )}
          {sizes.length === 0 && (
            <div className="mb-6">
              <button onClick={() => setSizeChartOpen(true)} className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] border border-border px-4 py-2 hover:border-gold hover:text-gold transition">
                <Ruler className="size-3.5" /> View Size Chart
              </button>
            </div>
          )}

          {/* Quantity */}
          <div className="mb-6">
            <p className="text-[10px] uppercase tracking-[0.25em] mb-3 text-muted-foreground">Quantity</p>
            <div className="inline-flex items-center border border-border">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity" className="size-10 grid place-items-center hover:bg-beige"><Minus className="size-3.5" /></button>
              <span className="w-12 text-center text-sm" aria-live="polite">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} aria-label="Increase quantity" className="size-10 grid place-items-center hover:bg-beige"><Plus className="size-3.5" /></button>
            </div>
          </div>

          {/* Primary actions */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <button onClick={() => handleAdd()} disabled={!inStock} className="flex-1 bg-espresso text-ivory py-4 text-xs uppercase tracking-[0.25em] font-medium hover:bg-gold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Add to Cart</button>
            <button onClick={() => handleAdd("checkout")} disabled={!inStock} className="flex-1 bg-gold text-ivory py-4 text-xs uppercase tracking-[0.25em] font-medium hover:bg-espresso transition-colors disabled:opacity-50">Buy Now</button>
            <button onClick={() => { toggleWl(product.id); toast(wished ? "Removed from wishlist" : "Added to wishlist"); }} aria-label="Wishlist" className="border border-border p-4 hover:border-gold">
              <Heart className={`size-5 ${wished ? "fill-gold text-gold" : ""}`} />
            </button>
          </div>

          {/* Share */}
          <div className="mb-8">
            <button
              onClick={async () => {
                const shareData = { title: product.name, text: shareMsg, url: shareUrl };
                try {
                  if (typeof navigator !== "undefined" && (navigator as Navigator).share) {
                    await (navigator as Navigator).share(shareData);
                  } else if (typeof navigator !== "undefined" && navigator.clipboard) {
                    await navigator.clipboard.writeText(shareUrl);
                    toast.success("Link copied — paste it in WhatsApp, Instagram, or Messages");
                  }
                } catch (err) {
                  if ((err as Error)?.name !== "AbortError") {
                    toast.error("Unable to share");
                  }
                }
              }}
              className="w-full inline-flex items-center justify-center gap-2 bg-ivory border border-border py-3 text-xs uppercase tracking-[0.2em] hover:border-gold hover:text-gold"
            >
              <Share2 className="size-4" /> Share Product
            </button>
            <p className="text-[10px] text-muted-foreground text-center mt-2 uppercase tracking-[0.15em]">
              Share via WhatsApp, Instagram, Messages & more
            </p>
          </div>

          {/* Detail strip */}
          <div className="border-t border-border pt-6 grid sm:grid-cols-3 gap-4 text-xs text-muted-foreground">
            <div className="flex items-start gap-2"><Truck className="size-4 text-gold shrink-0 mt-0.5" /><div><p className="text-foreground font-medium text-[11px] uppercase tracking-[0.15em]">Free Shipping</p><p className="mt-1">Across India</p></div></div>
            <div className="flex items-start gap-2"><RotateCcw className="size-4 text-gold shrink-0 mt-0.5" /><div><p className="text-foreground font-medium text-[11px] uppercase tracking-[0.15em]">7-Day Returns</p><p className="mt-1">Easy exchange</p></div></div>
            <div className="flex items-start gap-2"><ShieldCheck className="size-4 text-gold shrink-0 mt-0.5" /><div><p className="text-foreground font-medium text-[11px] uppercase tracking-[0.15em]">Verified Seller</p><p className="mt-1">Hand-crafted</p></div></div>
          </div>
        </div>
      </div>

      {/* Specs + Owner section */}
      <section className="mt-16 grid lg:grid-cols-[1.4fr_1fr] gap-10">
        <div className="bg-ivory border border-border p-6 sm:p-8">
          <h2 className="font-display text-2xl mb-6">Product Details</h2>
          <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
            <Row label="Fabric" value={product.fabric} />
            <Row label="Material Composition" value={product.material_composition} />
            <Row label="Cotton Percentage" value={product.cotton_percentage != null ? `${product.cotton_percentage}%` : null} />
            <Row label="Available Sizes" value={sizes.length ? sizes.join(", ") : "Free size"} />
            <Row label="Available Colors" value={product.colors?.map((c) => c.name).join(", ") ?? null} />
            <Row label="Stock Status" value={inStock ? "In stock" : "Out of stock"} />
            <Row label="Category" value={product.category_name} />
            <Row label="SKU" value={product.slug.toUpperCase()} />
          </dl>

          {product.wash_care && (
            <div className="mt-8 pt-6 border-t border-border">
              <h3 className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground mb-2">Wash Care</h3>
              <p className="text-sm leading-relaxed whitespace-pre-line">{product.wash_care}</p>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-border grid sm:grid-cols-2 gap-6 text-sm">
            <div>
              <h3 className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground mb-2">Shipping</h3>
              <p className="leading-relaxed text-muted-foreground">{product.shipping_info ?? "Complimentary shipping across India. Dispatched within 2–3 business days; typically delivered in 4–7 business days."}</p>
            </div>
            <div>
              <h3 className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground mb-2">Returns</h3>
              <p className="leading-relaxed text-muted-foreground">{product.return_policy ?? "Easy 7-day returns from delivery. Items must be unworn with tags intact. Custom-stitched pieces are non-returnable."}</p>
            </div>
          </div>
        </div>

        {/* Verified seller / owner */}
        <aside className="bg-blush p-6 sm:p-8 border border-gold/20 h-fit">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-gold mb-3">
            <ShieldCheck className="size-4" /> Verified Seller
          </div>
          <h3 className="font-display text-2xl mb-1">Sold by {CONTACT.brand}</h3>
          <p className="text-sm text-muted-foreground mb-5">
            Hand-stitched and shipped from a small family-run boutique.
          </p>
          <dl className="text-sm space-y-3">
            <div>
              <dt className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Owner</dt>
              <dd>{CONTACT.owner}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Location</dt>
              <dd>{CONTACT.location}</dd>
            </div>
          </dl>
          <div className="mt-6 flex flex-col gap-2">
            <a href={waLink(askMsg)} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-[#25D366] text-white px-4 py-2.5 text-xs uppercase tracking-[0.2em]">
              <MessageCircle className="size-4" /> Message Boutique
            </a>
            <Link to="/contact" className="inline-flex items-center justify-center px-4 py-2.5 text-xs uppercase tracking-[0.2em] border border-border hover:border-gold">
              Contact Details
            </Link>
          </div>
        </aside>
      </section>

      <SizeChart open={sizeChartOpen} onClose={() => setSizeChartOpen(false)} productName={product.name} />
      <ProductGallery
        images={product.images}
        startIndex={activeImg}
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        productName={product.name}
      />
    </main>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</dt>
      <dd className="mt-0.5">{value}</dd>
    </div>
  );
}
