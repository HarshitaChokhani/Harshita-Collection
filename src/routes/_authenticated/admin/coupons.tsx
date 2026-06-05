import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Pencil } from "lucide-react";
import { adminListCoupons, adminSaveCoupon, adminDeleteCoupon } from "@/lib/admin.functions";
import { formatINR } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/coupons")({
  head: () => ({ meta: [{ title: "Coupons — Admin" }] }),
  component: AdminCouponsPage,
});

type Form = {
  id?: string; code: string; description: string;
  discount_type: "percent" | "flat"; discount_value: string;
  min_order: string; max_discount: string; is_active: boolean;
};
const blank: Form = { code: "", description: "", discount_type: "percent", discount_value: "10", min_order: "0", max_discount: "", is_active: true };

function AdminCouponsPage() {
  const list = useServerFn(adminListCoupons);
  const save = useServerFn(adminSaveCoupon);
  const remove = useServerFn(adminDeleteCoupon);
  const qc = useQueryClient();
  const { data: coupons = [], isLoading } = useQuery({ queryKey: ["admin-coupons"], queryFn: () => list() });
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    try {
      await save({ data: {
        id: form.id,
        code: form.code, description: form.description || null,
        discount_type: form.discount_type, discount_value: Number(form.discount_value),
        min_order: Number(form.min_order || 0),
        max_discount: form.max_discount ? Number(form.max_discount) : null,
        is_active: form.is_active,
      }});
      toast.success("Saved");
      setForm(null);
      qc.invalidateQueries({ queryKey: ["admin-coupons"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally { setSaving(false); }
  };

  const onDelete = async (id: string) => {
    if (!confirm("Delete this coupon?")) return;
    await remove({ data: { id } });
    qc.invalidateQueries({ queryKey: ["admin-coupons"] });
    toast.success("Deleted");
  };

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-4xl">Coupons</h1>
        {!form && (
          <button onClick={() => setForm({ ...blank })} className="inline-flex items-center gap-2 bg-espresso text-ivory px-5 py-2.5 text-xs uppercase tracking-[0.25em]">
            <Plus className="size-4" /> Add coupon
          </button>
        )}
      </div>

      {form && (
        <form onSubmit={onSubmit} className="bg-ivory border border-border p-6 mb-8 grid sm:grid-cols-2 gap-4">
          <F label="Code *" value={form.code} onChange={(v) => setForm({ ...form, code: v.toUpperCase() })} required />
          <F label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
          <div>
            <label className="block text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-1">Type</label>
            <select value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value as any })}
              className="w-full bg-transparent border border-border px-3 py-2 text-sm">
              <option value="percent">Percent (%)</option>
              <option value="flat">Flat (₹)</option>
            </select>
          </div>
          <F label="Value *" type="number" value={form.discount_value} onChange={(v) => setForm({ ...form, discount_value: v })} required />
          <F label="Min order (₹)" type="number" value={form.min_order} onChange={(v) => setForm({ ...form, min_order: v })} />
          <F label="Max discount (₹)" type="number" value={form.max_discount} onChange={(v) => setForm({ ...form, max_discount: v })} />
          <label className="inline-flex items-center gap-2 sm:col-span-2 text-sm">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Active
          </label>
          <div className="sm:col-span-2 flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="bg-espresso text-ivory px-8 py-3 text-xs uppercase tracking-[0.25em] disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>
            <button type="button" onClick={() => setForm(null)} className="px-8 py-3 text-xs uppercase tracking-[0.25em] border border-border">Cancel</button>
          </div>
        </form>
      )}

      {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
        <div className="bg-ivory border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-beige/40 text-left text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <tr>
                <th className="p-3">Code</th>
                <th className="p-3">Discount</th>
                <th className="p-3">Min order</th>
                <th className="p-3">Status</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {coupons.map((c: any) => (
                <tr key={c.id}>
                  <td className="p-3 font-mono font-medium">{c.code}<br/><span className="text-xs text-muted-foreground font-sans">{c.description}</span></td>
                  <td className="p-3">{c.discount_type === "percent" ? `${c.discount_value}%` : formatINR(Number(c.discount_value))}</td>
                  <td className="p-3">{formatINR(Number(c.min_order))}</td>
                  <td className="p-3"><span className={`text-[10px] uppercase tracking-[0.2em] ${c.is_active ? "text-gold" : "text-muted-foreground"}`}>{c.is_active ? "Active" : "Off"}</span></td>
                  <td className="p-3 text-right">
                    <button onClick={() => setForm({
                      id: c.id, code: c.code, description: c.description ?? "",
                      discount_type: c.discount_type, discount_value: String(c.discount_value),
                      min_order: String(c.min_order ?? 0),
                      max_discount: c.max_discount ? String(c.max_discount) : "",
                      is_active: c.is_active,
                    })} className="text-espresso hover:text-gold p-1.5"><Pencil className="size-4" /></button>
                    <button onClick={() => onDelete(c.id)} className="text-muted-foreground hover:text-destructive p-1.5"><Trash2 className="size-4" /></button>
                  </td>
                </tr>
              ))}
              {coupons.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No coupons.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function F({ label, value, onChange, type = "text", required }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean }) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-1">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required}
        className="w-full bg-transparent border border-border px-3 py-2 text-sm focus:outline-none focus:border-gold" />
    </div>
  );
}
