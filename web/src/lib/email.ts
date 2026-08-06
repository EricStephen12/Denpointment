import { Resend } from "resend";
import { CLINIC_NAME } from "@/lib/constants";
import { formatNaira } from "@/lib/currency";
import { getSiteContent } from "@/lib/site";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.EMAIL_FROM || "onboarding@resend.dev";

async function clinicName(): Promise<string> {
  try {
    const site = await getSiteContent();
    return site.clinicName;
  } catch {
    return CLINIC_NAME;
  }
}

/**
 * Sends an email via Resend. Silently no-ops (with a console warning) if
 * RESEND_API_KEY isn't configured, so booking/other flows never fail just
 * because email isn't set up yet in this environment.
 */
async function sendEmail(to: string, subject: string, html: string) {
  if (!resend) {
    console.warn(`[email] RESEND_API_KEY not set — skipped email "${subject}" to ${to}`);
    return;
  }
  try {
    await resend.emails.send({ from: FROM_EMAIL, to, subject, html });
  } catch (error) {
    console.error("[email] Failed to send:", error);
  }
}

export async function sendAppointmentConfirmationEmail(params: {
  to: string;
  patientName: string;
  dentistName: string;
  room: string;
  date: Date;
  hour: number;
}) {
  const { to, patientName, dentistName, room, date, hour } = params;
  const dateLabel = date.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const name = await clinicName();
  await sendEmail(
    to,
    `Appointment Confirmed — ${name}`,
    `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #0f172a;">Your appointment is confirmed</h2>
        <p>Hi ${patientName},</p>
        <p>Your appointment with <strong>Dr. ${dentistName}</strong> at ${name} has been booked:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px 0; color: #64748b;">Date</td><td style="padding: 8px 0; font-weight: 600;">${dateLabel}</td></tr>
          <tr><td style="padding: 8px 0; color: #64748b;">Time</td><td style="padding: 8px 0; font-weight: 600;">${hour}:00</td></tr>
          <tr><td style="padding: 8px 0; color: #64748b;">Room</td><td style="padding: 8px 0; font-weight: 600;">${room}</td></tr>
        </table>
        <p>If you need to reschedule or cancel, please sign in to your patient portal or contact the clinic.</p>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 32px;">${name}</p>
      </div>
    `
  );
}

export async function sendAppointmentReminderEmail(params: {
  to: string;
  patientName: string;
  dentistName: string;
  room: string;
  date: Date;
  hour: number;
}) {
  const { to, patientName, dentistName, room, date, hour } = params;
  const dateLabel = date.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const name = await clinicName();
  await sendEmail(
    to,
    `Reminder: Your appointment is coming up — ${name}`,
    `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #0f172a;">Appointment Reminder</h2>
        <p>Hi ${patientName},</p>
        <p>This is a reminder for your upcoming appointment with <strong>Dr. ${dentistName}</strong>:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px 0; color: #64748b;">Date</td><td style="padding: 8px 0; font-weight: 600;">${dateLabel}</td></tr>
          <tr><td style="padding: 8px 0; color: #64748b;">Time</td><td style="padding: 8px 0; font-weight: 600;">${hour}:00</td></tr>
          <tr><td style="padding: 8px 0; color: #64748b;">Room</td><td style="padding: 8px 0; font-weight: 600;">${room}</td></tr>
        </table>
        <p>See you soon! If you can no longer make it, please cancel or reschedule as early as possible.</p>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 32px;">${name}</p>
      </div>
    `
  );
}

export async function sendPaymentReceiptEmail(params: {
  to: string;
  patientName: string;
  amount: number;
  serviceName: string;
}) {
  const { to, patientName, amount, serviceName } = params;

  const name = await clinicName();
  await sendEmail(
    to,
    `Payment Received — ${name}`,
    `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #0f172a;">Payment Received</h2>
        <p>Hi ${patientName},</p>
        <p>We've received your payment of <strong>${formatNaira(amount)}</strong> for <strong>${serviceName}</strong>. Thank you!</p>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 32px;">${name}</p>
      </div>
    `
  );
}

export async function sendContactInquiryEmail(params: {
  to: string;
  fromName: string;
  fromEmail: string;
  message: string;
  clinicName: string;
}) {
  const { to, fromName, fromEmail, message, clinicName: name } = params;
  const safeMessage = message.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const safeName = fromName.replace(/</g, "&lt;").replace(/>/g, "&gt;");

  if (!resend) {
    console.warn(`[email] RESEND_API_KEY not set — contact inquiry from ${fromEmail} logged only`);
    console.info(`[contact] ${safeName} <${fromEmail}>: ${message}`);
    throw new Error("Email is not configured on the server.");
  }

  await sendEmail(
    to,
    `Website inquiry — ${name}`,
    `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #0f172a;">New website inquiry</h2>
        <p><strong>From:</strong> ${safeName} &lt;${fromEmail}&gt;</p>
        <p style="white-space: pre-wrap; margin-top: 16px;">${safeMessage}</p>
      </div>
    `
  );
}
