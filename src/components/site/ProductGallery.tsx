import { useEffect, useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { resolveImage } from "@/lib/asset-map";
import type { ProductImage } from "@/lib/types";

interface Props {
  images: ProductImage[];
  startIndex: number;
  open: boolean;
  onClose: () => void;
  productName: string;
}

export function ProductGallery({ images, startIndex, open, onClose, productName }: Props) {
  const [idx, setIdx] = useState(startIndex);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; baseX: number; baseY: number } | null>(null);
  const touchStartRef = useRef<{ x: number; t: number } | null>(null);

  useEffect(() => { if (open) setIdx(startIndex); }, [open, startIndex]);
  useEffect(() => { setZoom(1); setPan({ x: 0, y: 0 }); }, [idx]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "+" || e.key === "=") setZoom((z) => Math.min(z + 0.5, 4));
      if (e.key === "-") setZoom((z) => Math.max(1, z - 0.5));
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, idx]); // eslint-disable-line

  if (!open || images.length === 0) return null;

  const prev = () => setIdx((i) => (i - 1 + images.length) % images.length);
  const next = () => setIdx((i) => (i + 1) % images.length);

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => Math.min(4, Math.max(1, z + (e.deltaY > 0 ? -0.2 : 0.2))));
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    dragRef.current = { startX: e.clientX, startY: e.clientY, baseX: pan.x, baseY: pan.y };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current) return;
    setPan({ x: dragRef.current.baseX + e.clientX - dragRef.current.startX, y: dragRef.current.baseY + e.clientY - dragRef.current.startY });
  };
  const onMouseUp = () => { dragRef.current = null; };

  const onTouchStart = (e: React.TouchEvent) => {
    if (zoom > 1) return;
    touchStartRef.current = { x: e.touches[0].clientX, t: Date.now() };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dt = Date.now() - touchStartRef.current.t;
    touchStartRef.current = null;
    if (dt < 600 && Math.abs(dx) > 60) (dx < 0 ? next : prev)();
  };

  const img = images[idx];

  return (
    <div className="fixed inset-0 z-[90] bg-espresso/95 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 text-ivory/90">
        <div>
          <p className="text-sm font-medium truncate max-w-[60vw]">{productName}</p>
          <p className="text-[10px] uppercase tracking-[0.25em] text-ivory/60">{idx + 1} / {images.length}</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setZoom((z) => Math.max(1, z - 0.5))} aria-label="Zoom out" className="p-2 hover:bg-ivory/10 rounded"><ZoomOut className="size-5" /></button>
          <button onClick={() => setZoom((z) => Math.min(4, z + 0.5))} aria-label="Zoom in" className="p-2 hover:bg-ivory/10 rounded"><ZoomIn className="size-5" /></button>
          <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} aria-label="Reset zoom" className="p-2 hover:bg-ivory/10 rounded"><RotateCcw className="size-5" /></button>
          <button onClick={onClose} aria-label="Close gallery" className="p-2 hover:bg-ivory/10 rounded ml-2"><X className="size-6" /></button>
        </div>
      </div>

      {/* Main viewer */}
      <div
        className="flex-1 relative overflow-hidden"
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <button onClick={prev} aria-label="Previous image"
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-3 bg-ivory/10 hover:bg-ivory/20 text-ivory rounded-full backdrop-blur">
          <ChevronLeft className="size-6" />
        </button>
        <button onClick={next} aria-label="Next image"
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-3 bg-ivory/10 hover:bg-ivory/20 text-ivory rounded-full backdrop-blur">
          <ChevronRight className="size-6" />
        </button>

        <div className="w-full h-full grid place-items-center select-none" style={{ cursor: zoom > 1 ? (dragRef.current ? "grabbing" : "grab") : "default" }}>
          <img
            src={resolveImage(img.url)}
            alt={img.alt ?? `${productName} — view ${idx + 1}`}
            draggable={false}
            className="max-w-full max-h-full object-contain transition-transform duration-200"
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
          />
        </div>
      </div>

      {/* Thumbnail rail */}
      {images.length > 1 && (
        <div className="bg-espresso/80 border-t border-ivory/10 px-4 py-3 overflow-x-auto">
          <div className="flex gap-2 justify-center min-w-min">
            {images.map((im, i) => (
              <button key={i} onClick={() => setIdx(i)} aria-label={`View image ${i + 1}`}
                className={`shrink-0 size-16 sm:size-20 overflow-hidden border-2 transition ${i === idx ? "border-gold" : "border-transparent opacity-60 hover:opacity-100"}`}>
                <img src={resolveImage(im.url)} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
