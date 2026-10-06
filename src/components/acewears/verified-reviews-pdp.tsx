"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Star, BadgeCheck, ImageIcon, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/lib/stores/auth-store";
import { toast } from "sonner";

type ReviewSummary = {
  avg: number;
  count: number;
  buckets: Record<number, number>;
  topTags: { tag: string; count: number }[];
  reviews: Array<{
    id: string;
    rating: number;
    title?: string | null;
    body: string;
    fitTags: string;
    createdAt: string;
    isVerified: boolean;
    helpfulCount: number;
    user: { name: string | null };
    photos: { url: string }[];
  }>;
};

const TAG_LABELS: Record<string, string> = {
  fit_true_to_size: "Fit true to size",
  runs_small: "Runs small",
  runs_large: "Runs large",
  quality_high: "Quality high",
  quality_poor: "Quality poor",
  would_recommend: "Would recommend",
};

export function VerifiedReviewsPdp({ productId }: { productId: string }) {
  const user = useAuthStore((s) => s.user);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  // Submit form state
  const [showForm, setShowForm] = useState(false);
  const [orderItemId, setOrderItemId] = useState("");
  const [reviewableItems, setReviewableItems] = useState<{ id: string; product: { title: string; slug: string } }[]>([]);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [fitTags, setFitTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Has the user already reviewed THIS product?
  const userHasReviewedThisProduct = !!user && summary?.reviews.some(r => r.user.name === user.name);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${productId}/reviews`);
      const json = await res.json();
      if (json.ok) setSummary(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load();   }, [productId]);

  // Load reviewable items for the user
  useEffect(() => {
    if (!user) return;
    fetch(`/api/me/reviewable-items?userId=${user.id}`)
      .then(r => r.json())
      .then(j => { if (j.ok) setReviewableItems(j.data); });
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error("Sign in to submit a review"); return; }
    if (!orderItemId) { toast.error("Select the order item you're reviewing"); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-acewears-role": user.role },
        body: JSON.stringify({
          userId: user.id,
          orderItemId,
          rating,
          title,
          body,
          fitTags: fitTags.join(","),
          photoUrls: [],
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Failed");
      toast.success("Review submitted — verified buyer badge applied");
      setShowForm(false);
      setTitle(""); setBody(""); setFitTags([]); setOrderItemId("");
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!summary || summary.count === 0) {
    return (
      <div className="space-y-3">
        <h3 className="text-base font-semibold text-navy">Reviews</h3>
        <div className="rounded-xl border border-dashed border-border p-6 text-center">
          <Star className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No reviews yet — be the first verified buyer.</p>
          {user && reviewableItems.length > 0 && !showForm && (
            <Button className="mt-3" onClick={() => setShowForm(true)}>Write a review</Button>
          )}
          {user && reviewableItems.length === 0 && !userHasReviewedThisProduct && (
            <p className="mt-2 text-xs text-muted-foreground">Purchase and receive this item to unlock review eligibility.</p>
          )}
          {user && reviewableItems.length === 0 && userHasReviewedThisProduct && (
            <p className="mt-2 flex items-center justify-center gap-1 text-xs text-teal">
              <BadgeCheck className="h-3.5 w-3.5" /> You&apos;ve already reviewed this product.
            </p>
          )}
        </div>

        {showForm && (
          <ReviewForm
            reviewableItems={reviewableItems}
            orderItemId={orderItemId} setOrderItemId={setOrderItemId}
            rating={rating} setRating={setRating}
            title={title} setTitle={setTitle}
            body={body} setBody={setBody}
            fitTags={fitTags} setFitTags={setFitTags}
            submitting={submitting}
            onSubmit={handleSubmit}
            onCancel={() => setShowForm(false)}
          />
        )}
      </div>
    );
  }

  const visibleReviews = activeFilter
    ? summary.reviews.filter(r => r.fitTags.includes(activeFilter))
    : summary.reviews;

  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-navy">
        Reviews <span className="text-muted-foreground">({summary.count})</span>
      </h3>

      {/* Aggregate */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[160px_1fr]">
        <div className="flex flex-col items-center justify-center rounded-xl bg-muted/40 p-4 text-center">
          <span className="text-4xl font-bold text-navy">{summary.avg.toFixed(1)}</span>
          <div className="mt-1 flex gap-0.5">
            {[1,2,3,4,5].map(s => (
              <Star key={s} className={`h-4 w-4 ${s <= Math.round(summary.avg) ? "fill-amber text-amber" : "text-muted-foreground"}`} />
            ))}
          </div>
          <span className="mt-1 text-xs text-muted-foreground">{summary.count} verified</span>
        </div>

        {/* Buckets */}
        <div className="space-y-1">
          {[5,4,3,2,1].map(star => {
            const count = summary.buckets[star] || 0;
            const pct = (count / summary.count) * 100;
            return (
              <div key={star} className="flex items-center gap-2">
                <span className="w-12 text-xs text-muted-foreground">{star} star</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className="h-full rounded-full bg-amber"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6 }}
                  />
                </div>
                <span className="w-8 text-right text-xs text-muted-foreground">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter chips */}
      {summary.topTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Filter:</span>
          <button
            onClick={() => setActiveFilter(null)}
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition ${
              !activeFilter ? "bg-navy text-white" : "bg-muted text-navy hover:bg-muted/70"
            }`}
          >
            All
          </button>
          {summary.topTags.map(t => (
            <button
              key={t.tag}
              onClick={() => setActiveFilter(t.tag)}
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition ${
                activeFilter === t.tag ? "bg-navy text-white" : "bg-muted text-navy hover:bg-muted/70"
              }`}
            >
              {TAG_LABELS[t.tag] || t.tag} · {t.count}
            </button>
          ))}
        </div>
      )}

      {/* Write a review */}
      {user && reviewableItems.length > 0 && !showForm && (
        <Button onClick={() => setShowForm(true)} variant="outline">Write a review</Button>
      )}
      {user && reviewableItems.length === 0 && !userHasReviewedThisProduct && (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
          <Lock className="h-3.5 w-3.5" />
          Reviews are gated to verified buyers — purchase and receive this product to unlock.
        </div>
      )}
      {user && reviewableItems.length === 0 && userHasReviewedThisProduct && (
        <div className="flex items-center gap-2 rounded-lg border border-teal/30 bg-teal/5 p-3 text-xs text-teal">
          <BadgeCheck className="h-3.5 w-3.5" />
          You&apos;ve already reviewed this product. Thank you for being a verified buyer.
        </div>
      )}

      {/* Submit form */}
      {showForm && (
        <ReviewForm
          reviewableItems={reviewableItems}
          orderItemId={orderItemId} setOrderItemId={setOrderItemId}
          rating={rating} setRating={setRating}
          title={title} setTitle={setTitle}
          body={body} setBody={setBody}
          fitTags={fitTags} setFitTags={setFitTags}
          submitting={submitting}
          onSubmit={handleSubmit}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Review list */}
      <ul className="space-y-4">
        {visibleReviews.map(review => (
          <li key={review.id} className="rounded-xl border border-border p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-navy">{review.user.name || "Anonymous"}</span>
                  {review.isVerified && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-teal/10 px-1.5 py-0.5 text-[10px] font-bold text-teal">
                      <BadgeCheck className="h-3 w-3" /> VERIFIED BUYER
                    </span>
                  )}
                </div>
                <div className="mt-0.5 flex gap-0.5">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} className={`h-3 w-3 ${s <= review.rating ? "fill-amber text-amber" : "text-muted-foreground"}`} />
                  ))}
                </div>
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(review.createdAt).toLocaleDateString()}
              </span>
            </div>

            {review.title && <h4 className="mt-2 text-sm font-semibold text-navy">{review.title}</h4>}
            <p className="mt-1 text-sm text-navy/80">{review.body}</p>

            {review.photos.length > 0 && (
              <div className="mt-2 flex gap-2">
                {review.photos.map((p, i) => (
                  <div key={i} className="h-16 w-16 overflow-hidden rounded-md bg-muted">
                    { }
                    <img src={p.url} alt={`Photo ${i+1}`} className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            )}

            {review.fitTags && (
              <div className="mt-2 flex flex-wrap gap-1">
                {review.fitTags.split(",").filter(Boolean).map(tag => (
                  <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-navy">
                    {TAG_LABELS[tag] || tag}
                  </span>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============================================================================
//  ReviewForm — extracted as a child component (reused by both branches)
// ============================================================================
function ReviewForm({
  reviewableItems,
  orderItemId, setOrderItemId,
  rating, setRating,
  title, setTitle,
  body, setBody,
  fitTags, setFitTags,
  submitting,
  onSubmit,
  onCancel,
}: {
  reviewableItems: { id: string; product: { title: string } }[];
  orderItemId: string;
  setOrderItemId: (s: string) => void;
  rating: number;
  setRating: (n: number) => void;
  title: string;
  setTitle: (s: string) => void;
  body: string;
  setBody: (s: string) => void;
  fitTags: string[];
  setFitTags: (updater: (prev: string[]) => string[]) => void;
  submitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-xl border border-border bg-white p-4">
      <div className="flex items-center gap-2">
        <BadgeCheck className="h-5 w-5 text-teal" />
        <span className="text-sm font-medium text-navy">Verified Buyer Review</span>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Order item</Label>
        <select
          value={orderItemId}
          onChange={(e) => setOrderItemId(e.target.value)}
          required
          className="h-9 w-full rounded-md border border-border bg-white px-2 text-sm"
        >
          <option value="">Select your order item...</option>
          {reviewableItems.map((item) => (
            <option key={item.id} value={item.id}>{item.product.title}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Rating</Label>
        <div className="flex gap-1">
          {[1,2,3,4,5].map(s => (
            <button
              key={s} type="button" onClick={() => setRating(s)}
              className="p-1"
              aria-label={`${s} star`}
            >
              <Star className={`h-6 w-6 ${s <= rating ? "fill-amber text-amber" : "text-muted-foreground"}`} />
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Title (optional)</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Impeccable tailoring" />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Your review</Label>
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} required rows={4}
          placeholder="Share fit, fabric, and quality impressions..." />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Fit tags</Label>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(TAG_LABELS).map(([tag, label]) => (
            <button
              key={tag} type="button"
              onClick={() => setFitTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition ${
                fitTags.includes(tag) ? "bg-amber text-navy" : "bg-muted text-navy hover:bg-muted/70"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={submitting} className="bg-navy text-white hover:bg-navy-700">
          {submitting ? "Submitting..." : "Submit verified review"}
        </Button>
      </div>
    </form>
  );
}
