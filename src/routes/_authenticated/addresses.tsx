import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Star } from "lucide-react";
import { listAddresses, saveAddress, deleteAddress } from "@/lib/account.functions";

export const Route = createFileRoute("/addresses")({
  head: () => ({ meta: [{ title: "Addresses — Harshita Collection" }] }),
  component: AddressesPage,
});

type AddressForm = {
  id?: string;
  label: string;
  full_name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  is_default: boolean;
};

const empty: AddressForm = {
  label: "Home", full_name: "", phone: "", line1: "", line2: "",
  city: "", state: "", pincode: "", country: "India", is_default: false,
};

function AddressesPage() {
  const fetchList = useServerFn(listAddresses);
  const save = useServerFn(saveAddress);
  const remove = useServerFn(deleteAddress);
  const qc = useQueryClient();
  const { data: addresses = [], isLoading } = useQuery({ queryKey: ["addresses"], queryFn: () => fetchList() });
  const [form, setForm] = useState<AddressForm | null>(null);
  const [saving, setSaving] = useState(false);

  const onChange = (k: keyof AddressForm, v: string | boolean) => setForm((f) => f ? { ...f, [k]: v } : f);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    try {
      await save({ data: { ...form, label: form.label || null, line2: form.line2 || null } });
      toast.success("Address saved");
      setForm(null);
      qc.invalidateQueries({ queryKey: ["addresses"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally { setSaving(false); }
  };

  const onDelete = async (id: string) => {
    if (!confirm("Delete this address?")) return;
    await remove({ data: { id } });
    qc.invalidateQueries({ queryKey: ["addresses"] });
    toast.success("Address removed");
  };

  return (
    <main className="max-w-5xl mx-auto px-4 py-12 sm:py-16">
      <div className="flex items-end justify-between mb-8 gap-4 flex-wrap">
        <div>
          <Link to="/account" className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground hover:text-gold">← Account</Link>
          <h1 className="font-display text-4xl sm:text-5xl mt-2">Addresses</h1>
        </div>
        {!form && (
          <button onClick={() => setForm({ ...empty })}
            className="inline-flex items-center gap-2 bg-espresso text-ivory px-5 py-3 text-xs uppercase tracking-[0.25em]">
            <Plus className="size-4" /> Add address
          </button>
        )}
      </div>

      {form && (
        <form onSubmit={onSubmit} className="bg-ivory border border-border p-6 sm:p-8 mb-8 grid sm:grid-cols-2 gap-4">
          {[
            ["label", "Label (Home, Office)", false],
            ["full_name", "Full name *", true],
            ["phone", "Phone *", true],
            ["line1", "Address line 1 *", true],
            ["line2", "Address line 2", false],
            ["city", "City *", true],
            ["state", "State *", true],
            ["pincode", "Pincode *", true],
            ["country", "Country *", true],
          ].map(([k, label, req]) => (
            <div key={k as string} className={k === "line1" || k === "line2" ? "sm:col-span-2" : ""}>
              <label className="block text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">{label as string}</label>
              <input
                value={form[k as keyof AddressForm] as string}
                onChange={(e) => onChange(k as keyof AddressForm, e.target.value)}
                required={req as boolean}
                className="w-full bg-transparent border border-border px-4 py-2.5 text-sm focus:outline-none focus:border-gold"
              />
            </div>
          ))}
          <label className="sm:col-span-2 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_default} onChange={(e) => onChange("is_default", e.target.checked)} />
            Set as default shipping address
          </label>
          <div className="sm:col-span-2 flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="bg-espresso text-ivory px-8 py-3 text-xs uppercase tracking-[0.25em] disabled:opacity-50">
              {saving ? "Saving…" : "Save address"}
            </button>
            <button type="button" onClick={() => setForm(null)} className="px-8 py-3 text-xs uppercase tracking-[0.25em] border border-border">Cancel</button>
          </div>
        </form>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : addresses.length === 0 && !form ? (
        <div className="text-center py-16 border border-dashed border-border">
          <p className="text-muted-foreground">No addresses saved yet.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {addresses.map((a) => (
            <div key={a.id} className="bg-ivory border border-border p-5 relative">
              {a.is_default && (
                <span className="absolute top-3 right-3 inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-gold">
                  <Star className="size-3 fill-gold" /> Default
                </span>
              )}
              {a.label && <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-1">{a.label}</p>}
              <p className="font-medium">{a.full_name}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {a.line1}{a.line2 ? `, ${a.line2}` : ""}<br />
                {a.city}, {a.state} {a.pincode}<br />
                {a.country} · {a.phone}
              </p>
              <div className="flex gap-3 mt-4 text-xs uppercase tracking-[0.2em]">
                <button onClick={() => setForm({
                  id: a.id, label: a.label ?? "", full_name: a.full_name, phone: a.phone,
                  line1: a.line1, line2: a.line2 ?? "", city: a.city, state: a.state,
                  pincode: a.pincode, country: a.country, is_default: a.is_default,
                })} className="text-espresso hover:text-gold">Edit</button>
                <button onClick={() => onDelete(a.id)} className="text-muted-foreground hover:text-destructive inline-flex items-center gap-1">
                  <Trash2 className="size-3" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
