// Default website content. Admins can override most of these from
// Dashboard → Website (see lib/site.ts); these values are the fallbacks
// used until a value is saved there.
export const CLINIC_NAME = "Glow Dental";
export const CLINIC_SHORT_NAME = "Glow Dental";
export const CLINIC_TAGLINE = "Premium Dental Care in Kubwa, Abuja — Modern, Professional, Caring.";

export const CLINIC_ADDRESS = "Gado Nasko Rd, Kubwa, Abuja 901101, FCT";
export const CLINIC_PHONE = "0803 634 5839";
export const CLINIC_EMAIL = "hello@glowdentalclinic.com";
export const CLINIC_HOURS = "Mon – Sat · Open until 6 PM";
export const CLINIC_RATING = "4.6";
export const CLINIC_REVIEW_COUNT = "16";
export const CLINIC_LOCATION = "Kubwa, Abuja";

export const HERO_LINE_1 = "YOUR SMILE";
export const HERO_LINE_2 = "REFINED.";
export const PHILOSOPHY_LINE_1 = "WE OFTEN RUSH TO JUDGE BEAUTY AT FIRST GLANCE.";
export const PHILOSOPHY_LINE_2 = "ONLY AN EXPERT EYE CAN UNVEIL THE HIDDEN PERFECTION WITHIN.";

export const DEFAULT_PACKAGES = [
  { title: "THE ESSENTIAL", price: 25000, desc: "Exam, x-rays, and a full professional cleaning." },
  { title: "THE RADIANCE", price: 65000, desc: "In-clinic whitening, calibrated to your natural shade." },
  { title: "THE ALIGN", price: 150000, desc: "Braces / clear-aligner consultation and smile assessment." },
  { title: "THE MAKEOVER", price: 120000, desc: "Veneers, replacements, and full smile transformation planning." },
];

export const DEFAULT_SERVICES = [
  { name: "Consultation", price: 5000 },
  { name: "Pediatric Consultation", price: 10000 },
  { name: "Orthodontic Consultation", price: 10000 },
  { name: "Periapical X-ray (per quadrant)", price: 5000 },
  { name: "Scaling & Polishing", price: 45000 },
  { name: "Deep Scaling / Root Planing", price: 30000 },
  { name: "Simple Extraction", price: 45000 },
  { name: "Third Molar Surgical Extraction", price: 100000 },
  { name: "Composite Filling", price: 40000 },
  { name: "Glass Ionomer Filling", price: 30000 },
  { name: "Root Canal Treatment + PFM Crown", price: 200000 },
  { name: "Root Canal Treatment + Zirconia Crown", price: 250000 },
  { name: "Fiber Post & Core", price: 30000 },
  { name: "Removable Partial Denture", price: 35000, note: "Extra tooth ₦30,000" },
  { name: "Denture", price: 45000 },
  { name: "Teeth Whitening (per session)", price: 80000 },
  { name: "Orthodontic Braces", price: 1500000, note: "Case dependent. Starting price" },
  { name: "Retainer Replacement", price: 200000 },
  { name: "Clear Aligners", price: 3000000, note: "Case dependent. Starting price" },
  { name: "Dental Implant (per unit)", price: 1500000 },
  { name: "Recementation of Crown / Bridge", price: 35000 },
  { name: "Dry Socket Treatment", price: 30000 },
  { name: "Pulpectomy (primary tooth)", price: 100000 },
  { name: "Stainless Steel Crown", price: 50000 },
  { name: "Fluoride Application", price: 30000 },
  { name: "Intermaxillary Fixation", price: 250000 },
  { name: "Apexification", price: 120000 },
  { name: "Apicoectomy", price: 120000 },
] as const;

export const GLOW_PRICE_CATEGORIES = [
  {
    category: "Consultations & Diagnostics",
    items: [
      { name: "Consultation", price: 5000, note: "" },
      { name: "Pediatric Consultation", price: 10000, note: "" },
      { name: "Orthodontic Consultation", price: 10000, note: "" },
      { name: "Periapical X-ray", price: 5000, note: "Per quadrant" },
    ],
  },
  {
    category: "Preventive & Periodontics",
    items: [
      { name: "Scaling & Polishing", price: 45000, note: "" },
      { name: "Deep Scaling / Root Planing", price: 30000, note: "" },
      { name: "Teeth Whitening", price: 80000, note: "Per session" },
      { name: "Fluoride Application", price: 30000, note: "" },
    ],
  },
  {
    category: "Restorative & Endodontics",
    items: [
      { name: "Composite Filling", price: 40000, note: "" },
      { name: "Glass Ionomer Filling", price: 30000, note: "" },
      { name: "Root Canal Treatment + PFM Crown", price: 200000, note: "" },
      { name: "Root Canal Treatment + Zirconia Crown", price: 250000, note: "" },
      { name: "Fiber Post & Core", price: 30000, note: "" },
      { name: "Recementation of Crown / Bridge", price: 35000, note: "" },
      { name: "Apexification", price: 120000, note: "" },
      { name: "Apicoectomy", price: 120000, note: "" },
    ],
  },
  {
    category: "Oral Surgery & Extractions",
    items: [
      { name: "Simple Extraction", price: 45000, note: "" },
      { name: "Third Molar Surgical Extraction", price: 100000, note: "" },
      { name: "Dry Socket Treatment", price: 30000, note: "" },
      { name: "Intermaxillary Fixation", price: 250000, note: "" },
    ],
  },
  {
    category: "Prosthetics & Implants",
    items: [
      { name: "Removable Partial Denture", price: 35000, note: "Extra tooth ₦30,000" },
      { name: "Denture", price: 45000, note: "" },
      { name: "Dental Implant (per unit)", price: 1500000, note: "" },
    ],
  },
  {
    category: "Orthodontics",
    items: [
      { name: "Orthodontic Braces", price: 1500000, note: "Case dependent · Starting price" },
      { name: "Clear Aligners", price: 3000000, note: "Case dependent · Starting price" },
      { name: "Retainer Replacement", price: 200000, note: "" },
    ],
  },
  {
    category: "Pediatric Dentistry",
    items: [
      { name: "Pulpectomy (primary tooth)", price: 100000, note: "" },
      { name: "Stainless Steel Crown", price: 50000, note: "" },
      { name: "Fluoride Application", price: 30000, note: "" },
    ],
  },
] as const;

export const LEGAL_LAST_UPDATED = "August 6, 2026";
