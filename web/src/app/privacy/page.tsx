import Link from "next/link";
import { CLINIC_NAME } from "@/lib/constants";
import MarketingHeader from "@/components/marketing/MarketingHeader";
import MarketingFooter from "@/components/marketing/MarketingFooter";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-sand-50 text-ink-950 flex flex-col">
      <MarketingHeader />

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-16">
        <h1 className="font-display text-4xl md:text-5xl mb-2">Privacy Policy</h1>
        <p className="text-sm text-ink-950/40 mb-10">Last updated: [Insert Date]</p>

        <div className="bg-turq-300/15 border border-turq-500/30 text-ink-950/80 text-sm rounded-sm p-4 mb-10">
          This page is a starting template, not legal advice. Because this site collects health
          information, please have it reviewed by a qualified lawyer familiar with the healthcare
          privacy laws in your jurisdiction (e.g. HIPAA in the US, UK GDPR/DPA 2018 in the UK,
          GDPR in the EU) before publishing it live.
        </div>

        <div className="space-y-8 text-ink-950/70 leading-relaxed">
          <section>
            <h2 className="font-display text-xl text-ink-950 mb-2">1. Information We Collect</h2>
            <p>
              When you create an account or book an appointment with {CLINIC_NAME}, we collect
              information such as your name, email address, phone number, mailing address, date
              of birth, gender, and relevant medical history (including chronic conditions) that
              you choose to share with us. We also record appointment and treatment history as
              part of providing dental care.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-ink-950 mb-2">2. How We Use Your Information</h2>
            <p>
              We use your information to schedule and manage appointments, provide dental
              treatment and follow-up care, communicate with you about your visits, process
              billing and payments, and comply with legal and regulatory record-keeping
              requirements.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-ink-950 mb-2">3. Who Can Access Your Information</h2>
            <p>
              Your medical and personal information is only accessible to clinic staff directly
              involved in your care (your dentist and authorized front-desk/administrative staff)
              on a need-to-know basis. We do not sell your personal information to third parties.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-ink-950 mb-2">4. Data Security</h2>
            <p>
              We use industry-standard safeguards, including encrypted connections and
              access-controlled accounts, to protect your information. No system is completely
              secure, and we encourage you to use a strong, unique password for your account.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-ink-950 mb-2">5. Your Rights</h2>
            <p>
              You may request access to, correction of, or deletion of your personal information
              by contacting us at the details on our{" "}
              <Link href="/contact" className="text-turq-600 underline">Contact page</Link>.
              Some information may need to be retained to comply with medical record-keeping
              laws even after a deletion request.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-ink-950 mb-2">6. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, please reach out via our{" "}
              <Link href="/contact" className="text-turq-600 underline">Contact page</Link>.
            </p>
          </section>
        </div>
      </main>

      {/* ── Footer ── */}
      <MarketingFooter />
    </div>
  );
}
