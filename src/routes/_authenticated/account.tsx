import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LogOut, MapPin, User as UserIcon, Heart, ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getProfile, updateProfile } from "@/lib/account.functions";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({ meta: [{ title: "My Account — Harshita Collection" }] }),
  component: AccountPage,
});

function AccountPage() {
  const fetchProfile = useServerFn(getProfile);
  const saveProfile = useServerFn(updateProfile);
  const qc = useQueryClient();
  const router = useRouter();
  const navigate = useNavigate();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: () => fetchProfile(),
  });

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setPhone(profile.phone ?? "");
    }
  }, [profile]);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveProfile({ data: { full_name: fullName, phone } });
      toast.success("Profile updated");
      qc.invalidateQueries({ queryKey: ["profile"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save profile");
    } finally {
      setSaving(false);
    }
  };

  const onSignOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
    router.invalidate();
  };

  return (
    <main className="max-w-5xl mx-auto px-4 py-12 sm:py-16">
      <header className="mb-10">
        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Harshita Collection</p>
        <h1 className="font-display text-4xl sm:text-5xl mt-2">My Account</h1>
      </header>

      <div className="grid sm:grid-cols-4 gap-3 mb-10">
        <Link to="/account" className="border border-gold bg-beige/30 p-4 text-xs uppercase tracking-[0.18em] flex items-center gap-2">
          <UserIcon className="size-4" /> Profile
        </Link>
        <Link to="/addresses" className="border border-border p-4 text-xs uppercase tracking-[0.18em] flex items-center gap-2 hover:border-gold">
          <MapPin className="size-4" /> Addresses
        </Link>
        <Link to="/wishlist" className="border border-border p-4 text-xs uppercase tracking-[0.18em] flex items-center gap-2 hover:border-gold">
          <Heart className="size-4" /> Wishlist
        </Link>
        <Link to="/cart" className="border border-border p-4 text-xs uppercase tracking-[0.18em] flex items-center gap-2 hover:border-gold">
          <ShoppingBag className="size-4" /> Cart
        </Link>
      </div>

      <section className="bg-ivory border border-border p-6 sm:p-10 max-w-2xl">
        <h2 className="font-display text-2xl mb-6">Personal details</h2>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <form onSubmit={onSave} className="space-y-5">
            <div>
              <label className="block text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">Full name</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} required maxLength={80}
                className="w-full bg-transparent border border-border px-4 py-3 text-sm focus:outline-none focus:border-gold" />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">Phone</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} placeholder="+91"
                className="w-full bg-transparent border border-border px-4 py-3 text-sm focus:outline-none focus:border-gold" />
            </div>
            <div className="flex gap-3 items-center pt-2">
              <button type="submit" disabled={saving}
                className="bg-espresso text-ivory px-8 py-3 text-xs uppercase tracking-[0.25em] disabled:opacity-50">
                {saving ? "Saving…" : "Save changes"}
              </button>
              <button type="button" onClick={onSignOut}
                className="ml-auto inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-espresso">
                <LogOut className="size-4" /> Sign out
              </button>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}
