import type { Metadata } from "next";
import { Poppins, Fraunces } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
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
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: accent[600],
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
          <style dangerouslySetInnerHTML={{ __html: accentCss }} />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
