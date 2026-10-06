/**
 * AceWears Currency Conversion + Language/Flag utilities
 */

// Exchange rates relative to USD (1 USD = X units)
// In production these would come from a live API like exchangerate-api.com
export const EXCHANGE_RATES: Record<string, number> = {
  USD: 1,
  NGN: 1600,    // 1 USD = ₦1,600
  EUR: 0.92,
  GBP: 0.79,
};

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  NGN: "₦",
  EUR: "€",
  GBP: "£",
};

export const CURRENCY_NAMES: Record<string, string> = {
  USD: "US Dollar",
  NGN: "Nigerian Naira",
  EUR: "Euro",
  GBP: "British Pound",
};

export const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar", flag: "🇺🇸" },
  { code: "NGN", symbol: "₦", name: "Nigerian Naira", flag: "🇳🇬" },
  { code: "EUR", symbol: "€", name: "Euro", flag: "🇪🇺" },
  { code: "GBP", symbol: "£", name: "British Pound", flag: "🇬🇧" },
];

/**
 * Convert cents (stored in USD) to the target currency.
 * Returns the amount in the target currency (not cents).
 */
export function convertCents(centsUSD: number, targetCurrency: string): number {
  const rate = EXCHANGE_RATES[targetCurrency] || 1;
  return (centsUSD / 100) * rate;
}

/**
 * Format a price in the user's chosen currency.
 * @param centsUSD - the price in USD cents (as stored in DB)
 * @param currency - target currency code
 */
export function formatPrice(centsUSD: number, currency: string = "USD"): string {
  const amount = convertCents(centsUSD, currency);
  const symbol = CURRENCY_SYMBOLS[currency] || "$";

  if (currency === "NGN") {
    return `${symbol}${Math.round(amount).toLocaleString()}`;
  }
  return `${symbol}${amount.toFixed(2)}`;
}

/**
 * Format a price showing BOTH USD and the user's currency.
 * Returns e.g. "$289.00 (₦462,400)" when user selected NGN.
 */
export function formatPriceDual(centsUSD: number, userCurrency: string = "USD"): { usd: string; local: string | null } {
  const usd = formatPrice(centsUSD, "USD");
  const local = userCurrency !== "USD" ? formatPrice(centsUSD, userCurrency) : null;
  return { usd, local };
}

// ============================================================================
//  Language + Flag data
// ============================================================================
export const LANGUAGES = [
  { code: "en", name: "English",     flag: "🇬🇧", native: "English" },
  { code: "fr", name: "French",      flag: "🇫🇷", native: "Français" },
  { code: "es", name: "Spanish",     flag: "🇪🇸", native: "Español" },
  { code: "de", name: "German",      flag: "🇩🇪", native: "Deutsch" },
  { code: "zh", name: "Chinese",     flag: "🇨🇳", native: "中文" },
  { code: "yo", name: "Yoruba",      flag: "🇳🇬", native: "Yorùbá" },
  { code: "ha", name: "Hausa",        flag: "🇳🇬", native: "Hausa" },
  { code: "ig", name: "Igbo",        flag: "🇳🇬", native: "Igbo" },
  { code: "pt", name: "Portuguese",  flag: "🇵🇹", native: "Português" },
  { code: "ar", name: "Arabic",      flag: "🇸🇦", native: "العربية" },
  { code: "sw", name: "Swahili",     flag: "🇰🇪", native: "Kiswahili" },
];

export function getLanguageByCode(code: string) {
  return LANGUAGES.find(l => l.code === code) || LANGUAGES[0];
}

export function getCountryFlag(languageCode: string): string {
  return getLanguageByCode(languageCode).flag;
}

// Currency-to-country flag mapping (for showing on dashboard)
export function getCurrencyFlag(currencyCode: string): string {
  const c = CURRENCIES.find(c => c.code === currencyCode);
  return c?.flag || "🌐";
}
