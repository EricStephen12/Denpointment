import Link from "next/link";
import { LEGAL_LAST_UPDATED } from "@/lib/constants";
import { getSiteContent } from "@/lib/site";
import MarketingHeader from "@/components/marketing/MarketingHeader";
import MarketingFooter from "@/components/marketing/MarketingFooter";

export default async function TermsOfServicePage() {
  const site = await getSiteContent();

  return (
    <div className="min-h-screen bg-sand-50 text-ink-950 flex flex-col">
      <MarketingHeader clinicName={site.clinicName} />

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-16">
        <h1 className="font-display text-4xl md:text-5xl mb-2">Terms of Service</h1>
        <p className="text-sm text-ink-950/40 mb-10">Last updated: {LEGAL_LAST_UPDATED}</p>

        <div className="bg-turq-300/15 border border-turq-500/30 text-ink-950/80 text-sm rounded-sm p-4 mb-10">
          This page is a starting template, not legal advice. Please have it reviewed by a
          qualified lawyer before publishing it live.
        </div>

        <div className="space-y-8 text-ink-950/70 leading-relaxed">
          <section>
            <h2 className="font-display text-xl text-ink-950 mb-2">1. Acceptance of Terms</h2>
            <p>
              By creating an account or booking an appointment through this website, you agree
              to these Terms of Service and our{" "}
              <Link href="/privacy" className="text-turq-600 underline">Privacy Policy</Link>.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-ink-950 mb-2">2. Appointments &amp; Cancellations</h2>
            <p>
              Appointments booked through this platform are subject to availability and clinic
              confirmation. Please cancel or reschedule at least 24 hours in advance where
              possible. Repeated no-shows may result in restrictions on future online booking.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-ink-950 mb-2">3. Medical Disclaimer</h2>
            <p>
              This platform is a scheduling and records tool for {site.clinicName}. It does not
              replace professional medical advice, diagnosis, or treatment. Always consult with
              your dentist directly regarding your specific dental and health needs. In a dental
              or medical emergency, contact your local emergency services immediately.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-ink-950 mb-2">4. Billing &amp; Payment</h2>
            <p>
              Charges for treatments are recorded by clinic staff and are due according to the
              clinic&apos;s payment policy, which may include insurance billing, at-visit payment,
              or invoicing depending on services rendered.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-ink-950 mb-2">5. Account Responsibility</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials
              and for all activity under your account. Notify us immediately of any unauthorized
              use.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-ink-950 mb-2">6. Changes to These Terms</h2>
            <p>
              We may update these Terms from time to time. Continued use of this platform after
              changes are posted constitutes acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-ink-950 mb-2">7. Contact Us</h2>
            <p>
              Questions about these Terms can be directed to us via our{" "}
              <Link href="/contact" className="text-turq-600 underline">Contact page</Link>.
            </p>
          </section>
        </div>
      </main>

      <MarketingFooter
        clinicName={site.clinicName}
        address={site.address}
        phone={site.phone}
        hoursLabel={site.hoursLabel}
      />
    </div>
  );
}
