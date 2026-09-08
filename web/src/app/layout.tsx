import type { Metadata } from "next";
import { Poppins, Fraunces } from "next/font/google";
import { getSiteContent, ACCENT_PRESETS } from "@/lib/site";
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

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteContent();
  return {
    title: {
      default: `${site.clinicName} — ${site.location}`,
      template: `%s | ${site.clinicName}`,
    },
    description: site.tagline,
    keywords: [
      "dentist kubwa",
      "dental clinic abuja",
      "glow dental",
      "teeth whitening kubwa",
      "dental care abuja",
      "orthodontist kubwa",
    ],
    openGraph: {
      title: site.clinicName,
      description: site.tagline,
      type: "website",
      locale: "en_NG",
      siteName: site.clinicName,
    },
    twitter: {
      card: "summary_large_image",
      title: site.clinicName,
      description: site.tagline,
    },
    other: {
      "contact:phone_number": site.phone,
      "contact:street_address": site.address,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const site = await getSiteContent();
  const accent = ACCENT_PRESETS[site.accentColor];

  // Overrides the turquoise theme variables with the accent the admin picked
  // in Dashboard → Website, recoloring the whole app without a rebuild.
  const accentCss = `:root {
    --color-turq-100: ${accent[100]};
    --color-turq-200: ${accent[200]};
    --color-turq-300: ${accent[300]};
    --color-turq-400: ${accent[400]};
    --color-turq-500: ${accent[500]};
    --color-turq-600: ${accent[600]};
    --color-turq-700: ${accent[700]};
  }`;

  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={`${poppins.variable} ${fraunces.variable} antialiased bg-ink-950 text-sand-50`}>
        <style dangerouslySetInnerHTML={{ __html: accentCss }} />
        {children}
      </body>
    </html>
  );
}
