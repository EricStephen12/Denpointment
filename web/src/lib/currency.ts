/** Formats an amount in Nigerian Naira, e.g. 25000 -> "₦25,000". */
export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString("en-NG")}`;
}
