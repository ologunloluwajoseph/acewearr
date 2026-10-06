"use client";

import { useLanguage, type LanguageCode } from "@/lib/stores/settings-store";

// ============================================================================
//  AceWears i18n — Lightweight translation system
//  All UI strings live here. The `useTranslation()` hook reads from the
//  global settings store so changing language in Settings instantly updates
//  every label across the site.
// ============================================================================

type Dict = Record<string, string>;

const en: Dict = {
  // Nav
  "nav.home": "Home",
  "nav.shop": "Shop All",
  "nav.studio": "AI Studio",
  "nav.reels": "AceReels",
  "nav.wishlist": "My Wishlist",
  "nav.discover": "Discover",
  "nav.tradein": "Trade-In Portal",
  "nav.premium": "Activate Premium",
  "nav.dashboard": "Dashboard",
  "nav.credit": "Buy on Credit",
  "nav.accountDetails": "Account Details",
  "nav.purchases": "Purchase History",
  "nav.payment": "Payment & Payouts",
  "nav.settings": "Settings",
  "nav.terms": "Terms & Privacy",
  // Hero
  "hero.badge": "New season · Autumn 2026",
  "hero.shopCollection": "Shop the collection",
  "hero.aiTryOn": "AI Virtual Try-On",
  "hero.watchReels": "Watch AceReels",
  "hero.tagline": "Italian-milled fabric · AI-assisted fit · Shoppable reels · Circular trade-in",
  "hero.stat.buyers": "Verified buyers",
  "hero.stat.rating": "Avg rating",
  "hero.stat.returns": "Return rate*",
  // Cart
  "cart.title": "Your cart",
  "cart.empty": "Your cart is empty",
  "cart.continueShopping": "Continue shopping",
  "cart.subtotal": "Subtotal",
  "cart.checkout": "Checkout with Paystack",
  "cart.freeShipping": "Free shipping over",
  "cart.unlocked": "You unlocked free shipping",
  "cart.secure": "Secure payment via Paystack · Free returns within 30 days",
  // Sections
  "section.featured": "Featured",
  "section.viewAll": "View all",
  "section.almostGone": "Almost gone",
  "section.scarcityHint": "Real-time inventory alerts",
  // Product
  "product.addToCart": "Add to cart",
  "product.tryOn": "Try On",
  "product.soldOut": "Sold out",
  "product.selectSize": "Select size",
  "product.sizeGuide": "Size guide",
  "product.description": "Description",
  "product.reviews": "Reviews",
  // Credit
  "credit.title": "Buy on Credit",
  "credit.available": "Available credit",
  "credit.used": "Credit used",
  "credit.limit": "Lifetime limit",
  "credit.shopWithCredit": "Shop with credit",
  "credit.history": "Credit history",
  "credit.benefits": "Your credit benefits",
  // Common
  "common.signOut": "Sign out",
  "common.signIn": "Sign in",
  "common.save": "Save",
  "common.cancel": "Cancel",
  "common.close": "Close",
};

// Nigerian languages — Yoruba, Hausa, Igbo (with flag-appropriate translations)
const yo: Dict = {
  ...en,
  "nav.home": "Ile",
  "nav.shop": "Ra Gbogbo",
  "nav.wishlist": "Ifẹkọ mi",
  "hero.shopCollection": "Ra awọn ẹwu",
  "hero.aiTryOn": "AI Virtual Try-On",
  "hero.watchReels": "Wo AceReels",
  "cart.title": "Apọ rẹ",
  "cart.empty": "Apọ rẹ ko si nkan",
  "cart.subtotal": "Iyipada",
  "cart.checkout": "Sanwo pẹlu Paystack",
  "credit.title": "Ra lori GIGÉ",
  "credit.available": "GIGÉ ti wa",
  "credit.shopWithCredit": "Ra pẹlu GIGÉ",
  "common.signOut": "Jade",
  "common.save": "Fi pamọ",
  "common.cancel": "Nùkọ",
};

const ha: Dict = {
  ...en,
  "nav.home": "Gida",
  "nav.shop": "Sayi Duka",
  "nav.wishlist": "Bukatata na",
  "hero.shopCollection": "Sayi kayan tsafi",
  "cart.title": "Kwandon ka",
  "cart.empty": "Kwandon ka babu komai",
  "cart.subtotal": "Jimmilla",
  "cart.checkout": "Biya da Paystack",
  "credit.title": "Sayi a kan Lada",
  "common.signOut": "Fita",
  "common.save": "Ajiye",
};

const ig: Dict = {
  ...en,
  "nav.home": "Ụlọ",
  "nav.shop": "Zụta Ihe Niile",
  "nav.wishlist": "Ihe m chọrọ",
  "hero.shopCollection": "Zụta uwe",
  "cart.title": "Akpa gị",
  "cart.empty": "Akpa gị tọgbọ",
  "cart.subtotal": "Ngụkọta",
  "cart.checkout": "Kwụọ ya na Paystack",
  "credit.title": "Zụta na Echiche",
  "common.signOut": "Pụọ",
  "common.save": "Chekwaa",
};

const fr: Dict = {
  ...en,
  "nav.home": "Accueil",
  "nav.shop": "Tout Acheter",
  "nav.wishlist": "Ma Liste de Souhaits",
  "hero.shopCollection": "Acheter la collection",
  "hero.aiTryOn": "Essayage Virtuel IA",
  "hero.watchReels": "Regarder AceReels",
  "cart.title": "Votre panier",
  "cart.empty": "Votre panier est vide",
  "cart.subtotal": "Sous-total",
  "cart.checkout": "Payer avec Paystack",
  "credit.title": "Acheter à Crédit",
  "common.signOut": "Déconnexion",
  "common.save": "Enregistrer",
  "common.cancel": "Annuler",
};

const es: Dict = {
  ...en,
  "nav.home": "Inicio",
  "nav.shop": "Comprar Todo",
  "nav.wishlist": "Mi Lista de Deseos",
  "hero.shopCollection": "Comprar la colección",
  "hero.aiTryOn": "Probador Virtual IA",
  "hero.watchReels": "Ver AceReels",
  "cart.title": "Tu carrito",
  "cart.empty": "Tu carrito está vacío",
  "cart.subtotal": "Subtotal",
  "cart.checkout": "Pagar con Paystack",
  "credit.title": "Comprar a Crédito",
  "common.signOut": "Cerrar sesión",
  "common.save": "Guardar",
};

const de: Dict = {
  ...en,
  "nav.home": "Startseite",
  "nav.shop": "Alles Kaufen",
  "nav.wishlist": "Meine Wunschliste",
  "hero.shopCollection": "Kollektion kaufen",
  "cart.title": "Ihr Warenkorb",
  "cart.empty": "Ihr Warenkorb ist leer",
  "cart.subtotal": "Zwischensumme",
  "cart.checkout": "Mit Paystack bezahlen",
  "common.signOut": "Abmelden",
  "common.save": "Speichern",
};

const zh: Dict = {
  ...en,
  "nav.home": "首页",
  "nav.shop": "全部商品",
  "nav.wishlist": "我的心愿单",
  "hero.shopCollection": "购买系列",
  "hero.aiTryOn": "AI 虚拟试穿",
  "hero.watchReels": "观看 AceReels",
  "cart.title": "购物车",
  "cart.empty": "购物车是空的",
  "cart.subtotal": "小计",
  "cart.checkout": "使用 Paystack 结账",
  "common.signOut": "退出",
  "common.save": "保存",
};

const pt: Dict = {
  ...en,
  "nav.home": "Início",
  "nav.shop": "Comprar Tudo",
  "nav.wishlist": "Minha Lista de Desejos",
  "cart.title": "Seu carrinho",
  "cart.empty": "Seu carrinho está vazio",
  "cart.subtotal": "Subtotal",
  "cart.checkout": "Pagar com Paystack",
  "common.signOut": "Sair",
  "common.save": "Salvar",
};

const ar: Dict = {
  ...en,
  "nav.home": "الرئيسية",
  "nav.shop": "تسوق الكل",
  "cart.title": "سلة التسوق",
  "cart.empty": "سلتك فارغة",
  "cart.subtotal": "المجموع الفرعي",
  "cart.checkout": "ادفع مع Paystack",
  "common.signOut": "تسجيل الخروج",
};

const sw: Dict = {
  ...en,
  "nav.home": "Nyumbani",
  "nav.shop": "Nunua Zote",
  "cart.title": "Kikapu chako",
  "cart.empty": "Kikapu chako kime tupu",
  "cart.subtotal": "Jumla ndogo",
  "cart.checkout": "Lipa na Paystack",
  "common.signOut": "Toka",
};

const DICTIONARIES: Record<LanguageCode, Dict> = { en, fr, es, de, zh, yo, ha, ig, pt, ar, sw };

export function useTranslation() {
  const language = useLanguage();
  const dict = DICTIONARIES[language] || en;

  return {
    t: (key: string): string => dict[key] || en[key] || key,
    language,
  };
}

// Currency conversion (lives here so components import from one place)
export const EXCHANGE_RATES: Record<string, number> = {
  USD: 1, NGN: 1600, EUR: 0.92, GBP: 0.79,
};

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$", NGN: "₦", EUR: "€", GBP: "£",
};

export const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar", flag: "🇺🇸" },
  { code: "NGN", symbol: "₦", name: "Nigerian Naira", flag: "🇳🇬" },
  { code: "EUR", symbol: "€", name: "Euro", flag: "🇪🇺" },
  { code: "GBP", symbol: "£", name: "British Pound", flag: "🇬🇧" },
];

export function useFormatPrice() {
  const currency = useGlobalSettings((s) => s.currency);
  return (centsUSD: number): string => {
    const rate = EXCHANGE_RATES[currency] || 1;
    const amount = (centsUSD / 100) * rate;
    const symbol = CURRENCY_SYMBOLS[currency] || "$";
    if (currency === "NGN") return `${symbol}${Math.round(amount).toLocaleString()}`;
    return `${symbol}${amount.toFixed(2)}`;
  };
}

// Dual price format (USD on top, local below) — always available
export function formatDual(centsUSD: number, userCurrency: string = "NGN") {
  const usdRate = EXCHANGE_RATES["USD"];
  const usdAmount = (centsUSD / 100) * usdRate;
  const usdStr = `$${usdAmount.toFixed(2)}`;

  if (userCurrency === "USD") return { primary: usdStr, secondary: null };

  const localRate = EXCHANGE_RATES[userCurrency] || 1;
  const localAmount = (centsUSD / 100) * localRate;
  const localSymbol = CURRENCY_SYMBOLS[userCurrency] || "$";
  const localStr = userCurrency === "NGN"
    ? `${localSymbol}${Math.round(localAmount).toLocaleString()}`
    : `${localSymbol}${localAmount.toFixed(2)}`;

  return { primary: localStr, secondary: usdStr };
}

// Re-export the store hook for convenience
import { useGlobalSettings } from "@/lib/stores/settings-store";
