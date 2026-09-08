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

/**
 * 1. Clinical Alert: Notify assigned dentist immediately when a patient schedules an appointment.
 */
export async function sendDentistNewAppointmentEmail(params: {
  to: string;
  dentistName: string;
  patientName: string;
  patientEmail: string;
  room: string;
  date: CalendarDay;
  hour: number;
  serviceName?: string;
}) {
  const { to, dentistName, patientName, patientEmail, room, date, hour, serviceName } = params;
  const dateLabel = formatAppointmentDate(date);
  const name = await clinicName();

  await sendEmail(
    to,
    `New Appointment: ${patientName} (${dateLabel} at ${hour}:00) — ${name}`,
    `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; color: #0f172a; line-height: 1.5; border: 1px solid #e2e8f0; border-radius: 16px;">
        <div style="border-bottom: 2px solid #248473; padding-bottom: 12px; margin-bottom: 20px;">
          <p style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: #248473; margin: 0;">${name} · Clinical Desk</p>
          <h2 style="font-size: 20px; margin: 4px 0 0 0; color: #0f172a;">New Patient Appointment</h2>
        </div>
        <p style="margin: 0 0 16px 0; color: #475569;">Hello <strong>Dr. ${dentistName}</strong>,</p>
        <p style="margin: 0 0 16px 0; color: #475569;">A new appointment has been scheduled for your operatory:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0; background: #f8fafc; border-radius: 12px; border: 1px solid #edf2f7;">
          <tr><td style="padding: 10px 14px; color: #64748b; font-size: 13px;">Patient</td><td style="padding: 10px 14px; font-weight: 600; font-size: 14px;">${patientName} &lt;${patientEmail}&gt;</td></tr>
          ${serviceName ? `<tr><td style="padding: 10px 14px; color: #64748b; font-size: 13px;">Procedure</td><td style="padding: 10px 14px; font-weight: 600; font-size: 14px; color: #248473;">${serviceName}</td></tr>` : ""}
          <tr><td style="padding: 10px 14px; color: #64748b; font-size: 13px;">Date &amp; Time</td><td style="padding: 10px 14px; font-weight: 600; font-size: 14px;">${dateLabel} at ${hour}:00</td></tr>
          <tr><td style="padding: 10px 14px; color: #64748b; font-size: 13px;">Operatory</td><td style="padding: 10px 14px; font-weight: 600; font-size: 14px;">Room ${room}</td></tr>
        </table>
        <p style="font-size: 13px; color: #64748b; margin-top: 20px;">You can view and manage your full patient schedule directly in your clinical dashboard.</p>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 28px; border-top: 1px solid #f1f5f9; padding-top: 12px;">${name} Practice Management</p>
      </div>
    `
  );
}

/**
 * 2. Cancellation Notice: Notify patient and dentist when an appointment is cancelled.
 */
export async function sendAppointmentCancellationEmail(params: {
  to: string;
  recipientName: string;
  otherPartyName: string;
  isDentist: boolean;
  room: string;
  date: CalendarDay;
  hour: number;
  serviceName?: string;
}) {
  const { to, recipientName, otherPartyName, isDentist, room, date, hour, serviceName } = params;
  const dateLabel = formatAppointmentDate(date);
  const name = await clinicName();

  const subject = isDentist
    ? `Schedule Notice: Appointment Cancelled (${otherPartyName}) — ${name}`
    : `Appointment Cancellation Confirmed — ${name}`;

  await sendEmail(
    to,
    subject,
    `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; color: #0f172a; line-height: 1.5; border: 1px solid #e2e8f0; border-radius: 16px;">
        <div style="border-bottom: 2px solid #ef4444; padding-bottom: 12px; margin-bottom: 20px;">
          <p style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: #ef4444; margin: 0;">${name}</p>
          <h2 style="font-size: 20px; margin: 4px 0 0 0; color: #0f172a;">Appointment Cancelled</h2>
        </div>
        <p style="margin: 0 0 16px 0; color: #475569;">Hello ${recipientName},</p>
        <p style="margin: 0 0 16px 0; color: #475569;">
          ${
            isDentist
              ? `The appointment with <strong>${otherPartyName}</strong> on <strong>${dateLabel} at ${hour}:00</strong> (Room ${room}) has been cancelled. This slot is now open in your schedule.`
              : `Your appointment with <strong>Dr. ${otherPartyName}</strong> on <strong>${dateLabel} at ${hour}:00</strong> has been cancelled.`
          }
        </p>
        ${serviceName ? `<p style="font-size: 13px; color: #64748b; margin-bottom: 16px;">Procedure: <strong>${serviceName}</strong></p>` : ""}
        ${
          !isDentist
            ? `<p style="font-size: 13px; color: #64748b; margin-top: 16px;">If you would like to reschedule for another date, you can sign in to your portal anytime to choose a new slot.</p>`
            : ""
        }
        <p style="color: #94a3b8; font-size: 12px; margin-top: 28px; border-top: 1px solid #f1f5f9; padding-top: 12px;">${name}</p>
      </div>
    `
  );
}

/**
 * 3. Digital Visit & Prescription Summary: Sent to patient upon clinical treatment logging.
 */
export async function sendTreatmentSummaryEmail(params: {
  to: string;
  patientName: string;
  dentistName: string;
  action: string;
  description?: string | null;
  toothNumber?: number | null;
  medicines?: Array<{
    name: string;
    dose?: string | null;
    frequency?: string | null;
    duration?: string | null;
    instructions?: string | null;
  }>;
}) {
  const { to, patientName, dentistName, action, description, toothNumber, medicines } = params;
  const name = await clinicName();

  const rxHtml =
    medicines && medicines.length > 0
      ? `
      <div style="margin-top: 20px;">
        <h3 style="font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 8px;">Prescriptions &amp; Medications:</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; background: #f8fafc; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0;">
          <thead>
            <tr style="background: #edf2f7; text-align: left; color: #475569;">
              <th style="padding: 8px 12px;">Medication</th>
              <th style="padding: 8px 12px;">Dosage</th>
              <th style="padding: 8px 12px;">Frequency</th>
              <th style="padding: 8px 12px;">Duration</th>
            </tr>
          </thead>
          <tbody>
            ${medicines
              .map(
                (m) => `
              <tr style="border-top: 1px solid #e2e8f0;">
                <td style="padding: 8px 12px; font-weight: 600;">${m.name}</td>
                <td style="padding: 8px 12px; color: #64748b;">${m.dose || "—"}</td>
                <td style="padding: 8px 12px; color: #64748b;">${m.frequency || "—"}</td>
                <td style="padding: 8px 12px; color: #64748b;">${m.duration || "—"}</td>
              </tr>
              ${m.instructions ? `<tr><td colspan="4" style="padding: 4px 12px 8px 12px; font-size: 12px; color: #0d9488;">Instructions: ${m.instructions}</td></tr>` : ""}
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `
      : "";

  await sendEmail(
    to,
    `Your Visit & Care Summary — ${name}`,
    `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 540px; margin: 0 auto; padding: 28px; color: #0f172a; line-height: 1.6; border: 1px solid #e2e8f0; border-radius: 16px;">
        <div style="border-bottom: 2px solid #248473; padding-bottom: 16px; margin-bottom: 20px;">
          <p style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: #248473; margin: 0 0 4px 0;">${name}</p>
          <h2 style="font-size: 22px; margin: 0; color: #0f172a;">Clinical Visit Summary</h2>
        </div>
        <p style="margin: 0 0 16px 0; color: #475569;">Hello ${patientName},</p>
        <p style="margin: 0 0 16px 0; color: #475569;">
          Thank you for visiting ${name}. Here is the official clinical summary from your appointment today with <strong>Dr. ${dentistName}</strong>:
        </p>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 16px 0;">
          <div style="font-size: 13px; font-weight: 600; color: #64748b; margin-bottom: 4px;">Procedure Performed:</div>
          <div style="font-size: 16px; color: #248473; font-weight: 700;">${action} ${toothNumber ? `<span style="font-size: 13px; color: #64748b; font-weight: normal;">(Tooth #${toothNumber})</span>` : ""}</div>
          ${
            description
              ? `
            <div style="margin-top: 12px; font-size: 13px; color: #475569; border-top: 1px solid #edf2f7; padding-top: 10px;">
              <strong>Doctor's Notes &amp; Care Guidance:</strong><br />
              <span style="white-space: pre-wrap;">${description}</span>
            </div>
          `
              : ""
          }
        </div>

        ${rxHtml}

        <p style="font-size: 13px; color: #64748b; margin-top: 24px;">
          Please follow all prescribed dosages. If you experience unexpected discomfort or have any questions about your recovery, contact our clinic care team.
        </p>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 28px; border-top: 1px solid #f1f5f9; padding-top: 12px;">${name} Patient Care Team</p>
      </div>
    `
  );
}

/**
 * 4. Staff Welcome & Permission Granted: Sent to newly invited or upgraded staff members.
 */
export async function sendStaffInvitationEmail(params: {
  to: string;
  name: string;
  role: "admin" | "dentist" | "receptionist";
  roomNumber?: string | null;
  isExistingAccount: boolean;
}) {
  const { to, name: staffName, role, roomNumber, isExistingAccount } = params;
  const name = await clinicName();

  const roleTitle =
    role === "admin"
      ? "Clinic Administrator"
      : role === "dentist"
      ? `Dentist / Clinical Provider${roomNumber ? ` (Room ${roomNumber})` : ""}`
      : "Receptionist / Front Desk";

  const subject = `Welcome to the Clinic Portal Team (${roleTitle}) — ${name}`;

  await sendEmail(
    to,
    subject,
    `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 28px; color: #0f172a; line-height: 1.6; border: 1px solid #e2e8f0; border-radius: 16px;">
        <div style="border-bottom: 2px solid #248473; padding-bottom: 16px; margin-bottom: 20px;">
          <p style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: #248473; margin: 0 0 4px 0;">${name} · Staff Portal</p>
          <h2 style="font-size: 22px; margin: 0; color: #0f172a;">Welcome to the Team</h2>
        </div>
        <p style="margin: 0 0 16px 0; color: #475569;">Hello ${staffName},</p>
        <p style="margin: 0 0 16px 0; color: #475569;">
          You have been granted <strong>${roleTitle}</strong> privileges on the ${name} practice management portal.
        </p>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 20px 0;">
          <div style="font-size: 13px; color: #64748b;">Assigned Role:</div>
          <div style="font-size: 16px; font-weight: 700; color: #0f172a; margin-top: 2px;">${roleTitle}</div>
          <div style="font-size: 13px; color: #64748b; margin-top: 10px;">Account Email:</div>
          <div style="font-size: 14px; font-weight: 600; color: #248473; margin-top: 2px;">${to}</div>
        </div>
        <p style="font-size: 14px; color: #475569; margin-bottom: 24px;">
          ${
            isExistingAccount
              ? "You can log in to your dashboard right away to access your new staff tools and clinical desk."
              : "To get started, create a password or complete sign-up using this email address."
          }
        </p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="https://denpointment-theta.vercel.app/login" style="background-color: #248473; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 9999px; font-weight: 600; font-size: 14px; display: inline-block;">
            Sign In to Practice Portal
          </a>
        </div>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 28px; border-top: 1px solid #f1f5f9; padding-top: 12px;">${name} Administration</p>
      </div>
    `
  );
}



