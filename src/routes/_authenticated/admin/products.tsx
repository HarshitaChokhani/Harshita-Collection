import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Upload, X, Sparkles } from "lucide-react";
import {
  adminListProducts, adminSaveProduct, adminDeleteProduct,
  adminListCategories, adminCreateUploadUrl, adminSignImageUrl, adminAutofillFromImage,
} from "@/lib/admin.functions";

import { formatINR } from "@/lib/format";
import { resolveImage } from "@/lib/asset-map";

export const Route = createFileRoute("/_authenticated/admin/products")({
  head: () => ({ meta: [{ title: "Products — Admin" }] }),
  component: AdminProductsPage,
});

type ColorRow = { name: string; hex: string };
type Form = {
  id?: string;
  name: string; slug: string; description: string; fabric: string;
  material_composition: string; cotton_percentage: string; wash_care: string;
  shipping_info: string; return_policy: string;
  category_id: string; price: string; mrp: string; discount_pct: string; stock: string;
  is_active: boolean; is_featured: boolean; is_new: boolean; is_bestseller: boolean;
  image_urls: string[];
  colors: ColorRow[];
};
const blank: Form = {
  name: "", slug: "", description: "", fabric: "",
  material_composition: "", cotton_percentage: "", wash_care: "",
  shipping_info: "", return_policy: "",
  category_id: "",
  price: "", mrp: "", discount_pct: "", stock: "10",
  is_active: true, is_featured: false, is_new: false, is_bestseller: false,
  image_urls: [], colors: [],
};

function AdminProductsPage() {
  const list = useServerFn(adminListProducts);
  const cats = useServerFn(adminListCategories);
  const save = useServerFn(adminSaveProduct);
  const remove = useServerFn(adminDeleteProduct);
  const upload = useServerFn(adminCreateUploadUrl);
  const signUrl = useServerFn(adminSignImageUrl);
  const autofill = useServerFn(adminAutofillFromImage);
  const qc = useQueryClient();
  const { data: products = [], isLoading } = useQuery({ queryKey: ["admin-products"], queryFn: () => list() });
  const { data: categories = [] } = useQuery({ queryKey: ["admin-categories"], queryFn: () => cats() });
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [autofilling, setAutofilling] = useState(false);

  const onAutofill = async () => {
    if (!form || !form.image_urls.length) return;
    setAutofilling(true);
    try {
      const ai = await autofill({ data: { imageUrl: form.image_urls[0] } });
      setForm((f) => {
        if (!f) return f;
        const keep = (cur: string, next: string) => (cur.trim() ? cur : next);
        return {
          ...f,
          name: keep(f.name, ai.name),
          slug: f.slug || (ai.name ? slugify(ai.name) : f.slug),
          description: keep(f.description, ai.description),
          fabric: keep(f.fabric, ai.fabric),
          material_composition: keep(f.material_composition, ai.material_composition),
          cotton_percentage: f.cotton_percentage || (ai.cotton_percentage ? String(ai.cotton_percentage) : ""),
          wash_care: keep(f.wash_care, ai.wash_care),
          category_id: f.category_id || ai.category_id || "",
          colors: f.colors.length ? f.colors : ai.colors,
        };
      });
      toast.success("Details filled from image — please review before saving");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Autofill failed");
    } finally { setAutofilling(false); }
  };

  const onFiles = async (files: FileList) => {
    if (!form) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
        const { signedUrl, publicUrl } = await upload({ data: { filename: safe } });
        const res = await fetch(signedUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
        if (!res.ok) throw new Error("Upload failed");
        urls.push(publicUrl);
      }
      setForm({ ...form, image_urls: [...form.image_urls, ...urls].slice(0, 15) });
      toast.success(`${urls.length} image(s) uploaded`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally { setUploading(false); }
  };

  const removeImage = (i: number) => form && setForm({ ...form, image_urls: form.image_urls.filter((_, j) => j !== i) });
  const addColor = () => form && setForm({ ...form, colors: [...form.colors, { name: "", hex: "#000000" }] });
  const updateColor = (i: number, patch: Partial<ColorRow>) => form && setForm({
    ...form, colors: form.colors.map((c, j) => (j === i ? { ...c, ...patch } : c)),
  });
  const removeColor = (i: number) => form && setForm({ ...form, colors: form.colors.filter((_, j) => j !== i) });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    try {
      await save({ data: {
        id: form.id,
        name: form.name, slug: form.slug,
        description: form.description || null,
        fabric: form.fabric || null,
        material_composition: form.material_composition || null,
        cotton_percentage: form.cotton_percentage ? Number(form.cotton_percentage) : null,
        wash_care: form.wash_care || null,
        shipping_info: form.shipping_info || null,
        return_policy: form.return_policy || null,
        category_id: form.category_id || null,
        price: Number(form.price),
        mrp: form.mrp ? Number(form.mrp) : null,
        discount_pct: form.discount_pct ? Number(form.discount_pct) : null,
        stock: Number(form.stock),
        is_active: form.is_active, is_featured: form.is_featured,
        is_new: form.is_new, is_bestseller: form.is_bestseller,
        image_urls: form.image_urls,
        colors: form.colors.filter((c) => c.name.trim() && c.hex.trim()),
      }});
      toast.success("Saved");
      setForm(null);
      qc.invalidateQueries({ queryKey: ["admin-products"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally { setSaving(false); }
  };

  const onDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    await remove({ data: { id } });
    qc.invalidateQueries({ queryKey: ["admin-products"] });
    toast.success("Deleted");
  };

  const edit = (p: any) => setForm({
    id: p.id, name: p.name, slug: p.slug,
    description: p.description ?? "", fabric: p.fabric ?? "",
    material_composition: p.material_composition ?? "",
    cotton_percentage: p.cotton_percentage != null ? String(p.cotton_percentage) : "",
    wash_care: p.wash_care ?? "",
    shipping_info: p.shipping_info ?? "",
    return_policy: p.return_policy ?? "",
    category_id: p.category_id ?? "",
    price: String(p.price), mrp: p.mrp != null ? String(p.mrp) : "",
    discount_pct: p.discount_pct != null ? String(p.discount_pct) : "",
    stock: String(p.stock),
    is_active: p.is_active, is_featured: p.is_featured,
    is_new: !!p.is_new, is_bestseller: !!p.is_bestseller,
    image_urls: (p.product_images ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order).map((i: any) => i.url),
    colors: Array.isArray(p.colors) ? p.colors : [],
  });

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-4xl">Products</h1>
        {!form && (
          <button onClick={() => setForm({ ...blank })} className="inline-flex items-center gap-2 bg-espresso text-ivory px-5 py-2.5 text-xs uppercase tracking-[0.25em]">
            <Plus className="size-4" /> Add product
          </button>
        )}
      </div>

      {form && (
        <form onSubmit={onSubmit} className="bg-ivory border border-border p-6 mb-8 space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Name *" value={form.name} onChange={(v) => setForm({ ...form, name: v, slug: form.slug || slugify(v) })} required />
            <Field label="Slug *" value={form.slug} onChange={(v) => setForm({ ...form, slug: v })} required />
            <Field label="Price (₹) *" type="number" value={form.price} onChange={(v) => setForm({ ...form, price: v })} required />
            <Field label="MRP (₹)" type="number" value={form.mrp} onChange={(v) => setForm({ ...form, mrp: v })} />
            <Field label="Discount %" type="number" value={form.discount_pct} onChange={(v) => setForm({ ...form, discount_pct: v })} />
            <Field label="Stock *" type="number" value={form.stock} onChange={(v) => setForm({ ...form, stock: v })} required />
            <div>
              <label className="block text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-1">Category</label>
              <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                className="w-full bg-transparent border border-border px-3 py-2 text-sm">
                <option value="">— None —</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <Field label="Fabric" value={form.fabric} onChange={(v) => setForm({ ...form, fabric: v })} />
            <Field label="Material Composition" value={form.material_composition} onChange={(v) => setForm({ ...form, material_composition: v })} placeholder="e.g. 70% Cotton, 30% Silk" />
            <Field label="Cotton %" type="number" value={form.cotton_percentage} onChange={(v) => setForm({ ...form, cotton_percentage: v })} />
          </div>

          <Textarea label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
          <Textarea label="Wash Care Instructions" rows={2} value={form.wash_care} onChange={(v) => setForm({ ...form, wash_care: v })} placeholder="e.g. Dry clean only. Do not bleach." />
          <Textarea label="Shipping Info (optional)" rows={2} value={form.shipping_info} onChange={(v) => setForm({ ...form, shipping_info: v })} />
          <Textarea label="Return Policy (optional)" rows={2} value={form.return_policy} onChange={(v) => setForm({ ...form, return_policy: v })} />

          {/* Colors */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Available Colors</label>
              <button type="button" onClick={addColor} className="text-[10px] uppercase tracking-[0.2em] text-espresso hover:text-gold">+ Add color</button>
            </div>
            <div className="space-y-2">
              {form.colors.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input type="color" value={c.hex} onChange={(e) => updateColor(i, { hex: e.target.value })} className="size-9 border border-border" />
                  <input value={c.name} onChange={(e) => updateColor(i, { name: e.target.value })} placeholder="Color name (e.g. Royal Blue)" className="flex-1 bg-transparent border border-border px-3 py-2 text-sm" />
                  <input value={c.hex} onChange={(e) => updateColor(i, { hex: e.target.value })} placeholder="#000" className="w-24 bg-transparent border border-border px-2 py-2 text-xs" />
                  <button type="button" onClick={() => removeColor(i)} aria-label="Remove color" className="p-2 text-muted-foreground hover:text-destructive"><X className="size-4" /></button>
                </div>
              ))}
              {form.colors.length === 0 && <p className="text-xs text-muted-foreground">No colors added.</p>}
            </div>
          </div>

          {/* Images */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Product Images ({form.image_urls.length}/15)</label>
              <div className="flex items-center gap-2">
                {form.image_urls.length > 0 && (
                  <button type="button" onClick={onAutofill} disabled={autofilling}
                    className="inline-flex items-center gap-2 border border-gold text-espresso px-4 py-2 text-xs uppercase tracking-[0.2em] hover:bg-gold/10 disabled:opacity-50">
                    <Sparkles className="size-4" />
                    {autofilling ? "Analysing…" : "Autofill from image"}
                  </button>
                )}
                <label className="inline-flex items-center gap-2 border border-border px-4 py-2 text-xs uppercase tracking-[0.2em] cursor-pointer hover:bg-beige/40">
                  <Upload className="size-4" />
                  {uploading ? "Uploading…" : "Upload images"}
                  <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files?.length && onFiles(e.target.files)} />
                </label>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground mb-3">Upload 8–10 images: front, back, side, close-up fabric, sleeve, neck design, full outfit. Then click <span className="text-espresso">Autofill from image</span> to draft the details automatically.</p>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {form.image_urls.map((url, i) => (
                <div key={i} className="relative aspect-square bg-beige border border-border group">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeImage(i)} aria-label="Remove image" className="absolute top-1 right-1 bg-espresso/80 text-ivory rounded-full p-1 opacity-0 group-hover:opacity-100"><X className="size-3" /></button>
                  {i === 0 && <span className="absolute bottom-1 left-1 text-[9px] uppercase tracking-wider bg-gold text-ivory px-1.5 py-0.5">Primary</span>}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            <Checkbox label="Active" v={form.is_active} on={(v) => setForm({ ...form, is_active: v })} />
            <Checkbox label="Featured" v={form.is_featured} on={(v) => setForm({ ...form, is_featured: v })} />
            <Checkbox label="New arrival" v={form.is_new} on={(v) => setForm({ ...form, is_new: v })} />
            <Checkbox label="Best seller" v={form.is_bestseller} on={(v) => setForm({ ...form, is_bestseller: v })} />
          </div>

          <div className="flex gap-3 pt-2 border-t border-border">
            <button type="submit" disabled={saving} className="bg-espresso text-ivory px-8 py-3 text-xs uppercase tracking-[0.25em] disabled:opacity-50">
              {saving ? "Saving…" : "Save Product"}
            </button>
            <button type="button" onClick={() => setForm(null)} className="px-8 py-3 text-xs uppercase tracking-[0.25em] border border-border">Cancel</button>
          </div>
        </form>
      )}

      {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
        <div className="bg-ivory border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-beige/40 text-left text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <tr>
                <th className="p-3">Product</th>
                <th className="p-3">Price</th>
                <th className="p-3">Stock</th>
                <th className="p-3">Status</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.map((p: any) => (
                <tr key={p.id} className="hover:bg-beige/20">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <img src={resolveImage(p.product_images?.[0]?.url)} alt="" className="w-10 h-12 object-cover bg-beige" />
                      <div>
                        <p className="font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.categories?.name ?? "—"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">{formatINR(Number(p.price))}</td>
                  <td className="p-3"><span className={p.stock <= 5 ? "text-destructive font-medium" : ""}>{p.stock}</span></td>
                  <td className="p-3">
                    <span className={`text-[10px] uppercase tracking-[0.2em] ${p.is_active ? "text-gold" : "text-muted-foreground"}`}>
                      {p.is_active ? "Active" : "Draft"}
                    </span>
                  </td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <button onClick={() => edit(p)} className="text-espresso hover:text-gold p-1.5" aria-label="Edit"><Pencil className="size-4" /></button>
                    <button onClick={() => onDelete(p.id)} className="text-muted-foreground hover:text-destructive p-1.5" aria-label="Delete"><Trash2 className="size-4" /></button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No products yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function Field({ label, value, onChange, type = "text", required, placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; placeholder?: string }) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-1">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} placeholder={placeholder}
        className="w-full bg-transparent border border-border px-3 py-2 text-sm focus:outline-none focus:border-gold" />
    </div>
  );
}
function Textarea({ label, value, onChange, rows = 3, placeholder }: { label: string; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-1">{label}</label>
      <textarea rows={rows} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-transparent border border-border px-3 py-2 text-sm focus:outline-none focus:border-gold" />
    </div>
  );
}
function Checkbox({ label, v, on }: { label: string; v: boolean; on: (v: boolean) => void }) {
  return <label className="inline-flex items-center gap-2"><input type="checkbox" checked={v} onChange={(e) => on(e.target.checked)} /> {label}</label>;
}
function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
