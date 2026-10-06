"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Filter, LayoutGrid, Play, Recycle, Shield, Plus, X, User, Crown, Heart, Eye } from "lucide-react";
import { Header } from "@/components/acewears/header";
import { BottomNav } from "@/components/acewears/bottom-nav";
import { ProductCard, type ProductCardProps } from "@/components/acewears/product-card";
import { QuickCartDrawer } from "@/components/acewears/quick-cart-drawer";
import { AceReels, type Reel } from "@/components/acewears/ace-reels";
import { AdminProductUploadForm } from "@/components/acewears/admin-product-upload-form";
import { TradeInPortal } from "@/components/acewears/trade-in-portal";
import { ProductDetailModal } from "@/components/acewears/product-detail-modal";
import { BodyProfileCapture } from "@/components/acewears/body-profile-capture";
import { WishlistSection, DiscoverWishlists } from "@/components/acewears/wishlist-section";
import { SettingsSection } from "@/components/acewears/settings-section";
import { DashboardSection } from "@/components/acewears/dashboard-section";
import { AccountDetailsSection } from "@/components/acewears/account-details-section";
import { TermsSection } from "@/components/acewears/terms-section";
import { PaymentDetailsSection } from "@/components/acewears/payment-details-section";
import { CreditSection } from "@/components/acewears/credit-section";
import { PremiumActivationSection } from "@/components/acewears/premium-activation-section";
import { CheckoutModal, PurchaseHistorySection } from "@/components/acewears/checkout-purchase-history";
import { AuthModal } from "@/components/acewears/auth-modal";
import { ShopifyAdminSection } from "@/components/acewears/shopify-admin-section";
import { WishlistAlerts } from "@/components/acewears/wishlist-alerts";
import { LoyaltyPointsCard } from "@/components/acewears/loyalty-points";
import { LiveChatWidget } from "@/components/acewears/live-chat-widget";
import { SellerDashboardSection } from "@/components/acewears/seller-dashboard-section";
import { AppOnlyGate, useIsApp, APP_ONLY_FEATURES } from "@/components/acewears/app-feature-gate";
import { Button } from "@/components/ui/button";
import { useAuthStore, useIsPremium } from "@/lib/stores/auth-store";
import { useRecentViewsStore } from "@/lib/stores/recent-views-store";
import { useWishlistCount } from "@/lib/stores/wishlist-store";
import { toast } from "sonner";

type Category = { id: string; slug: string; name: string };
type ReelData = Reel;
type TradeInItemData = {
  id: string;
  status: string;
  claimedCreditCents: number;
  condition: string;
  createdAt: string;
  product: { title: string; slug: string };
};

export function HomeShowcase({
  products,
  categories,
  reels,
  tradeInItems: initialTradeInItems,
}: {
  products: ProductCardProps[];
  categories: Category[];
  reels: ReelData[];
  tradeInItems: TradeInItemData[];
}) {
  const [section, setSection] = useState<string>("home");
  const [activeProduct, setActiveProduct] = useState<string | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<{ category?: string; fit?: string; material?: string; maxPrice?: number }>({});
  const [showFilters, setShowFilters] = useState(false);
  const [tradeInItems, setTradeInItems] = useState<TradeInItemData[]>(initialTradeInItems);

  const user = useAuthStore((s) => s.user);
  const signInAsDemo = useAuthStore((s) => s.signInAsDemo);
  const signOut = useAuthStore((s) => s.signOut);
  const recentViews = useRecentViewsStore((s) => s.views);

  // Sync with URL hash on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sectionParam = params.get("section");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (sectionParam) setSection(sectionParam);
  }, []);

  // Listen for cross-component navigation events (e.g. PDP "Set up body profile" button)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as string;
      if (detail) setSection(detail);
    };
    window.addEventListener("acewears:navigate", handler);
    return () => window.removeEventListener("acewears:navigate", handler);
  }, []);

  // Listen for checkout open event (from cart drawer)
  useEffect(() => {
    const handler = () => setCheckoutOpen(true);
    window.addEventListener("acewears:open-checkout", handler);
    const authHandler = () => setAuthModalOpen(true);
    window.addEventListener("acewears:open-auth", authHandler);
    return () => {
      window.removeEventListener("acewears:open-checkout", handler);
      window.removeEventListener("acewears:open-auth", authHandler);
    };
  }, []);

  const handleNavigate = (id: string) => {
    setSection(id);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const filteredProducts = useMemo(() => {
    let list = products;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((p) =>
        p.title.toLowerCase().includes(q) ||
        p.tags.toLowerCase().includes(q) ||
        (p.material || "").toLowerCase().includes(q)
      );
    }
    if (filters.category) list = list.filter((p) => p.category?.slug === filters.category);
    if (filters.fit) list = list.filter((p) => p.fit === filters.fit);
    if (filters.material) list = list.filter((p) => (p.material || "").toLowerCase().includes(filters.material!.toLowerCase()));
    if (filters.maxPrice !== undefined) list = list.filter((p) => p.basePriceCents <= filters.maxPrice!);
    return list;
  }, [products, searchQuery, filters]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header onNavigate={handleNavigate} />

      {/* Search on mobile */}
      <div className="px-4 py-2 sm:hidden">
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search products..."
          className="h-9 w-full rounded-full border border-border bg-muted/40 px-4 text-sm outline-none focus:border-amber"
        />
      </div>

      <main className="flex-1 pb-20 lg:pb-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={section}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {section === "home" && (
              <HomeSection
                products={products}
                onNavigate={handleNavigate}
                onOpenProduct={setActiveProduct}
              />
            )}

            {section === "catalog" && (
              <CatalogSection
                products={filteredProducts}
                categories={categories}
                filters={filters}
                setFilters={setFilters}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                showFilters={showFilters}
                setShowFilters={setShowFilters}
                onOpenProduct={setActiveProduct}
              />
            )}

            {section === "reels" && (
              <AppOnlyGate feature="ace_reels" featureLabel="AceReels">
                <ReelsSection reels={reels} onNavigate={handleNavigate} />
              </AppOnlyGate>
            )}

            {section === "tradein" && (
              <AppOnlyGate feature="trade_in_portal" featureLabel="Trade-In Portal">
                <SectionShell title="Trade-In Portal">
                  <TradeInPortal
                  products={products.map((p) => ({
                    id: p.id, slug: p.slug, title: p.title, basePriceCents: p.basePriceCents,
                  }))}
                  existingItems={tradeInItems}
                  onSubmitted={async () => {
                    // Refresh trade-in items
                    try {
                      const res = await fetch(`/api/trade-in?userId=${user?.id || "acewears-buyer-demo-id"}`);
                      const j = await res.json();
                      if (j.ok) setTradeInItems(j.data);
                    } catch (e) { /* ignore */ }
                  }}
                />
              </SectionShell>
              </AppOnlyGate>
            )}

            {section === "admin" && (
              <ShopifyAdminSection onNavigate={handleNavigate} />
            )}

            {section === "seller" && (
              <AppOnlyGate feature="seller_dashboard" featureLabel="Seller Dashboard">
                <SellerDashboardSection onNavigate={handleNavigate} />
              </AppOnlyGate>
            )}

            {section === "upload-product" && (
              <div className="mx-auto max-w-4xl px-4 py-6">
                <div className="mb-4">
                  <h1 className="text-xl font-bold text-navy">Upload New Product</h1>
                  <p className="text-xs text-muted-foreground">Add a product with 3-angle images (Front, Back, Side/Detail), variants, and size chart</p>
                </div>
                {user?.role === "ADMIN" ? (
                  <div className="rounded-xl border border-border bg-white p-5">
                    <AdminProductUploadForm categories={categories} adminRole={user.role} />
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border p-10 text-center">
                    <Shield className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                    <p className="text-sm font-medium text-navy">Admin access required</p>
                    <p className="text-xs text-muted-foreground">Sign in as admin to upload products.</p>
                    <Button onClick={() => window.dispatchEvent(new CustomEvent("acewears:open-auth"))} className="mt-3 bg-navy text-white">
                      Sign in
                    </Button>
                  </div>
                )}
              </div>
            )}

            {section === "studio" && (
              <AppOnlyGate feature="ai_virtual_try_on" featureLabel="AI Virtual Try-On">
                <SectionShell title="AI Studio">
                  <AiStudioSection />
                </SectionShell>
              </AppOnlyGate>
            )}

            {section === "wishlist" && (
              <WishlistSection onOpenProduct={setActiveProduct} />
            )}

            {section === "discover" && (
              <DiscoverWishlists onOpenProduct={setActiveProduct} />
            )}

            {section === "dashboard" && (
              <DashboardSection onNavigate={handleNavigate} />
            )}

            {section === "credit" && (
              <CreditSection onNavigate={handleNavigate} />
            )}

            {section === "premium" && (
              <PremiumActivationSection />
            )}

            {section === "purchases" && (
              <PurchaseHistorySection />
            )}

            {section === "account-details" && (
              <AccountDetailsSection />
            )}

            {section === "payment" && (
              <PaymentDetailsSection />
            )}

            {section === "settings" && (
              <SettingsSection />
            )}

            {section === "terms" && (
              <TermsSection />
            )}

            {section === "account" && (
              <SectionShell title="My Account">
                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="rounded-xl border border-border bg-white p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-navy p-3 text-white">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-navy">
                          {user?.name || "Guest"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {user?.email || "Not signed in"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      {user ? (
                        <>
                          <span className="rounded-full bg-teal/10 px-2 py-0.5 text-[10px] font-bold uppercase text-teal">
                            {user.role}
                          </span>
                          <Button variant="outline" size="sm" onClick={() => { signOut(); toast.success("Signed out"); }}>
                            Sign out
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" onClick={() => { signInAsDemo("CUSTOMER"); toast.success("Signed in as verified buyer"); }}>
                            Sign in as buyer
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => { signInAsDemo("ADMIN"); toast.success("Signed in as admin"); }}>
                            Sign in as admin
                          </Button>
                        </>
                      )}
                    </div>
                    {user && (
                      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border pt-3 text-center">
                        <div>
                          <p className="text-xs text-muted-foreground">Height</p>
                          <p className="text-sm font-bold text-navy">{user.heightCm || "—"}cm</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Weight</p>
                          <p className="text-sm font-bold text-navy">{user.weightKg || "—"}kg</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Fit</p>
                          <p className="text-sm font-bold text-navy">{(user.fitPreference || "—").toLowerCase()}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-border bg-white p-4 lg:col-span-2">
                    <h3 className="text-sm font-semibold text-navy">Recent views</h3>
                    {recentViews.length === 0 ? (
                      <p className="mt-2 text-sm text-muted-foreground">
                        Browse some products to populate your recent views.
                      </p>
                    ) : (
                      <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {recentViews.slice(0, 8).map((v) => (
                          <li
                            key={`recent-${v.productId}`}
                            onClick={() => setActiveProduct(v.productId)}
                            className="cursor-pointer overflow-hidden rounded-lg border border-border"
                          >
                            {v.image ? (
                               
                              <img src={v.image} alt={v.title} className="aspect-[3/4] w-full object-cover" />
                            ) : null}
                            <div className="p-2">
                              <p className="line-clamp-1 text-xs font-medium text-navy">{v.title}</p>
                              <p className="text-xs font-bold text-amber">${(v.priceCents / 100).toFixed(2)}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </SectionShell>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <QuickCartDrawer />
      <ProductDetailModal productId={activeProduct} onClose={() => setActiveProduct(null)} />
      {checkoutOpen && <CheckoutModal onClose={() => setCheckoutOpen(false)} />}
      <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      <WishlistAlerts />
      <BottomNav active={section} onNavigate={handleNavigate} />
    </div>
  );
}

function SectionShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-bold text-navy">{title}</h1>
      {children}
    </div>
  );
}

// ---------------- Home ----------------
function HomeSection({
  products, onNavigate, onOpenProduct,
}: {
  products: ProductCardProps[];
  onNavigate: (s: string) => void;
  onOpenProduct: (id: string) => void;
}) {
  const featured = products.slice(0, 6);
  const scarcityProducts = products.filter(p => p.promoTags?.some(pt => pt.kind === "SCARCITY"));

  return (
    <div className="space-y-8">
      {/* Hero — AceWears block-shadow wordmark with woman on the "S" */}
      <section className="relative overflow-hidden bg-navy text-white">
        {/* Ambient glow */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-amber/30 blur-3xl" />
          <div className="absolute right-0 bottom-0 h-96 w-96 rounded-full bg-teal/20 blur-3xl" />
        </div>
        {/* Subtle grid for depth */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #FF9F1C 1px, transparent 1px), linear-gradient(to bottom, #FF9F1C 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:py-12 lg:py-16">
          {/* New season badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center lg:justify-start"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber">
              <Sparkles className="h-3 w-3" /> New season · Autumn 2026
            </span>
          </motion.div>

          {/* ===== AceWears block-shadow wordmark with woman behind the text ===== */}
          <div className="relative mt-4 sm:mt-6">
            {/* The 3D woman — positioned BEHIND the text, overlapping the middle letters
                (W, e, a, r area). She's a model cutout integrated into the design.
                z-10 = behind text (z-30), above background glow (z-0).
                Shown from thighs up (object-cover + object-top + height capped) so she
                doesn't tower over the wordmark. */}
            <motion.img
              src="/hero-woman-3d.png"
              alt="A joyful 3D-rendered woman with shopping bags behind the AceWears wordmark"
              initial={{ opacity: 0, x: 40, rotate: 8 }}
              animate={{ opacity: 1, x: 0, rotate: 4 }}
              transition={{ delay: 0.5, duration: 0.7, type: "spring", stiffness: 180 }}
              /* Width + explicit height with object-cover + object-top crops her lower body
                 so only head + torso + shopping bags show (thighs-up, like the reference).
                 Height ≈ 1.2x the wordmark height so she doesn't tower. */
              className="acewears-hero-woman pointer-events-none absolute z-10 w-[24vw] max-w-[110px] h-[16vw] max-h-[70px] object-cover object-top drop-shadow-[-6px_8px_16px_rgba(0,0,0,0.5)] lg:w-[18vw] lg:max-w-[260px] lg:h-[13vw] lg:max-h-[190px] lg:drop-shadow-[-8px_12px_20px_rgba(0,0,0,0.55)]"
              style={{
                /* Position her in the upper-right area, overlapping the 'Wear' part of the wordmark. */
                right: "calc(50% - 26vw)",
                top: "-8%",
              }}
            />
            <style>{`
              @media (min-width: 1024px) {
                .acewears-hero-woman {
                  right: calc(50% - 18vw) !important;
                  top: -3% !important;
                }
              }
            `}</style>

            {/* Amber glow behind the woman for depth */}
            <div
              className="acewears-hero-glow pointer-events-none absolute z-0 h-48 w-48 rounded-full bg-amber/20 blur-3xl lg:h-96 lg:w-96"
              style={{
                right: "calc(50% - 35vw)",
                top: "-10%",
              }}
            />
            <style>{`
              @media (min-width: 1024px) {
                .acewears-hero-glow {
                  right: calc(50% - 25vw) !important;
                  top: -5% !important;
                }
              }
            `}</style>

            {/* The wordmark — sits ON TOP of the woman (z-30) so the text is fully readable.
                Block shadow extrudes DOWN-RIGHT (southeast) toward a right vanishing point. */}
            <motion.h1
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              /* whitespace-nowrap keeps "AceWears" on a single line (prevents the S from dropping).
                 leading-none tightens line height. z-30 puts text above the woman. */
              className="acewears-block relative z-30 whitespace-nowrap text-center text-[13vw] leading-none sm:text-[12vw] lg:text-[13vw] xl:text-[180px]"
              style={{ perspective: "800px" }}
            >
              {/* "AceWear" + the "S" — all letters share the same inline flow. */}
              <span className="acewears-block-amber">A</span><span>ceWear</span><span>s</span>
            </motion.h1>

            {/* Tagline below the wordmark */}
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-4 text-center text-sm text-white/70 sm:text-base lg:text-lg"
            >
              Italian-milled fabric · AI-assisted fit · Shoppable reels · Circular trade-in
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="mt-5 flex flex-wrap justify-center gap-3"
            >
              <Button onClick={() => onNavigate("catalog")} size="lg" className="bg-amber text-navy hover:bg-amber-400">
                <LayoutGrid className="mr-2 h-4 w-4" /> Shop the collection
              </Button>
              <Button onClick={() => onNavigate("studio")} size="lg"
                className="border border-amber/50 bg-amber/10 text-amber hover:bg-amber/20 hover:text-amber">
                <Sparkles className="mr-2 h-4 w-4" /> AI Virtual Try-On
              </Button>
              <Button onClick={() => onNavigate("reels")} size="lg"
                className="border border-white/30 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                <Play className="mr-2 h-4 w-4" /> Watch AceReels
              </Button>
            </motion.div>

            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-6 flex flex-wrap justify-center gap-6 text-xs text-white/60 sm:gap-10"
            >
              <div className="text-center">
                <span className="block text-xl font-bold text-white">12K+</span>
                Verified buyers
              </div>
              <div className="text-center">
                <span className="block text-xl font-bold text-white">4.8★</span>
                Avg rating
              </div>
              <div className="text-center">
                <span className="block text-xl font-bold text-white">-40%</span>
                Return rate*
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured grid */}
      <section className="mx-auto max-w-7xl px-4">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-xl font-bold text-navy">Featured</h2>
          <button onClick={() => onNavigate("catalog")} className="text-xs text-amber underline">
            View all
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {featured.map(p => (
            <ProductCard key={`featured-${p.id}`} product={p} onOpen={onOpenProduct} />
          ))}
        </div>
      </section>

      {/* AceReels CTA card (replaces embedded reel feed) */}
      <section className="mx-auto max-w-7xl px-4">
        <motion.button
          whileHover={{ y: -2 }}
          onClick={() => onNavigate("reels")}
          className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-navy via-navy-700 to-teal p-6 text-left text-white sm:p-8"
        >
          {/* Decorative play icon */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20 transition group-hover:opacity-40">
            <Play className="h-24 w-24" fill="currentColor" />
          </div>
          <div className="relative max-w-lg">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber">
              <Play className="h-3 w-3" /> Shoppable Video Feed
            </span>
            <h2 className="mt-3 text-2xl font-bold sm:text-3xl">
              AceReels — shop what you see
            </h2>
            <p className="mt-2 text-sm text-white/80">
              Swipe through curated short videos of our latest drops.
              Tap any product overlay for 1-tap add to cart.
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-amber px-4 py-2 text-sm font-bold text-navy transition group-hover:bg-amber-400">
              Open Reels feed
              <Play className="h-3.5 w-3.5" fill="currentColor" />
            </span>
          </div>
        </motion.button>
      </section>

      {/* Scarcity / trending */}
      {scarcityProducts.length > 0 && (
        <section className="mx-auto max-w-7xl px-4">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-navy">Almost gone</h2>
            <p className="text-xs text-muted-foreground">Real-time inventory alerts</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {scarcityProducts.slice(0, 4).map(p => (
              <ProductCard key={`scarcity-${p.id}`} product={p} onOpen={onOpenProduct} />
            ))}
          </div>
        </section>
      )}

      {/* Trade-in CTA */}
      <section className="mx-auto max-w-7xl px-4">
        <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-teal to-navy p-6 text-white sm:p-10">
          <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wider">
                <Recycle className="h-3 w-3" /> Re-Commerce
              </span>
              <h2 className="mt-3 text-2xl font-bold sm:text-3xl">
                Trade in your pre-owned AceWears for store credit.
              </h2>
              <p className="mt-2 max-w-md text-sm text-white/80">
                Register items in seconds. We handle pickup, inspection, and credit.
                Up to 45% back, carbon-neutral process.
              </p>
              <Button
                onClick={() => onNavigate("tradein")}
                className="mt-4 bg-amber text-navy hover:bg-amber-400"
                size="lg"
              >
                Open Trade-In Portal
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-white/10 p-3">
                <p className="text-2xl font-bold">45%</p>
                <p className="text-[10px] uppercase tracking-wider text-white/60">Max credit</p>
              </div>
              <div className="rounded-xl bg-white/10 p-3">
                <p className="text-2xl font-bold">24h</p>
                <p className="text-[10px] uppercase tracking-wider text-white/60">Inspection</p>
              </div>
              <div className="rounded-xl bg-white/10 p-3">
                <p className="text-2xl font-bold">0kg</p>
                <p className="text-[10px] uppercase tracking-wider text-white/60">Net carbon</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// ---------------- Catalog ----------------
function CatalogSection({
  products, categories, filters, setFilters, searchQuery, setSearchQuery,
  showFilters, setShowFilters, onOpenProduct,
}: {
  products: ProductCardProps[];
  categories: Category[];
  filters: { category?: string; fit?: string; material?: string; maxPrice?: number };
  setFilters: (f: any) => void;
  searchQuery: string;
  setSearchQuery: (s: string) => void;
  showFilters: boolean;
  setShowFilters: (b: boolean) => void;
  onOpenProduct: (id: string) => void;
}) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [renderCount, setRenderCount] = useState(1); // how many times to duplicate the list

  // Infinite scroll — when user reaches the bottom, duplicate the list
  // and loop back to the start seamlessly
  useEffect(() => {
    const handleScroll = () => {
      const grid = gridRef.current;
      if (!grid) return;
      const rect = grid.getBoundingClientRect();
      const bottomOfGrid = rect.bottom;
      const viewportBottom = window.innerHeight;

      // If we're near the bottom of the grid, add another copy
      if (bottomOfGrid - viewportBottom < 600) {
        setRenderCount((prev) => Math.min(prev + 1, 10)); // cap at 10 copies to prevent memory issues
      }

      // If we've scrolled past a full set, reset to the top seamlessly
      const fullHeight = grid.scrollHeight;
      const oneSetHeight = fullHeight / renderCount;
      const scrolledPast = window.scrollY - (grid.offsetTop || 0);

      // If user has scrolled past 2 full sets, jump back by 1 set (seamless loop)
      if (scrolledPast > oneSetHeight * 2 && renderCount > 1) {
        window.scrollTo({ top: (grid.offsetTop || 0) + oneSetHeight, behavior: "instant" as any });
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [renderCount]);

  // Duplicate the product list for infinite scroll effect
  const loopedProducts = Array.from({ length: renderCount }, () => products).flat();

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-navy">Shop all</h1>
          <p className="text-xs text-muted-foreground">{products.length} products · infinite scroll</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}
          className="lg:hidden">
          <Filter className="mr-1 h-3.5 w-3.5" /> Filters
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_1fr]">
        {/* Persistent sidebar (desktop) + slide-out (mobile) */}
        <FilterSidebar
          categories={categories}
          filters={filters}
          setFilters={setFilters}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
        />

        <div>
          {/* Search */}
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            className="mb-3 h-9 w-full rounded-md border border-border bg-muted/30 px-3 text-sm outline-none focus:border-amber"
          />

          {products.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              No products match your filters.
            </div>
          ) : (
            <div ref={gridRef} className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {loopedProducts.map((p, i) => (
                <ProductCard key={`catalog-${p.id}-${i}`} product={p} onOpen={onOpenProduct} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterSidebar({
  categories, filters, setFilters, showFilters, setShowFilters,
}: {
  categories: Category[];
  filters: any;
  setFilters: (f: any) => void;
  showFilters: boolean;
  setShowFilters: (b: boolean) => void;
}) {
  return (
    <>
      {/* Desktop persistent */}
      <aside className="hidden lg:block">
        <div className="sticky top-32 space-y-4 rounded-xl border border-border bg-white p-4">
          <FilterGroup label="Category">
            <div className="space-y-1">
              <FilterRadio
                label="All"
                checked={!filters.category}
                onChange={() => setFilters({ ...filters, category: undefined })}
              />
              {categories.map(c => (
                <FilterRadio
                  key={c.id}
                  label={c.name}
                  checked={filters.category === c.slug}
                  onChange={() => setFilters({ ...filters, category: c.slug })}
                />
              ))}
            </div>
          </FilterGroup>
          <FilterGroup label="Fit">
            <div className="flex flex-wrap gap-1">
              {["SLIM", "REGULAR", "RELAXED", "OVERSIZED"].map(f => (
                <button
                  key={f}
                  onClick={() => setFilters({ ...filters, fit: filters.fit === f ? undefined : f })}
                  className={`rounded-full px-2 py-0.5 text-xs font-medium transition ${
                    filters.fit === f ? "bg-navy text-white" : "bg-muted text-navy hover:bg-muted/70"
                  }`}
                >
                  {f.toLowerCase()}
                </button>
              ))}
            </div>
          </FilterGroup>
          <FilterGroup label="Material">
            <input
              type="text"
              value={filters.material || ""}
              onChange={(e) => setFilters({ ...filters, material: e.target.value || undefined })}
              placeholder="wool, cashmere..."
              className="h-8 w-full rounded-md border border-border bg-white px-2 text-xs"
            />
          </FilterGroup>
          <FilterGroup label="Max price">
            <input
              type="range"
              min="0" max="500" step="10"
              value={filters.maxPrice || 500}
              onChange={(e) => setFilters({ ...filters, maxPrice: Number(e.target.value) * 100 })}
              className="w-full accent-amber"
            />
            <p className="text-xs text-muted-foreground">Up to ${(filters.maxPrice || 50000) / 100}</p>
          </FilterGroup>
        </div>
      </aside>

      {/* Mobile slide-out */}
      {showFilters && (
        <>
          <div className="fixed inset-0 z-40 bg-navy/40 lg:hidden" onClick={() => setShowFilters(false)} />
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            className="fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto bg-white p-4 lg:hidden"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-navy">Filters</h3>
              <button onClick={() => setShowFilters(false)} className="rounded-full p-1 hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>
            <FilterGroup label="Category">
              <div className="space-y-1">
                <FilterRadio
                  label="All"
                  checked={!filters.category}
                  onChange={() => setFilters({ ...filters, category: undefined })}
                />
                {categories.map(c => (
                  <FilterRadio
                    key={c.id}
                    label={c.name}
                    checked={filters.category === c.slug}
                    onChange={() => setFilters({ ...filters, category: c.slug })}
                  />
                ))}
              </div>
            </FilterGroup>
            <FilterGroup label="Fit">
              <div className="flex flex-wrap gap-1">
                {["SLIM", "REGULAR", "RELAXED", "OVERSIZED"].map(f => (
                  <button
                    key={f}
                    onClick={() => setFilters({ ...filters, fit: filters.fit === f ? undefined : f })}
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      filters.fit === f ? "bg-navy text-white" : "bg-muted text-navy"
                    }`}
                  >
                    {f.toLowerCase()}
                  </button>
                ))}
              </div>
            </FilterGroup>
          </motion.div>
        </>
      )}
    </>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-navy">{label}</p>
      {children}
    </div>
  );
}

function FilterRadio({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-xs transition ${
        checked ? "bg-amber/10 font-bold text-navy" : "text-navy hover:bg-muted"
      }`}
    >
      <span className={`h-3 w-3 rounded-full border-2 ${checked ? "border-amber bg-amber" : "border-muted-foreground"}`} />
      {label}
    </button>
  );
}

// ---------------- Reels (dedicated page) ----------------
function ReelsSection({
  reels,
}: {
  reels: ReelData[];
  onNavigate: (s: string) => void;
}) {
  if (reels.length === 0) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-20 text-center">
        <Play className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
        <h1 className="text-xl font-bold text-navy">No reels available</h1>
        <p className="mt-1 text-sm text-muted-foreground">Check back soon for new shoppable videos.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      {/* Page header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-navy">
            <Play className="h-6 w-6 text-amber" /> AceReels
          </h1>
          <p className="text-xs text-muted-foreground">
            Scroll to discover · Tap to add to cart · {reels.length} videos
          </p>
        </div>
        <span className="hidden rounded-full bg-amber/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber sm:block">
          Shoppable Feed
        </span>
      </div>

      {/* Full-height reels carousel */}
      <AceReels reels={reels as Reel[]} />

      {/* Helper text below the feed */}
      <p className="mt-4 text-center text-xs text-muted-foreground">
        Swipe up or scroll to browse the next reel · Tap the video to pause/play · Tap mute to toggle audio
      </p>
    </div>
  );
}

// ---------------- AI Studio ----------------
function AiStudioSection() {
  const user = useAuthStore((s) => s.user);
  const isPremium = useIsPremium();
  const upgradeToPremium = useAuthStore((s) => s.upgradeToPremium);
  const signInAsDemo = useAuthStore((s) => s.signInAsDemo);
  const [tryOnResults, setTryOnResults] = useState<any[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);

  // Load user's prior try-on results
  useEffect(() => {
    if (!user) return;
    setLoadingResults(true);
    fetch(`/api/me/try-on-results?userId=${user.id}`)
      .then(r => r.json())
      .then(j => { if (j.ok) setTryOnResults(j.data); })
      .finally(() => setLoadingResults(false));
  }, [user]);

  const handleUpgrade = async () => {
    if (!user) {
      // Sign in as buyer first (demo) then upgrade
      signInAsDemo("CUSTOMER");
      toast.success("Signed in as Verified Buyer");
      return;
    }
    try {
      const res = await fetch("/api/me/upgrade-premium", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const j = await res.json();
      if (j.ok) {
        upgradeToPremium();
        toast.success("Upgraded to AceWears Premium");
      } else throw new Error(j.error || "Upgrade failed");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-2xl bg-gradient-to-br from-navy via-navy-700 to-teal p-6 text-white sm:p-8"
      >
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-amber/20 p-3">
            <Sparkles className="h-6 w-6 text-amber" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold sm:text-2xl">AI Virtual Try-On Studio</h2>
              <span className="rounded-full bg-amber px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-navy">
                Premium
              </span>
            </div>
            <p className="mt-1 max-w-2xl text-sm text-white/80">
              Upload your photo, lock in your natural details (skin tone, hair, build, face shape),
              and our VLM + image-gen pipeline will render how every garment looks on <strong>you</strong> —
              not on a stock model.
            </p>
            {!user ? (
              <Button onClick={handleUpgrade} className="mt-4 bg-amber text-navy hover:bg-amber-400">
                Sign in to start
              </Button>
            ) : !isPremium ? (
              <Button onClick={handleUpgrade} className="mt-4 bg-amber text-navy hover:bg-amber-400">
                <Crown className="mr-1.5 h-4 w-4" /> Upgrade to Premium — Free demo
              </Button>
            ) : (
              <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white">
                <Crown className="h-3.5 w-3.5 text-amber" /> Premium active
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* How it works */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { num: 1, title: "Capture your profile", body: "Upload a face photo, pick skin tone, hair, eye color, body type. VLM auto-extracts jawline, face shape, eye shape." },
          { num: 2, title: "Open any product", body: "Tap the Try On button on any PDP. Our pipeline composes a custom prompt with your physical description." },
          { num: 3, title: "See it on you", body: "Photorealistic 768x1344 portrait render — accurate drape, fabric, lighting. Cached for instant re-view." },
        ].map(step => (
          <div key={step.num} className="rounded-xl border border-border bg-white p-4">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber/15 text-sm font-bold text-amber">
              {step.num}
            </div>
            <h3 className="mt-2 text-sm font-semibold text-navy">{step.title}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{step.body}</p>
          </div>
        ))}
      </div>

      {/* Body profile form */}
      <BodyProfileCapture />

      {/* Prior try-on results */}
      {isPremium && (
        <div className="rounded-xl border border-border bg-white p-4">
          <h3 className="text-sm font-semibold text-navy">Your try-on history</h3>
          {loadingResults ? (
            <p className="mt-2 text-xs text-muted-foreground">Loading...</p>
          ) : tryOnResults.length === 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">
              No try-ons yet. Open any product and tap the Try On button.
            </p>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {tryOnResults.map((r) => (
                <div key={r.id} className="overflow-hidden rounded-lg border border-border">
                  { }
                  <img src={r.resultUrl} alt={r.product.title} className="aspect-[3/4] w-full object-cover" />
                  <div className="p-2">
                    <p className="line-clamp-1 text-xs font-medium text-navy">{r.product.title}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
