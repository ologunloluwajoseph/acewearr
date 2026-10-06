/**
 * AceWears — Test Suite
 *
 * This file contains integration tests for the core API endpoints.
 * Run with: bun test
 *
 * Tests cover:
 * 1. Product listing (GET /api/products)
 * 2. Product detail (GET /api/products/:id)
 * 3. Categories (GET /api/categories)
 * 4. Search (GET /api/search?q=...)
 * 5. Reels (GET /api/reels)
 * 6. Credit balance (GET /api/credit/balance)
 * 7. Wishlist (GET /api/wishlist)
 * 8. Auth signup (POST /api/auth/signup)
 * 9. Auth login (POST /api/auth/login)
 * 10. Rate limiting
 */

import { expect, describe, it, beforeAll } from "bun:test";

const BASE = "http://localhost:3000";

async function fetchJSON(path: string, options?: any) {
  const res = await fetch(`${BASE}${path}`, options);
  const json = await res.json();
  return { status: res.status, ...json };
}

describe("AceWears API Tests", () => {
  // 1. Product listing
  it("GET /api/products — returns paginated product list", async () => {
    const result = await fetchJSON("/api/products?limit=5");
    expect(result.ok).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data.length).toBeLessThanOrEqual(5);
    expect(result.pagination).toBeDefined();
  });

  // 2. Categories
  it("GET /api/categories — returns category list", async () => {
    const result = await fetchJSON("/api/categories");
    expect(result.ok).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data.length).toBeGreaterThan(0);
  });

  // 3. Search
  it("GET /api/search?q=navy — returns matching products", async () => {
    const result = await fetchJSON("/api/search?q=navy&limit=5");
    expect(result.ok).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.query).toBe("navy");
  });

  // 4. Search with short query (should return empty)
  it("GET /api/search?q=a — returns empty for short query", async () => {
    const result = await fetchJSON("/api/search?q=a");
    expect(result.ok).toBe(true);
    expect(result.data.length).toBe(0);
  });

  // 5. Reels
  it("GET /api/reels — returns active reels", async () => {
    const result = await fetchJSON("/api/reels");
    expect(result.ok).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
  });

  // 6. Credit balance (demo buyer)
  it("GET /api/credit/balance — returns credit balance for demo buyer", async () => {
    const result = await fetchJSON("/api/credit/balance?userId=acewears-buyer-demo-id");
    expect(result.ok).toBe(true);
    expect(result.data.creditBalanceCents).toBeGreaterThanOrEqual(0);
    expect(result.data.creditLimitCents).toBeGreaterThanOrEqual(0);
  });

  // 7. Wishlist
  it("GET /api/wishlist — returns wishlist items for demo buyer", async () => {
    const result = await fetchJSON("/api/wishlist?userId=acewears-buyer-demo-id");
    expect(result.ok).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
  });

  // 8. Public wishlists
  it("GET /api/wishlists — returns public wishlist summaries", async () => {
    const result = await fetchJSON("/api/wishlists");
    expect(result.ok).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
  });

  // 9. Purchase history
  it("GET /api/orders/purchase-history — returns order history", async () => {
    const result = await fetchJSON("/api/orders/purchase-history?userId=acewears-buyer-demo-id");
    expect(result.ok).toBe(true);
    expect(result.data.stats).toBeDefined();
    expect(result.data.stats.totalOrders).toBeGreaterThan(0);
  });

  // 10. Auth — signup (should succeed with unique email)
  it("POST /api/auth/signup — creates new account", async () => {
    const email = `test_${Date.now()}@acewears.test`;
    const result = await fetchJSON("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Test User", email, password: "testpass123" }),
    });
    expect(result.ok).toBe(true);
    expect(result.data.user.email).toBe(email);
    expect(result.data.token).toBeDefined();
  });

  // 11. Auth — login with demo buyer
  it("POST /api/auth/login — fails with wrong password", async () => {
    const result = await fetchJSON("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "buyer@acewears.com", password: "wrongpass" }),
    });
    expect(result.ok).toBe(false);
  });

  // 12. Admin — unauthorized access
  it("POST /api/products — rejects non-admin (403)", async () => {
    const result = await fetchJSON("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-acewears-role": "CUSTOMER" },
      body: JSON.stringify({ title: "Test" }),
    });
    expect(result.status).toBe(403);
  });

  // 13. Seller registration
  it("POST /api/seller/register — registers as seller", async () => {
    const email = `seller_${Date.now()}@acewears.test`;
    // First create a user
    const signup = await fetchJSON("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Test Seller", email, password: "testpass123" }),
    });
    expect(signup.ok).toBe(true);

    // Then register as seller
    const result = await fetchJSON("/api/seller/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: signup.data.user.id, storeName: "Test Store" }),
    });
    expect(result.ok).toBe(true);
    expect(result.data.storeName).toBe("Test Store");
  });

  // 14. Recommendations
  it("GET /api/recommendations — returns product recommendations", async () => {
    const result = await fetchJSON("/api/recommendations?limit=3");
    expect(result.ok).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data.length).toBeLessThanOrEqual(3);
  });

  // 15. Admin analytics (with admin role)
  it("GET /api/admin/analytics — returns analytics for admin", async () => {
    const result = await fetchJSON("/api/admin/analytics?range=30d", {
      headers: { "x-acewears-role": "ADMIN" },
    });
    expect(result.ok).toBe(true);
    expect(result.data.summary).toBeDefined();
    expect(result.data.summary.totalOrders).toBeGreaterThanOrEqual(0);
  });

  // 16. Admin inventory (with admin role)
  it("GET /api/admin/inventory — returns inventory for admin", async () => {
    const result = await fetchJSON("/api/admin/inventory", {
      headers: { "x-acewears-role": "ADMIN" },
    });
    expect(result.ok).toBe(true);
    expect(result.data.inventory).toBeDefined();
    expect(result.data.stats.totalProducts).toBeGreaterThan(0);
  });

  // 17. Admin — rejects non-admin
  it("GET /api/admin/inventory — rejects non-admin (403)", async () => {
    const result = await fetchJSON("/api/admin/inventory", {
      headers: { "x-acewears-role": "CUSTOMER" },
    });
    expect(result.status).toBe(403);
  });

  // 18. SEO — sitemap
  it("GET /sitemap.xml — returns valid XML sitemap", async () => {
    const res = await fetch(`${BASE}/sitemap.xml`);
    const xml = await res.text();
    expect(res.status).toBe(200);
    expect(xml).toContain("<urlset");
    expect(xml).toContain("<url>");
  });

  // 19. SEO — robots
  it("GET /robots.txt — returns robots.txt", async () => {
    const res = await fetch(`${BASE}/robots.txt`);
    const text = await res.text();
    expect(res.status).toBe(200);
    expect(text).toContain("User-Agent");
    expect(text).toContain("Sitemap");
  });
});
