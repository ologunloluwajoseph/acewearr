#!/usr/bin/env python3
"""
AceWears — Technical Blueprint PDF
Generates a comprehensive technical specification document for the AceWears
fashion e-commerce platform, covering all deliverables, architecture, and features.
"""

import os
import sys
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm, cm
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak,
    Table, TableStyle, Image, KeepTogether, ListFlowable, ListItem,
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily
from reportlab.platypus.flowables import HRFlowable
from reportlab.lib.colors import HexColor

# ============================================================================
#  Font Registration
# ============================================================================
FONT_DIR = '/usr/share/fonts'
try:
    pdfmetrics.registerFont(TTFont('NotoSerifSC', f'{FONT_DIR}/truetype/noto-serif-sc/NotoSerifSC-Regular.ttf'))
    pdfmetrics.registerFont(TTFont('NotoSerifSC-Bold', f'{FONT_DIR}/truetype/noto-serif-sc/NotoSerifSC-Bold.ttf'))
    registerFontFamily('NotoSerifSC', normal='NotoSerifSC', bold='NotoSerifSC-Bold')
    BODY_FONT = 'NotoSerifSC'
    BOLD_FONT = 'NotoSerifSC-Bold'
except:
    BODY_FONT = 'Helvetica'
    BOLD_FONT = 'Helvetica-Bold'

try:
    pdfmetrics.registerFont(TTFont('NotoSansSC', f'{FONT_DIR}/truetype/chinese/NotoSansSC-Regular.ttf'))
    pdfmetrics.registerFont(TTFont('NotoSansSC-Bold', f'{FONT_DIR}/truetype/chinese/NotoSansSC-Bold.ttf'))
except:
    pass

# ============================================================================
#  Brand Colors
# ============================================================================
NAVY = HexColor('#0A1128')
NAVY_LIGHT = HexColor('#1F2A47')
AMBER = HexColor('#FF9F1C')
AMBER_LIGHT = HexColor('#FFD58F')
TEAL = HexColor('#008080')
WHITE = HexColor('#FFFFFF')
LIGHT_BG = HexColor('#F4F5F8')
MUTED = HexColor('#47506B')
BORDER = HexColor('#E5E7EE')

# ============================================================================
#  Styles
# ============================================================================
styles = getSampleStyleSheet()

style_title = ParagraphStyle('AceTitle', parent=styles['Title'],
    fontName=BOLD_FONT, fontSize=28, textColor=NAVY,
    spaceAfter=6, alignment=TA_CENTER, leading=34)

style_subtitle = ParagraphStyle('AceSubtitle', parent=styles['Normal'],
    fontName=BODY_FONT, fontSize=12, textColor=MUTED,
    spaceAfter=20, alignment=TA_CENTER, leading=16)

style_h1 = ParagraphStyle('AceH1', parent=styles['Heading1'],
    fontName=BOLD_FONT, fontSize=18, textColor=NAVY,
    spaceBefore=20, spaceAfter=8, leading=22,
    borderPadding=4, borderWidth=0, borderColor=AMBER,
    leftIndent=0)

style_h2 = ParagraphStyle('AceH2', parent=styles['Heading2'],
    fontName=BOLD_FONT, fontSize=14, textColor=NAVY_LIGHT,
    spaceBefore=14, spaceAfter=6, leading=18)

style_h3 = ParagraphStyle('AceH3', parent=styles['Heading3'],
    fontName=BOLD_FONT, fontSize=11, textColor=AMBER,
    spaceBefore=10, spaceAfter=4, leading=14)

style_body = ParagraphStyle('AceBody', parent=styles['Normal'],
    fontName=BODY_FONT, fontSize=9.5, textColor=colors.black,
    spaceAfter=6, alignment=TA_JUSTIFY, leading=14)

style_body_small = ParagraphStyle('AceBodySmall', parent=style_body,
    fontSize=8.5, leading=12, textColor=MUTED)

style_code = ParagraphStyle('AceCode', parent=styles['Code'],
    fontName='Courier', fontSize=8, textColor=NAVY,
    backColor=LIGHT_BG, borderColor=BORDER, borderWidth=0.5,
    borderPadding=6, spaceBefore=4, spaceAfter=8, leading=11)

style_bullet = ParagraphStyle('AceBullet', parent=style_body,
    leftIndent=16, bulletIndent=6, spaceAfter=3)

style_caption = ParagraphStyle('AceCaption', parent=style_body,
    fontSize=8, textColor=MUTED, alignment=TA_CENTER, spaceAfter=10)

# ============================================================================
#  Page Template
# ============================================================================
PAGE_W, PAGE_H = A4
MARGIN_L = 20 * mm
MARGIN_R = 20 * mm
MARGIN_T = 25 * mm
MARGIN_B = 25 * mm
CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R

def on_page(canvas, doc):
    """Footer with page number + brand"""
    canvas.saveState()
    # Footer line
    canvas.setStrokeColor(BORDER)
    canvas.setLineWidth(0.5)
    canvas.line(MARGIN_L, MARGIN_B - 8, PAGE_W - MARGIN_R, MARGIN_B - 8)
    # Page number
    canvas.setFont(BODY_FONT, 8)
    canvas.setFillColor(MUTED)
    canvas.drawRightString(PAGE_W - MARGIN_R, MARGIN_B - 18, f"Page {doc.page}")
    # Brand
    canvas.drawString(MARGIN_L, MARGIN_B - 18, "AceWears — Technical Blueprint")
    # Top accent bar
    canvas.setFillColor(AMBER)
    canvas.rect(0, PAGE_H - 4, PAGE_W, 4, fill=1, stroke=0)
    canvas.restoreState()

def on_first_page(canvas, doc):
    """Cover page — no footer"""
    canvas.saveState()
    # Full navy background
    canvas.setFillColor(NAVY)
    canvas.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    # Amber accent bar at top
    canvas.setFillColor(AMBER)
    canvas.rect(0, PAGE_H - 8, PAGE_W, 8, fill=1, stroke=0)
    # Teal accent at bottom
    canvas.setFillColor(TEAL)
    canvas.rect(0, 0, PAGE_W, 8, fill=1, stroke=0)
    # Decorative circles
    canvas.setFillColor(AMBER)
    canvas.setFillAlpha(0.08)
    canvas.circle(-50, PAGE_H * 0.7, 120, fill=1, stroke=0)
    canvas.circle(PAGE_W + 30, PAGE_H * 0.3, 150, fill=1, stroke=0)
    canvas.setFillAlpha(1.0)
    # Logo text
    canvas.setFont(BOLD_FONT, 48)
    canvas.setFillColor(WHITE)
    canvas.drawCentredString(PAGE_W / 2, PAGE_H * 0.62, "AceWears")
    canvas.setFont(BOLD_FONT, 48)
    canvas.setFillColor(AMBER)
    canvas.drawCentredString(PAGE_W / 2 - 95, PAGE_H * 0.62, "A")
    # Subtitle
    canvas.setFont(BODY_FONT, 14)
    canvas.setFillColor(AMBER)
    canvas.drawCentredString(PAGE_W / 2, PAGE_H * 0.55, "T H R E A D S   R E I M A G I N E D")
    # Document title
    canvas.setFont(BOLD_FONT, 22)
    canvas.setFillColor(WHITE)
    canvas.drawCentredString(PAGE_W / 2, PAGE_H * 0.42, "Technical Blueprint")
    canvas.setFont(BODY_FONT, 11)
    canvas.setFillColor(colors.Color(1, 1, 1, alpha=0.6))
    canvas.drawCentredString(PAGE_W / 2, PAGE_H * 0.38,
        "Full-Stack Fashion E-Commerce System Specification")
    # Stats
    canvas.setFont(BOLD_FONT, 10)
    canvas.setFillColor(AMBER)
    y = PAGE_H * 0.28
    for label, value in [
        ("STACK", "Next.js 16 · React 19 · Prisma · Tailwind 4"),
        ("MODELS", "20+ Database Models"),
        ("API", "20+ REST Endpoints"),
        ("FEATURES", "AI Try-On · Wishlist · Credit · Reels"),
    ]:
        canvas.drawCentredString(PAGE_W / 2, y, f"{label}:  {value}")
        y -= 18
    # Footer
    canvas.setFont(BODY_FONT, 9)
    canvas.setFillColor(colors.Color(1, 1, 1, alpha=0.4))
    canvas.drawCentredString(PAGE_W / 2, 30, "Generated September 2026 · v1.0")
    canvas.restoreState()

# ============================================================================
#  Content Builders
# ============================================================================
def section_header(title, story):
    """Section header with amber underline"""
    story.append(Paragraph(title, style_h1))
    story.append(HRFlowable(width="100%", thickness=2, color=AMBER, spaceAfter=10))

def sub_header(title, story):
    story.append(Paragraph(title, style_h2))

def body(text, story):
    story.append(Paragraph(text, style_body))

def code_block(text, story):
    """Code block with monospace font"""
    # Escape XML
    text = text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    story.append(Paragraph(text.replace('\n', '<br/>'), style_code))

def bullet_list(items, story):
    flowables = [ListItem(Paragraph(item, style_bullet), leftIndent=16, value='bullet') for item in items]
    story.append(ListFlowable(flowables, bulletType='bullet', start='circle',
                              bulletColor=AMBER, leftIndent=16))

def make_table(data, col_widths=None, story=None):
    """Styled table with AceWears brand colors"""
    if col_widths is None:
        col_widths = [CONTENT_W / len(data[0])] * len(data[0])
    # Wrap cell text in Paragraphs for word-wrapping
    wrapped = []
    for row_idx, row in enumerate(data):
        wrapped_row = []
        for cell in row:
            if isinstance(cell, str):
                if row_idx == 0:
                    wrapped_row.append(Paragraph(f'<b>{cell}</b>', ParagraphStyle('th', parent=style_body, fontSize=8.5, textColor=WHITE, fontName=BOLD_FONT)))
                else:
                    wrapped_row.append(Paragraph(cell, ParagraphStyle('td', parent=style_body, fontSize=8.5, leading=12)))
            else:
                wrapped_row.append(cell)
        wrapped.append(wrapped_row)
    t = Table(wrapped, colWidths=col_widths, repeatRows=1)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), NAVY),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('FONTNAME', (0, 0), (-1, 0), BOLD_FONT),
        ('FONTSIZE', (0, 0), (-1, 0), 8.5),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
        ('TOPPADDING', (0, 0), (-1, 0), 6),
        ('BACKGROUND', (0, 1), (-1, -1), WHITE),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, LIGHT_BG]),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 1), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 4),
    ]))
    if story:
        story.append(t)
        story.append(Spacer(1, 8))
    return t

# ============================================================================
#  Build Document
# ============================================================================
def build_pdf():
    output_path = '/home/z/my-project/download/AceWears-Technical-Blueprint.pdf'

    doc = SimpleDocTemplate(output_path, pagesize=A4,
        leftMargin=MARGIN_L, rightMargin=MARGIN_R,
        topMargin=MARGIN_T, bottomMargin=MARGIN_B,
        title="AceWears — Technical Blueprint",
        author="AceWears Engineering",
        subject="Fashion E-Commerce System Specification",
        creator="AceWears PDF Generator")

    story = []

    # ---- Page 1: Cover (rendered by on_first_page) ----
    story.append(PageBreak())

    # ---- Table of Contents ----
    section_header("Table of Contents", story)
    toc_data = [
        ["Section", "Title", "Page"],
        ["1", "Executive Summary", "3"],
        ["2", "System Architecture", "4"],
        ["3", "Database Schema", "5"],
        ["4", "Core Deliverables", "6"],
        ["5", "AI Virtual Try-On", "8"],
        ["6", "Wishlist & Social Sharing", "9"],
        ["7", "Buy on Credit System", "10"],
        ["8", "Admin & CMS", "11"],
        ["9", "API Reference", "12"],
        ["10", "Technology Stack", "13"],
    ]
    make_table(toc_data, [CONTENT_W * 0.1, CONTENT_W * 0.75, CONTENT_W * 0.15], story)
    story.append(PageBreak())

    # ---- 1. Executive Summary ----
    section_header("1. Executive Summary", story)
    body("""AceWears is a modern, full-stack fashion e-commerce platform designed for high inventory density,
    high conversion velocity, and mobile-first performance. Built on Next.js 16 with React 19, the system
    combines traditional e-commerce capabilities with cutting-edge AI features including virtual try-on,
    shoppable short-video feeds, and a loyalty-driven credit system.""", story)
    body("""This document serves as the complete technical blueprint for the AceWears platform. It covers
    the system architecture, database schema, all core deliverables, and the innovative features that
    differentiate AceWears from traditional fashion retailers. The platform is designed to scale from
    a single-store deployment to a multi-tenant SaaS without architectural changes.""", story)

    sub_header("Key Differentiators", story)
    bullet_list([
        "<b>AI Virtual Try-On</b> — Premium users see how any garment, shoe, jewelry, or wig looks on their body via VLM analysis + image generation",
        "<b>Shoppable AceReels</b> — TikTok-style vertical video feed with 1-tap add to cart",
        "<b>Buy on Credit</b> — Loyalty-driven credit line funded by product surcharges, interest-free",
        "<b>Public Wishlists</b> — Every user's wishlist is public with social sharing (X, WhatsApp, Facebook) and downloadable composite image",
        "<b>Circular Trade-In</b> — Re-commerce portal for pre-owned AceWears items with store credit",
        "<b>Verified Reviews</b> — DB-trigger-enforced gating: only delivered-order owners can review",
        "<b>PWA</b> — Installable, offline-capable, push-notification-ready with 15-second install prompt + 7-day suppression",
    ], story)

    sub_header("Brand Identity", story)
    make_table([
        ["Token", "Color", "Hex", "Usage"],
        ["Deep Navy", "", "#0A1128", "Primary backgrounds, headers, text"],
        ["Clean White", "", "#FFFFFF", "Page background, light surfaces"],
        ["Electric Amber", "", "#FF9F1C", "CTAs, accents, highlights, badges"],
        ["Transformative Teal", "", "#008080", "Secondary accent, success states"],
    ], [CONTENT_W * 0.2, CONTENT_W * 0.15, CONTENT_W * 0.15, CONTENT_W * 0.5], story)

    story.append(PageBreak())

    # ---- 2. System Architecture ----
    section_header("2. System Architecture", story)
    body("""AceWears follows a Next.js App Router architecture with server-side rendering for the primary
    page and client-side section routing for the SPA-like single-page experience. The backend consists
    of Next.js API Routes backed by Prisma ORM. The system uses Zustand for client state management
    (cart, auth, wishlist, recent views) with localStorage persistence.""", story)

    sub_header("Frontend Architecture", story)
    make_table([
        ["Layer", "Technology", "Purpose"],
        ["Framework", "Next.js 16 (App Router, Turbopack)", "SSR + API routes"],
        ["UI Library", "React 19 + shadcn/ui (New York)", "Component library"],
        ["Styling", "Tailwind CSS 4 + custom @theme tokens", "Brand color system"],
        ["Animation", "Framer Motion", "Page transitions, modal animations"],
        ["State", "Zustand (persisted via localStorage)", "Cart, auth, wishlist, recent views"],
        ["Icons", "Lucide React", "Consistent icon system"],
    ], [CONTENT_W * 0.15, CONTENT_W * 0.4, CONTENT_W * 0.45], story)

    sub_header("Backend Architecture", story)
    make_table([
        ["Layer", "Technology", "Purpose"],
        ["API", "Next.js API Routes (TypeScript)", "REST endpoints"],
        ["ORM", "Prisma 6 (SQLite runtime, PostgreSQL production)", "Database access"],
        ["AI SDK", "z-ai-web-dev-sdk (server-side only)", "VLM + image generation"],
        ["Auth", "Header-based role check (demo) → NextAuth.js (production)", "JWT/session auth"],
        ["File Upload", "Multipart formData → /public/uploads/", "Product + body photos"],
        ["PWA", "manifest.json + sw.js (network-first HTML, cache-first static)", "Offline + installable"],
    ], [CONTENT_W * 0.15, CONTENT_W * 0.4, CONTENT_W * 0.45], story)

    story.append(PageBreak())

    # ---- 3. Database Schema ----
    section_header("3. Database Schema", story)
    body("""The production schema targets PostgreSQL 15+ with full DDL including ENUMs, foreign keys,
    composite indexes, GIN trigram search indexes, a materialized rating-summary view, and a
    DB-level trigger that enforces verified-buyer review gating. The runtime sandbox uses Prisma
    with SQLite. The schema includes 20+ models covering identity, catalog, orders, reviews,
    AI body profiles, try-on results, wishlists, credit transactions, and retention.""", story)

    sub_header("Model Overview", story)
    make_table([
        ["Model", "Purpose", "Key Fields"],
        ["User", "Identity & accounts", "id, email, role, isPremium, creditBalance/Limit/Used"],
        ["BodyProfile", "AI try-on body data", "skinTone, hairStyle, faceImageUrl, vlmExtractedAttrs"],
        ["Product", "Catalog items", "slug, basePriceCents, creditSurchargeCents, fit, categoryId"],
        ["ProductImage", "3-angle uploader", "angle (FRONT/BACK/SIDE_DETAIL), url, orderIdx"],
        ["ProductVariant", "Size/color stock", "sku, size, color, stockCount, priceOverrideCents"],
        ["Order", "Purchase records", "status, totalCents, trackingNumber, placedAt, deliveredAt"],
        ["Review", "Gated reviews", "rating, body, fitTags, orderItemId (unique), isVerified"],
        ["ReelItem", "Shoppable videos", "videoUrl, posterUrl, productId, isActive"],
        ["WishlistItem", "Public wishlists", "userId, productId, note, unique(userId, productId)"],
        ["CreditTransaction", "Credit ledger", "type, amountCents, balanceAfterCents, productId"],
        ["TryOnResult", "AI render cache", "userId, productId, resultUrl, promptUsed (unique pair)"],
        ["TradeInItem", "Re-commerce", "condition, claimedCreditCents, status"],
        ["PromoTag", "Scarcity/countdown", "label, kind, endsAt, isActive"],
    ], [CONTENT_W * 0.18, CONTENT_W * 0.22, CONTENT_W * 0.6], story)

    sub_header("Verified Review Guard (DB Trigger)", story)
    body("""A PostgreSQL trigger function enforce_verified_buyer() runs BEFORE INSERT OR UPDATE on
    the reviews table. It verifies that the linked order item belongs to the reviewer AND that the
    parent order status is DELIVERED. If either check fails, the transaction is aborted with a
    specific error message. This is defense-in-depth — the same checks also run at the API layer.""", story)

    story.append(PageBreak())

    # ---- 4. Core Deliverables ----
    section_header("4. Core Deliverables", story)

    sub_header("Deliverable 1: Production SQL Schema", story)
    body("""Full PostgreSQL DDL with ENUMs, foreign keys, composite indexes, GIN trigram search indexes,
    materialized rating-summary view, and DB trigger for verified-buyer enforcement. Delivered as
    download/schema.sql (17KB) plus prisma/schema.prisma for runtime.""", story)

    sub_header("Deliverable 2: SVG Logo + Tailwind Config", story)
    body("""Custom SVG logo combining an A monogram with interlocking amber/teal weave loops on a deep
    navy hex shield. Tailwind config extends navy/amber/teal color ramps with custom keyframes
    (slide-up-sheet, pulse-amber, shimmer). Brand tokens registered in @theme block for Tailwind 4.""", story)

    sub_header("Deliverable 3: PWA Install Banner", story)
    body("""Non-intrusive bottom slide-up sheet that captures beforeinstallprompt, fires every 15 seconds
    only when uninstalled and not within 7-day suppression window. Dismissal state persisted in
    localStorage via Zustand. Includes service worker (network-first HTML, cache-first static assets
    only — never caches API calls) and manifest.json with shortcuts.""", story)

    sub_header("Deliverable 4: Admin Product Upload Form", story)
    body("""3 dedicated drag-and-drop slots (FRONT, BACK, SIDE_DETAIL) with client-side Canvas
    compression (max 1600px, JPEG 0.82 quality) and original-vs-compressed size readouts. Variants
    manager (SKU/size/color/stock). Posts to /api/admin/upload then /api/products with admin role
    header.""", story)

    sub_header("Deliverable 5: API Handlers — Product CRUD + Verified Review Guard", story)
    body("""GET/POST /api/products (paginated listing + admin create), GET/PUT/DELETE
    /api/products/[id] (full PDP + admin update + soft-delete), GET/POST /api/products/[id]/reviews.
    The review POST performs 5-step verification: user authenticated, order item exists, order item
    belongs to user, order item's product matches, order status === DELIVERED, no existing review.""", story)

    sub_header("Deliverable 6: AceReels Shoppable Video Carousel", story)
    body("""Vertical snap-scrolling carousel (TikTok/Reels-style) with auto-play active video, pause
    off-screen, mute toggle, right-side action rail (like/comment/share), and bottom-left product
    overlay with image/price/size chips + 1-tap Add to Cart. Mobile-first 70vh / desktop 80vh height.""", story)

    story.append(PageBreak())

    # ---- 5. AI Virtual Try-On ----
    section_header("5. AI Virtual Try-On (Premium)", story)
    body("""The AI Virtual Try-On pipeline is AceWears' flagship premium feature. It renders a
    photorealistic visualization of how any product — clothes, shoes, jewelry, wigs, accessories —
    will look on the user's actual body, using their uploaded face photo, skin tone, hair, build,
    and VLM-extracted physical attributes.""", story)

    sub_header("Category-Adaptive Rendering", story)
    body("""The try-on API detects the product category and adapts the VLM analysis prompt, image
    generation size, and rendering prompt accordingly. This ensures jewelry gets a face closeup,
    shoes get a lower-body shot, and wigs get a headshot — not a one-size-fits-all full-body render.""", story)
    make_table([
        ["Product Type", "Detection Keywords", "Framing", "Image Size"],
        ["Clothes (tops, bottoms, outerwear)", "default", "Full-body portrait", "768x1344"],
        ["Shoes", "shoe, sneaker, boot, sandal", "Lower-body (waist down)", "864x1152"],
        ["Jewelry (earrings, necklace)", "earring, necklace, jewel, ring", "Face + upper chest closeup", "864x1152"],
        ["Wigs & hats", "wig, hairpiece, hat, cap", "Headshot (head + shoulders)", "864x1152"],
        ["Accessories (belts, bags)", "belt, watch, bag, scarf", "Medium shot (chest to mid-thigh)", "864x1152"],
    ], [CONTENT_W * 0.25, CONTENT_W * 0.3, CONTENT_W * 0.25, CONTENT_W * 0.2], story)

    sub_header("Pipeline Steps", story)
    bullet_list([
        "<b>Step 1:</b> Load user's BodyProfile (manual fields + VLM-extracted attrs JSON) + product FRONT image",
        "<b>Step 2:</b> Call VLM to analyze garment (silhouette, fit, fabric, color, details) — category-aware prompt",
        "<b>Step 3:</b> Compose detailed image-gen prompt blending physical description + garment analysis + lighting/pose/framing",
        "<b>Step 4:</b> Call zai.images.generations.create() with category-appropriate size — saves PNG to /public/uploads/try-on/",
        "<b>Step 5:</b> Cache result in TryOnResult table keyed by (userId, productId) — subsequent views are instant",
    ], story)

    sub_header("Body Profile Capture", story)
    body("""Premium users complete a body profile with: face photo upload (drag-and-drop), 8-swatch
    skin tone picker, hair style/color/eye color/body type selectors, body measurements (chest/waist/
    hip/inseam/shoulder), VLM auto-extraction button (analyzes face photo → faceShape, jawLine,
    cheekbones, skinUndertone, hairTexture, eyeShape, build, posture), and render consent checkbox.""", story)

    story.append(PageBreak())

    # ---- 6. Wishlist & Social Sharing ----
    section_header("6. Wishlist & Social Sharing", story)
    body("""Every AceWears user's wishlist is public by default — anyone with the link can view it.
    The wishlist system includes a heart toggle on every product card and PDP, a dedicated wishlist
    page with premium try-on buttons, a Discover page for browsing all public wishlists, and a
    share dialog with social media integration.""", story)

    sub_header("Share Dialog Features", story)
    bullet_list([
        "<b>Caption input</b> with 6 one-tap suggested captions",
        "<b>Product picker</b> — select up to 4 items to feature in the share image",
        "<b>Share to X/Twitter</b>, <b>Facebook</b>, <b>WhatsApp</b>, <b>Native share sheet</b> (Web Share API)",
        "<b>Copy link + caption</b> to clipboard",
        "<b>Download composite image</b> — Canvas-rendered 1080x1350 PNG with user photo, name, caption, and selected product cards (Instagram-ready)",
    ], story)

    sub_header("Public Wishlist Discovery", story)
    body("""The /api/wishlists endpoint returns all users who have at least one wishlist item, with
    their profile photo, item count, and 4-product preview grid. Clicking any user opens a modal
    with their full wishlist. The /api/wishlists/[userId] endpoint returns the complete wishlist
    for a specific user.""", story)

    sub_header("Premium Try-On from Wishlist", story)
    body("""Premium users see a Wand2 icon on every wishlist item. Tapping it opens the VirtualTryOn
    modal — the same category-adaptive pipeline as the PDP, but launched from the wishlist grid.
    This lets premium users visualize how their wishlist items would look on them before deciding
    to purchase.""", story)

    story.append(PageBreak())

    # ---- 7. Buy on Credit System ----
    section_header("7. Buy on Credit System", story)
    body("""AceWears features a loyalty-driven, interest-free credit system. Every product carries
    a credit surcharge (default ₦500 NGN). When a customer pays full price, the surcharge is
    credited to their creditBalanceCents — their credit eligibility grows with every purchase.
    They can then spend their accumulated balance to buy products on credit (pay later).""", story)

    body("""The surcharge mechanic is hidden from regular customers — only admins see the How It
    Works explainer, the surcharge badges on product cards, and the internal FAQ answer.
    Customers simply see their balance grow as they shop, framed as a loyalty reward.""", story)

    sub_header("Credit Data Model", story)
    make_table([
        ["Field", "Type", "Description"],
        ["creditBalanceCents", "Int (User)", "Available credit to spend"],
        ["creditLimitCents", "Int (User)", "Total lifetime credit limit earned"],
        ["creditUsedCents", "Int (User)", "Credit currently owed"],
        ["creditSurchargeCents", "Int (Product)", "Surcharge amount per product (default 500)"],
        ["type", "String (CreditTransaction)", "EARNED | USED | REPAID | ADJUSTED"],
        ["amountCents", "Int (CreditTransaction)", "Positive for EARNED/REPAID, negative for USED"],
        ["balanceAfterCents", "Int (CreditTransaction)", "Running balance for audit trail"],
    ], [CONTENT_W * 0.25, CONTENT_W * 0.25, CONTENT_W * 0.5], story)

    sub_header("Credit API Endpoints", story)
    make_table([
        ["Endpoint", "Method", "Purpose"],
        ["/api/credit/balance", "GET", "Returns creditBalance, limit, used for a user"],
        ["/api/credit/transactions", "GET", "Returns transaction history (newest first, 50 max)"],
        ["/api/credit/purchase", "POST", "Buys a product on credit (deducts balance, creates order)"],
    ], [CONTENT_W * 0.35, CONTENT_W * 0.1, CONTENT_W * 0.55], story)

    sub_header("Credit Purchase Flow", story)
    bullet_list([
        "User clicks Buy on Credit on a product",
        "API checks creditBalanceCents >= product base price",
        "If insufficient: returns 402 with specific NGN amounts needed vs available",
        "If sufficient: deducts from creditBalanceCents, adds to creditUsedCents",
        "Creates Order with status PAID_ON_CREDIT (fulfilled but owed)",
        "Creates CreditTransaction of type USED with negative amountCents",
        "Decrements variant stockCount",
        "Credit purchases do NOT earn new surcharge credit (only full-price payments do)",
    ], story)

    story.append(PageBreak())

    # ---- 8. Admin & CMS ----
    section_header("8. Admin & CMS", story)
    body("""The Admin Dashboard is gated by role-based authorization (x-acewears-role header check
    at every admin endpoint). Non-admin users see a Sign In prompt. Admins get access to the
    product upload form, live inventory panel, and quick-action shortcuts.""", story)

    sub_header("Admin Pages", story)
    make_table([
        ["Page", "Section ID", "Features"],
        ["Admin Dashboard", "admin", "3-slot product uploader, live inventory stats, quick actions"],
        ["Dashboard", "dashboard", "Premium stats (cart, wishlist, try-ons, trade-ins), trade-in credit, quick actions"],
        ["Account Details", "account-details", "Profile editing, body metrics, password change, security"],
        ["Payment & Payouts", "payment", "Saved cards, billing address, trade-in credit balance, payout methods"],
        ["Settings", "settings", "Notification toggles, privacy controls, language/currency preferences"],
        ["Terms & Privacy", "terms", "4 full legal documents: ToS, Privacy Policy, Return Policy, Trade-In Terms"],
    ], [CONTENT_W * 0.2, CONTENT_W * 0.15, CONTENT_W * 0.65], story)

    sub_header("Navigation", story)
    body("""Desktop uses a left-aligned mega-menu with Shop, Account, and Legal groups (horizontally
    scrollable on smaller desktops via no-scrollbar). Mobile uses a slide-out hamburger drawer
    with grouped nav items, user chip, and mobile search bar. All 13 nav items are accessible
    from both menus.""", story)

    story.append(PageBreak())

    # ---- 9. API Reference ----
    section_header("9. API Reference", story)
    body("""The AceWears backend exposes 20+ REST endpoints across 8 functional areas. All endpoints
    return JSON with { ok: boolean, data?: ..., error?: string } envelope. Admin endpoints require
    x-acewears-role: ADMIN header.""", story)

    sub_header("Product CRUD", story)
    make_table([
        ["Endpoint", "Method", "Auth", "Purpose"],
        ["/api/products", "GET", "Public", "Paginated listing with category/fit/material/price filters"],
        ["/api/products", "POST", "Admin", "Create product with 3-angle images + variants + size chart"],
        ["/api/products/[id]", "GET", "Public", "Full PDP with images, variants, sizeChart, reviews, rating summary"],
        ["/api/products/[id]", "PUT", "Admin", "Update product + variant stock overrides + promo tags"],
        ["/api/products/[id]", "DELETE", "Admin", "Soft-delete (isActive = false)"],
        ["/api/products/[id]/reviews", "GET", "Public", "Visible reviews + aggregate rating + tag counts"],
        ["/api/products/[id]/reviews", "POST", "Customer", "Verified-buyer-gated review submission (5-step check)"],
    ], [CONTENT_W * 0.28, CONTENT_W * 0.08, CONTENT_W * 0.1, CONTENT_W * 0.54], story)

    sub_header("AI & Try-On", story)
    make_table([
        ["Endpoint", "Method", "Auth", "Purpose"],
        ["/api/try-on", "POST", "Premium", "Category-adaptive VLM + image-gen try-on render (cached)"],
        ["/api/me/body-profile", "GET/POST/DELETE", "Premium", "Body profile CRUD (premium-gated)"],
        ["/api/me/extract-attrs", "POST", "Premium", "VLM face photo analysis → structured JSON attributes"],
        ["/api/me/try-on-results", "GET", "Premium", "List prior try-on renders"],
        ["/api/me/upgrade-premium", "POST", "User", "Demo one-click premium upgrade"],
        ["/api/admin/upload-body-photo", "POST", "User", "Multipart face/body photo upload"],
    ], [CONTENT_W * 0.28, CONTENT_W * 0.15, CONTENT_W * 0.1, CONTENT_W * 0.47], story)

    sub_header("Wishlist & Credit", story)
    make_table([
        ["Endpoint", "Method", "Auth", "Purpose"],
        ["/api/wishlist", "GET/POST/DELETE/PATCH", "User", "Wishlist CRUD with notes"],
        ["/api/wishlists", "GET", "Public", "List all users with wishlists + preview items"],
        ["/api/wishlists/[userId]", "GET", "Public", "Full wishlist for a specific user"],
        ["/api/credit/balance", "GET", "User", "Credit balance, limit, used"],
        ["/api/credit/transactions", "GET", "User", "Credit transaction history"],
        ["/api/credit/purchase", "POST", "User", "Buy product on credit"],
    ], [CONTENT_W * 0.28, CONTENT_W * 0.2, CONTENT_W * 0.08, CONTENT_W * 0.44], story)

    story.append(PageBreak())

    # ---- 10. Technology Stack ----
    section_header("10. Technology Stack", story)

    sub_header("Core Dependencies", story)
    make_table([
        ["Package", "Version", "Purpose"],
        ["next", "16.1.1", "App Router, SSR, API routes, Turbopack"],
        ["react / react-dom", "19.0.0", "UI rendering"],
        ["typescript", "5.x", "Type safety throughout"],
        ["tailwindcss", "4.x", "Utility-first CSS with @theme tokens"],
        ["prisma / @prisma/client", "6.11.1", "ORM (SQLite runtime, PostgreSQL production)"],
        ["zustand", "5.0.6", "Client state with localStorage persistence"],
        ["framer-motion", "12.23.2", "Animations (modals, drawer, hero)"],
        ["lucide-react", "0.525.0", "Icon system"],
        ["z-ai-web-dev-sdk", "0.0.18", "VLM + image generation (server-side only)"],
        ["shadcn/ui (New York)", "—", "Component library (Button, Dialog, Select, etc.)"],
        ["next-themes", "0.4.6", "Dark/light theme support"],
        ["sonner", "2.0.6", "Toast notifications"],
        ["embla-carousel-react", "8.6.0", "Reels carousel"],
    ], [CONTENT_W * 0.3, CONTENT_W * 0.12, CONTENT_W * 0.58], story)

    sub_header("File Structure", story)
    code_block("""src/
  app/
    api/                    20+ API route files
      products/             CRUD + reviews
      try-on/                AI try-on pipeline
      credit/                Balance, transactions, purchase
      wishlist/              Wishlist CRUD
      wishlists/             Public wishlist browsing
      me/                    Body profile, extract-attrs, try-on-results
      admin/                 Upload (products + body photos)
      ...
    page.tsx                Server component (fetches data → HomeShowcase)
    layout.tsx              Root layout (PWA, SW registrar, toaster)
    globals.css              Brand tokens (@theme), block-shadow CSS
  components/
    acewears/               25+ feature components
      home-showcase.tsx      Main SPA router (13 sections)
      header.tsx             Sticky header + mega-menu + hamburger
      product-card.tsx       Card with wishlist heart + credit badge
      product-detail-modal   PDP with 3-angle gallery + AI assistant
      virtual-try-on.tsx     Premium try-on viewer
      ace-reels.tsx           Shoppable video carousel
      credit-section.tsx      Buy on Credit page
      wishlist-section.tsx    Wishlist + Discover wishlists
      share-wishlist-dialog   Social share + canvas image
      ...
  lib/
    stores/                 Zustand stores (cart, auth, wishlist, recent-views)
    db.ts                   Prisma client singleton
    utils.ts                cn() + formatMoney()
public/
  acewears-logo.svg         Brand wordmark
  acewears-icon.svg         PWA icon
  hero-woman-3d.png         3D woman (transparent PNG)
  manifest.json             PWA manifest
  sw.js                     Service worker
prisma/
  schema.prisma             20+ models (runtime)
download/
  schema.sql                PostgreSQL production DDL""", story)

    # ---- Build ----
    doc.build(story, onFirstPage=on_first_page, onLaterPages=on_page)
    print(f"PDF generated: {output_path}")
    print(f"Size: {os.path.getsize(output_path) / 1024:.1f} KB")
    return output_path

if __name__ == '__main__':
    build_pdf()
