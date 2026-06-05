import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Upload } from "lucide-react";
import {
  adminListProducts, adminSaveProduct, adminDeleteProduct,
  adminListCategories, adminCreateUploadUrl,
} from "@/lib/admin.functions";
import { formatINR } from "@/lib/format";
import { resolveImage } from "@/lib/asset-map";

export const Route = createFileRoute("/_authenticated/admin/products")({
  head: () => ({ meta: [{ title: "Products — Admin" }] }),
  component: AdminProductsPage,
});

type Form = {
  id?: string;
  name: string; slug: string; description: string; fabric: string;
  category_id: string; price: string; mrp: string; discount_pct: string; stock: string;
  is_active: boolean; is_featured: boolean; is_new: boolean; is_bestseller: boolean;
  image_url: string;
};
const blank: Form = {
  name: "", slug: "", description: "", fabric: "", category_id: "",
  price: "", mrp: "", discount_pct: "", stock: "10",
  is_active: true, is_featured: false, is_new: false, is_bestseller: false,
  image_url: "",
};

function AdminProductsPage() {
  const list = useServerFn(adminListProducts);
  const cats = useServerFn(adminListCategories);
  const save = useServerFn(adminSaveProduct);
  const remove = useServerFn(adminDeleteProduct);
  const upload = useServerFn(adminCreateUploadUrl);
  const qc = useQueryClient();
  const { data: products = [], isLoading } = useQuery({ queryKey: ["admin-products"], queryFn: () => list() });
  const { data: categories = [] } = useQuery({ queryKey: ["admin-categories"], queryFn: () => cats() });
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const onFile = async (file: File) => {
    if (!form) return;
    setUploading(true);
    try {
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const { signedUrl, publicUrl } = await upload({ data: { filename: safe } });
      const res = await fetch(signedUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      if (!res.ok) throw new Error("Upload failed");
      setForm({ ...form, image_url: publicUrl });
      toast.success("Image uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally { setUploading(false); }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    try {
      await save({ data: {
        id: form.id,
        name: form.name, slug: form.slug,
        description: form.description || null, fabric: form.fabric || null,
        category_id: form.category_id || null,
        price: Number(form.price),
        mrp: form.mrp ? Number(form.mrp) : null,
        discount_pct: form.discount_pct ? Number(form.discount_pct) : null,
        stock: Number(form.stock),
        is_active: form.is_active, is_featured: form.is_featured,
        is_new: form.is_new, is_bestseller: form.is_bestseller,
        image_url: form.image_url || null,
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
        <form onSubmit={onSubmit} className="bg-ivory border border-border p-6 mb-8 grid sm:grid-cols-2 gap-4">
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
          <div className="sm:col-span-2">
            <label className="block text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-1">Description</label>
            <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-transparent border border-border px-3 py-2 text-sm" />
          </div>
          <div className="sm:col-span-2 grid sm:grid-cols-[1fr_auto] gap-3 items-end">
            <div>
              <label className="block text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-1">Image URL</label>
              <input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                placeholder="Upload or paste URL"
                className="w-full bg-transparent border border-border px-3 py-2 text-sm" />
            </div>
            <label className="inline-flex items-center gap-2 border border-border px-4 py-2 text-xs uppercase tracking-[0.2em] cursor-pointer hover:bg-beige/40">
              <Upload className="size-4" />
              {uploading ? "Uploading…" : "Upload"}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
            </label>
          </div>
          {form.image_url && <img src={form.image_url} alt="" className="sm:col-span-2 w-32 h-40 object-cover bg-beige border border-border" />}
          <div className="sm:col-span-2 flex flex-wrap gap-4 text-sm">
            <Checkbox label="Active" v={form.is_active} on={(v) => setForm({ ...form, is_active: v })} />
            <Checkbox label="Featured" v={form.is_featured} on={(v) => setForm({ ...form, is_featured: v })} />
            <Checkbox label="New arrival" v={form.is_new} on={(v) => setForm({ ...form, is_new: v })} />
            <Checkbox label="Best seller" v={form.is_bestseller} on={(v) => setForm({ ...form, is_bestseller: v })} />
          </div>
          <div className="sm:col-span-2 flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="bg-espresso text-ivory px-8 py-3 text-xs uppercase tracking-[0.25em] disabled:opacity-50">
              {saving ? "Saving…" : "Save"}
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
                  <td className="p-3">{p.stock}</td>
                  <td className="p-3">
                    <span className={`text-[10px] uppercase tracking-[0.2em] ${p.is_active ? "text-gold" : "text-muted-foreground"}`}>
                      {p.is_active ? "Active" : "Draft"}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button onClick={() => setForm({
                      id: p.id, name: p.name, slug: p.slug,
                      description: "", fabric: "",
                      category_id: p.category_id ?? "",
                      price: String(p.price), mrp: "", discount_pct: "",
                      stock: String(p.stock),
                      is_active: p.is_active, is_featured: p.is_featured, is_new: false, is_bestseller: false,
                      image_url: p.product_images?.[0]?.url ?? "",
                    })} className="text-espresso hover:text-gold p-1.5" aria-label="Edit"><Pencil className="size-4" /></button>
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

function Field({ label, value, onChange, type = "text", required }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean }) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-1">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required}
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
