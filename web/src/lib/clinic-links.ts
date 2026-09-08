import { CLINIC_ADDRESS, CLINIC_PHONE } from "@/lib/constants";

/** Nigeria local 0xxx → WhatsApp international digits (no +). */
export function phoneToWhatsAppDigits(phone: string = CLINIC_PHONE): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("234")) return digits;
  if (digits.startsWith("0")) return `234${digits.slice(1)}`;
  return digits;
}

export function clinicWhatsAppUrl(message?: string, phone: string = CLINIC_PHONE): string {
  const base = `https://wa.me/${phoneToWhatsAppDigits(phone)}`;
  if (!message?.trim()) return base;
  return `${base}?text=${encodeURIComponent(message.trim())}`;
}

export function clinicMapsSearchUrl(address: string = CLINIC_ADDRESS): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

/** Embeddable Google Maps search iframe (no API key required). */
export function clinicMapsEmbedUrl(address: string = CLINIC_ADDRESS): string {
  return `https://maps.google.com/maps?q=${encodeURIComponent(address)}&z=16&output=embed`;
}
