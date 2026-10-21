/**
 * Financial calculation and minor-unit formatting utilities.
 * All monetary amounts in MarketHub are stored as integer minor units (Paise: 100 paise = ₹1.00).
 */

export function toMinorUnits(amountInMajor: number): number {
  return Math.round(amountInMajor * 100);
}

export function toMajorUnits(amountInMinor: number): number {
  return amountInMinor / 100;
}

export function formatCurrency(
  amountInMinor: number,
  currency: string = 'INR',
  locale: string = 'en-IN',
): string {
  const major = toMajorUnits(amountInMinor);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(major);
}

/**
 * Calculates platform commission and vendor net payout from subtotal and commission rate in Basis Points (bps).
 * 1000 bps = 10.00%
 */
export function calculateCommission(
  subtotalMinor: number,
  commissionRateBps: number,
): { commissionMinor: number; netPayoutMinor: number } {
  // Ensure integer arithmetic
  const commissionMinor = Math.round((subtotalMinor * commissionRateBps) / 10000);
  const netPayoutMinor = subtotalMinor - commissionMinor;
  return { commissionMinor, netPayoutMinor };
}
