import { useEffect } from "react";
import { X, MessageCircle } from "lucide-react";
import { CONTACT, waLink } from "@/lib/contact";

const SIZES = [
  { size: "S", bust: 34, waist: 28, hip: 36 },
  { size: "M", bust: 36, waist: 30, hip: 38 },
  { size: "L", bust: 38, waist: 32, hip: 40 },
  { size: "XL", bust: 40, waist: 34, hip: 42 },
  { size: "XXL", bust: 42, waist: 36, hip: 44 },
];

export function SizeChart({ open, onClose, productName }: { open: boolean; onClose: () => void; productName?: string }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizeHelp = waLink(
    `Hi ${CONTACT.brand}, I need help choosing the right size${productName ? ` for "${productName}"` : ""}. My measurements are: Bust __ in, Waist __ in, Hip __ in.`,
  );

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center px-4">
      <div className="absolute inset-0 bg-espresso/70 backdrop-blur-sm" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label="Size chart"
        className="relative bg-ivory w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-ivory border-b border-border px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl">Size Chart</h2>
            <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mt-1">All measurements in inches</p>
          </div>
          <button onClick={onClose} aria-label="Close size chart" className="p-2 hover:bg-beige/50">
            <X className="size-5" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-border">
              <thead className="bg-beige/40 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                <tr>
                  <th className="p-3 text-left">Size</th>
                  <th className="p-3">Bust</th>
                  <th className="p-3">Waist</th>
                  <th className="p-3">Hip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-center">
                {SIZES.map((r) => (
                  <tr key={r.size} className="hover:bg-beige/20">
                    <td className="p-3 text-left font-medium">{r.size}</td>
                    <td className="p-3">{r.bust}"</td>
                    <td className="p-3">{r.waist}"</td>
                    <td className="p-3">{r.hip}"</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <h3 className="font-display text-lg mb-3">How to Measure</h3>
            <ul className="text-sm space-y-2 text-muted-foreground leading-relaxed">
              <li><strong className="text-foreground">Bust:</strong> Measure around the fullest part of your bust, keeping the tape parallel to the floor.</li>
              <li><strong className="text-foreground">Waist:</strong> Measure around the narrowest part of your waist, just above the navel.</li>
              <li><strong className="text-foreground">Hip:</strong> Measure around the fullest part of your hips, about 8 inches below the waist.</li>
              <li>Hold the tape snug, not tight. Wear light clothing for the most accurate fit.</li>
            </ul>
          </div>

          <div className="bg-blush p-5 border border-gold/20">
            <h3 className="font-display text-lg mb-2">Size Recommendation</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Between two sizes? We recommend sizing up for a relaxed fit, or stay true-to-size for a tailored silhouette.
              Most kurtis and suits are stitched with a slight allowance for comfort.
            </p>
            <a href={sizeHelp} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366] text-white px-5 py-2.5 text-xs uppercase tracking-[0.2em] hover:opacity-90">
              <MessageCircle className="size-4" /> Need Help Choosing Size?
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
