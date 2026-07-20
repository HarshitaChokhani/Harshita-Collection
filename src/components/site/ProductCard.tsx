import { Link } from "@tanstack/react-router";
import { Heart, Star } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/lib/types";
import { resolveImage } from "@/lib/asset-map";
import { formatINR } from "@/lib/format";
import { useCart } from "@/lib/store/cart";
import { useWishlist } from "@/lib/store/wishlist";

export function ProductCard({ product }: { product: Product }) {
  const img = resolveImage(product.images[0]?.url);
  const wished = useWishlist((s) => s.ids.includes(product.id));
  const toggleWl = useWishlist((s) => s.toggle);
  const addToCart = useCart((s) => s.add);

  return (
    <div className="group flex flex-col">
      <div className="relative mb-3 overflow-hidden bg-beige rounded-sm">
        <Link to="/product/$slug" params={{ slug: product.slug }} className="block">
          <img
            src={img}
            alt={product.images[0]?.alt ?? product.name}
            loading="lazy"
            width={800}
            height={1000}
            className="w-full aspect-[4/5] object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </Link>
        {product.discount_pct ? (
          <span className="absolute top-3 left-3 bg-gold text-ivory text-[9px] tracking-[0.15em] uppercase px-2 py-1 font-medium">
            -{product.discount_pct}%
          </span>
        ) : product.is_new ? (
          <span className="absolute top-3 left-3 bg-espresso text-ivory text-[9px] tracking-[0.15em] uppercase px-2 py-1 font-medium">
            New
          </span>
        ) : null}
        <button
          onClick={(e) => {
            e.preventDefault();
            toggleWl(product.id);
            toast(wished ? "Removed from wishlist" : "Added to wishlist");
          }}
          aria-label="Wishlist"
          className="absolute top-3 right-3 p-2 bg-ivory/85 backdrop-blur-sm rounded-full hover:bg-ivory"
        >
          <Heart className={`size-3.5 ${wished ? "fill-gold text-gold" : ""}`} />
        </button>
      </div>
      <Link to="/product/$slug" params={{ slug: product.slug }} className="block">
        <h3 className="text-sm font-medium leading-snug">{product.name}</h3>
        {product.fabric && (
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider mt-1">{product.fabric}</p>
        )}
      </Link>
      <div className="flex items-baseline gap-2 mt-2">
        <span className="text-sm font-medium">{formatINR(product.price)}</span>
        {product.mrp && product.mrp > product.price && (
          <span className="text-[11px] text-muted-foreground line-through">{formatINR(product.mrp)}</span>
        )}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Star className="size-3 fill-gold text-gold" />
          <span>{product.rating.toFixed(1)}</span>
          <span>({product.rating_count})</span>
        </div>
        <button
          onClick={() =>
            addToCart(
              {
                productId: product.id,
                slug: product.slug,
                name: product.name,
                price: product.price,
                image: product.images[0]?.url ?? "",
              },
              1,
            ) ?? toast.success("Added to cart")
          }
          className="text-[10px] uppercase font-semibold tracking-[0.18em] border-b border-espresso/30 pb-0.5 hover:border-gold hover:text-gold transition-colors"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}
