import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Star, Check, X, Trash2 } from "lucide-react";
import { adminListReviews, adminModerateReview, adminDeleteReview } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/reviews")({
  head: () => ({ meta: [{ title: "Reviews — Admin" }] }),
  component: AdminReviewsPage,
});

function AdminReviewsPage() {
  const list = useServerFn(adminListReviews);
  const moderate = useServerFn(adminModerateReview);
  const remove = useServerFn(adminDeleteReview);
  const qc = useQueryClient();
  const { data: reviews = [], isLoading } = useQuery({ queryKey: ["admin-reviews"], queryFn: () => list() });

  const act = async (id: string, status: "approved" | "rejected" | "pending") => {
    try { await moderate({ data: { id, status } }); toast.success(`Marked ${status}`); qc.invalidateQueries({ queryKey: ["admin-reviews"] }); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };
  const del = async (id: string) => {
    if (!confirm("Delete this review?")) return;
    await remove({ data: { id } }); toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-reviews"] });
  };

  return (
    <>
      <h1 className="font-display text-4xl mb-8">Reviews</h1>
      {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground bg-ivory border border-border p-8 text-center">No reviews yet.</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((r: any) => (
            <div key={r.id} className="bg-ivory border border-border p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`size-3.5 ${i < r.rating ? "fill-gold text-gold" : "text-muted-foreground/40"}`} />
                    ))}
                    <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground ml-2">{r.products?.name ?? "—"}</span>
                  </div>
                  {r.title && <p className="font-medium text-sm">{r.title}</p>}
                  {r.body && <p className="text-sm text-muted-foreground mt-1">{r.body}</p>}
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-2">
                    {r.profiles?.full_name ?? "Anonymous"} · {new Date(r.created_at).toLocaleDateString("en-IN")} ·
                    <span className={`ml-1 ${r.status === "approved" ? "text-gold" : r.status === "rejected" ? "text-destructive" : ""}`}>{r.status}</span>
                  </p>
                </div>
                <div className="flex gap-1">
                  {r.status !== "approved" && (
                    <button onClick={() => act(r.id, "approved")} aria-label="Approve" className="p-2 border border-border hover:border-gold hover:text-gold"><Check className="size-4" /></button>
                  )}
                  {r.status !== "rejected" && (
                    <button onClick={() => act(r.id, "rejected")} aria-label="Reject" className="p-2 border border-border hover:border-destructive hover:text-destructive"><X className="size-4" /></button>
                  )}
                  <button onClick={() => del(r.id)} aria-label="Delete" className="p-2 border border-border hover:border-destructive text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
