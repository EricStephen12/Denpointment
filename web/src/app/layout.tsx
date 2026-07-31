import type { Metadata } from "next";
import { Poppins, Fraunces } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { CLINIC_NAME, CLINIC_TAGLINE, CLINIC_ADDRESS, CLINIC_PHONE } from "@/lib/constants";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

// Editorial display serif used for headlines on the public/marketing pages.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: {
    default: `${CLINIC_NAME} — Kubwa, Abuja`,
    template: `%s | ${CLINIC_NAME}`,
  },
  description: CLINIC_TAGLINE,
  keywords: [
    "dentist kubwa",
    "dental clinic abuja",
    "glow dental",
    "teeth whitening kubwa",
    "dental care abuja",
    "orthodontist kubwa",
  ],
  openGraph: {
    title: CLINIC_NAME,
    description: CLINIC_TAGLINE,
    type: "website",
    locale: "en_NG",
    siteName: CLINIC_NAME,
  },
  twitter: {
    card: "summary_large_image",
    title: CLINIC_NAME,
    description: CLINIC_TAGLINE,
  },
  other: {
    "contact:phone_number": CLINIC_PHONE,
    "contact:street_address": CLINIC_ADDRESS,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: '#248473', // turq-600
          colorForeground: '#060b0a', // ink-950
          colorMutedForeground: '#71717a',
          colorBackground: '#ffffff',
          colorInput: '#ffffff',
          colorInputForeground: '#060b0a',
          fontFamily: 'var(--font-poppins), sans-serif',
          borderRadius: '1rem',
        },
        elements: {
          formButtonPrimary: 'shadow-none hover:opacity-90 transition-opacity rounded-full',
          card: 'shadow-sm border border-ink-950/10 rounded-3xl w-full',
          headerTitle: 'hidden',
          headerSubtitle: 'hidden',
          socialButtonsBlockButton: 'border border-ink-950/10 hover:bg-sand-100 transition-all rounded-xl',
          formFieldInput: 'border-ink-950/15 rounded-xl focus:ring-turq-500 focus:border-turq-500',
        }
      }}
    >
      <html lang="en">
        <body className={`${poppins.variable} ${fraunces.variable} antialiased bg-ink-950 text-sand-50`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}