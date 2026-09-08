import { Resend } from "resend";
import { CLINIC_NAME } from "@/lib/constants";
import { formatNaira } from "@/lib/currency";
import { formatAppointmentDate, type CalendarDay } from "@/lib/clinic-date";
import { getSiteContent } from "@/lib/site";

const rawApiKey = (process.env.RESEND_API_KEY || "").trim();
const isKeyConfigured = rawApiKey.startsWith("re_") && rawApiKey.length > 10 && !rawApiKey.includes("...");
const resend = isKeyConfigured ? new Resend(rawApiKey) : null;
export function getFromEmail(): string {
  const env = (process.env.EMAIL_FROM || "").trim();
  // If explicitly set and not using the restricted sandbox testing address, use it
  if (env && !env.includes("onboarding@resend.dev")) {
    return env;
  }
  // Default to the clinic's verified Resend domain
  return "Glow Dental Clinic <care@glowdentalklinic.com>";
}

export function isEmailConfigured(): boolean {
  return resend !== null;
}

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
    return { success: false, error: "RESEND_API_KEY not configured" };
  }
  try {
    const from = getFromEmail();
    const { data, error } = await resend.emails.send({ from, to, subject, html });
    if (error) {
      console.error("[email] Resend delivery error:", error);
      return { success: false, error };
    }
    return { success: true, data };
  } catch (error) {
    console.error("[email] Failed to send:", error);
    return { success: false, error };
  }
}

export async function sendAppointmentConfirmationEmail(params: {
  to: string;
  patientName: string;
  dentistName: string;
  room: string;
  date: CalendarDay;
  hour: number;
  serviceName?: string;
}) {
  const { to, patientName, dentistName, room, date, hour, serviceName } = params;
  const dateLabel = formatAppointmentDate(date);

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
          ${serviceName ? `<tr><td style="padding: 8px 0; color: #64748b;">Procedure</td><td style="padding: 8px 0; font-weight: 600; color: #248473;">${serviceName}</td></tr>` : ""}
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
  date: CalendarDay;
  hour: number;
}) {
  const { to, patientName, dentistName, room, date, hour } = params;
  const dateLabel = formatAppointmentDate(date);

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
    return { sent: false as const };
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
  return { sent: true as const };
}

export async function sendPasswordResetEmail(params: {
  to: string;
  resetUrl: string;
  name?: string;
}) {
  const { to, resetUrl, name: patientName = "there" } = params;
  const clinic = await clinicName();

  if (!resend) {
    console.warn(`[email] RESEND_API_KEY not set — password reset link for ${to}: ${resetUrl}`);
    return { sent: false as const };
  }

  const res = await sendEmail(
    to,
    `Reset Your Password — ${clinic}`,
    `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; color: #0f172a; line-height: 1.5;">
        <div style="border-bottom: 2px solid #248473; padding-bottom: 16px; margin-bottom: 24px;">
          <h2 style="margin: 0; color: #0f172a; font-size: 20px; letter-spacing: -0.02em;">${clinic}</h2>
        </div>
        <h3 style="font-size: 18px; margin: 0 0 12px 0;">Reset your password</h3>
        <p style="margin: 0 0 16px 0; color: #475569;">Hello ${patientName},</p>
        <p style="margin: 0 0 24px 0; color: #475569;">We received a request to reset the password for your ${clinic} account. Click the button below to choose a new password:</p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${resetUrl}" style="background-color: #248473; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 9999px; font-weight: 600; font-size: 14px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="font-size: 13px; color: #94a3b8; margin: 24px 0 8px 0;">This password reset link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.</p>
        <p style="font-size: 12px; color: #cbd5e1; word-break: break-all; margin: 0;">Link: ${resetUrl}</p>
      </div>
    `
  );
  return { sent: Boolean(res?.success) };
}

/**
 * Birthday Automation: Send warm, personal birthday greetings to a patient.
 */
export async function sendBirthdayEmail(params: {
  to: string;
  patientName: string;
  subject?: string;
  customMessage?: string;
}) {
  const { to, patientName, subject, customMessage } = params;
  const clinic = await clinicName();
  const emailSubject = subject || `Happy Birthday from ${clinic}! 🎂`;

  const defaultMsg =
    `The entire dental care team at ${clinic} wishes you a wonderful birthday filled with health, joy, and plenty of reasons to smile bright! Thank you for trusting us with your dental care.`;
  const messageBody = (customMessage || defaultMsg).replace(/\n/g, "<br />");

  if (!resend) {
    console.info(`[automations:birthday] (Simulated) Sent to ${patientName} <${to}>: "${emailSubject}"`);
    return { sent: true as const, simulated: true };
  }

  const res = await sendEmail(
    to,
    emailSubject,
    `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 32px 24px; color: #0f172a; line-height: 1.6; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0;">
        <div style="text-align: center; margin-bottom: 24px;">
          <p style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: #248473; margin: 0 0 6px 0;">${clinic}</p>
          <h1 style="font-size: 26px; margin: 0; color: #0f172a; font-weight: 700; letter-spacing: -0.02em;">Happy Birthday, ${patientName}! 🎉</h1>
        </div>
        <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid #edf2f7; text-align: center;">
          <span style="font-size: 40px; display: block; margin-bottom: 12px;">🎂</span>
          <p style="font-size: 16px; color: #334155; margin: 0; line-height: 1.6;">${messageBody}</p>
        </div>
        <p style="font-size: 14px; color: #64748b; text-align: center; margin: 0 0 24px 0;">Here's to celebrating you and keeping your smile vibrant for years to come.</p>
        <div style="text-align: center; border-top: 1px solid #f1f5f9; padding-top: 20px;">
          <p style="font-size: 12px; color: #94a3b8; margin: 0;">Warm regards,<br /><strong>Your Dental Team at ${clinic}</strong></p>
        </div>
      </div>
    `
  );
  return { sent: Boolean(res?.success), simulated: false };
}

/**
 * Anniversary Automation: Celebrate a patient's smile milestone with the clinic.
 */
export async function sendAnniversaryEmail(params: {
  to: string;
  patientName: string;
  years?: number;
  subject?: string;
  customMessage?: string;
}) {
  const { to, patientName, years = 1, subject, customMessage } = params;
  const clinic = await clinicName();
  const emailSubject = subject || `Happy Smile Anniversary with ${clinic}! ✨`;

  const yearsLabel = years > 1 ? `${years} years` : "1 year";
  const defaultMsg =
    `It's been ${yearsLabel} since your journey with ${clinic} began! We want to express our heartfelt gratitude for trusting our doctors with your dental wellness. We're proud to be part of your smile story.`;
  const messageBody = (customMessage || defaultMsg).replace(/\n/g, "<br />");

  if (!resend) {
    console.info(`[automations:anniversary] (Simulated) Sent to ${patientName} <${to}>: "${emailSubject}"`);
    return { sent: true as const, simulated: true };
  }

  const res = await sendEmail(
    to,
    emailSubject,
    `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 32px 24px; color: #0f172a; line-height: 1.6; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0;">
        <div style="text-align: center; margin-bottom: 24px;">
          <p style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: #248473; margin: 0 0 6px 0;">${clinic}</p>
          <h1 style="font-size: 26px; margin: 0; color: #0f172a; font-weight: 700; letter-spacing: -0.02em;">Happy Anniversary, ${patientName}! ✨</h1>
        </div>
        <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid #edf2f7; text-align: center;">
          <span style="font-size: 40px; display: block; margin-bottom: 12px;">🌟</span>
          <p style="font-size: 16px; color: #334155; margin: 0; line-height: 1.6;">${messageBody}</p>
        </div>
        <div style="text-align: center; border-top: 1px solid #f1f5f9; padding-top: 20px;">
          <p style="font-size: 12px; color: #94a3b8; margin: 0;">With appreciation,<br /><strong>Your Team at ${clinic}</strong></p>
        </div>
      </div>
    `
  );
  return { sent: Boolean(res?.success), simulated: false };
}

/**
 * Promo / Broadcast Announcement: Send targeted promotional or announcement emails.
 */
export async function sendBroadcastEmail(params: {
  to: string;
  patientName: string;
  subject: string;
  headline?: string;
  content: string;
  category?: string;
  ctaLabel?: string;
  ctaUrl?: string;
}) {
  const { to, patientName, subject, headline, content, category = "broadcast", ctaLabel, ctaUrl } = params;
  const clinic = await clinicName();
  const safeContent = content.replace(/\n/g, "<br />");
  const isPromo = category === "promo";

  if (!resend) {
    console.info(`[campaign:${category}] (Simulated) Sent to ${patientName} <${to}>: "${subject}"`);
    return { sent: true as const, simulated: true };
  }

  const res = await sendEmail(
    to,
    subject,
    `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #0f172a; line-height: 1.6; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0;">
        <div style="border-bottom: 2px solid #248473; padding-bottom: 16px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between;">
          <h2 style="margin: 0; color: #0f172a; font-size: 20px; font-weight: 700;">${clinic}</h2>
          ${isPromo ? `<span style="font-size: 11px; font-weight: 700; text-transform: uppercase; background-color: #f0fdf4; color: #15803d; padding: 4px 10px; border-radius: 9999px; border: 1px solid #bbf7d0;">Special Offer</span>` : ""}
        </div>
        ${headline ? `<h1 style="font-size: 22px; color: #0f172a; margin: 0 0 16px 0; font-weight: 700;">${headline}</h1>` : ""}
        <p style="font-size: 15px; color: #475569; margin: 0 0 16px 0;">Hello ${patientName},</p>
        <div style="font-size: 15px; color: #334155; line-height: 1.7; margin-bottom: 28px;">${safeContent}</div>
        ${
          ctaLabel && ctaUrl
            ? `
          <div style="text-align: center; margin: 28px 0;">
            <a href="${ctaUrl}" style="background-color: #248473; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 9999px; font-weight: 600; font-size: 14px; display: inline-block;">
              ${ctaLabel}
            </a>
          </div>
        `
            : ""
        }
        <div style="border-top: 1px solid #f1f5f9; padding-top: 20px; text-align: center;">
          <p style="font-size: 12px; color: #94a3b8; margin: 0;">Best regards,<br /><strong>${clinic}</strong></p>
        </div>
      </div>
    `
  );
  return { sent: Boolean(res?.success), simulated: false };
}


