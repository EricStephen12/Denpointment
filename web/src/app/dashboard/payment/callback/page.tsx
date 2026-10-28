import Link from "next/link";
import { CheckCircle2, XCircle, ArrowRight, Receipt } from "lucide-react";
import { reconcilePaystackPayment } from "@/lib/paystack";
import { formatNaira } from "@/lib/currency";

export default async function PaymentCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string }>;
}) {
  const { reference } = await searchParams;

  if (!reference) {
    return (
      <div className="max-w-md mx-auto text-center py-16 px-4">
        <div className="dash-surface p-8 space-y-4 border border-red-500/20 bg-red-500/[0.03]">
          <XCircle className="h-12 w-12 text-red-400 mx-auto" />
          <h1 className="text-xl font-display text-sand-50">Missing Payment Reference</h1>
          <p className="text-xs text-sand-50/60">
            No transaction reference was provided in the return URL.
          </p>
          <Link
            href="/dashboard/portal/bills"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-turq-500 hover:bg-turq-400 text-ink-950 font-semibold text-xs transition-colors"
          >
            Go to My Bills
          </Link>
        </div>
      </div>
    );
  }

  // Directly verify against Paystack API and record payment in database
  const result = await reconcilePaystackPayment(reference);

  return (
    <div className="max-w-md mx-auto text-center py-16 px-4">
      {result.success ? (
        <div className="dash-surface p-8 space-y-4 border border-turq-500/20 bg-turq-500/[0.03] shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-turq-500/10 border border-turq-500/20 text-turq-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-9 w-9 text-turq-400" />
          </div>

          <h1 className="text-2xl font-display font-bold text-sand-50">Payment Confirmed!</h1>
          
          <p className="text-sm text-sand-50/70">
            {result.message || "Thank you! Your payment has been verified directly with Paystack and recorded in your clinic ledger."}
          </p>

          {result.amount && (
            <div className="py-2.5 px-5 rounded-xl bg-sand-50/5 border border-sand-50/10 inline-block font-mono text-xl text-turq-300 font-bold">
              {formatNaira(result.amount)}
            </div>
          )}

          <div className="pt-2 text-[11px] font-mono text-sand-50/40">
            Reference: {reference}
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/dashboard/portal/bills"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-turq-500 hover:bg-turq-400 text-ink-950 font-bold text-xs transition-colors"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>View My Bills</span>
            </Link>
            <Link
              href="/dashboard/appointments"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-sand-50/10 hover:bg-sand-50/15 text-sand-50 font-semibold text-xs transition-colors"
            >
              <span>Appointments</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="dash-surface p-8 space-y-4 border border-red-500/20 bg-red-500/[0.03] shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
            <XCircle className="h-9 w-9 text-red-400" />
          </div>

          <h1 className="text-2xl font-display font-bold text-sand-50">Payment Verification Issue</h1>
          
          <p className="text-sm text-sand-50/70">
            {result.message || "The payment could not be confirmed with Paystack. If you were debited, please contact the clinic with your reference."}
          </p>

          <div className="pt-2 text-[11px] font-mono text-sand-50/40">
            Reference: {reference}
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/dashboard/portal/bills"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-sand-50/10 hover:bg-sand-50/15 text-sand-50 font-semibold text-xs transition-colors"
            >
              <span>Back to My Bills</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
