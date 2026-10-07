export function cn(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

export const fmtKg = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(2)} t` : n > 0 && n < 1 ? `${Math.round(n * 1000)} g` : `${n.toFixed(1)} kg`;

/** Rough money amount, e.g. "≈ ₹1,50,000"; empty when unknown. */
export const fmtMoney = (amount: number | null | undefined, currency: string | null | undefined) => {
  if (amount == null || !currency) return "";
  try {
    const locale = currency === "INR" ? "en-IN" : undefined;
    return `≈ ${new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(amount)}`;
  } catch {
    return `≈ ${Math.round(amount).toLocaleString()} ${currency}`;
  }
};

export const fmtPct =(n: number) => `${Math.round(n * 100)}%`;
