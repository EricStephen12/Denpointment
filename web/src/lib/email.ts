import { Resend } from "resend";
import { CLINIC_NAME } from "@/lib/constants";
import { formatNaira } from "@/lib/currency";
import { formatAppointmentDate, type CalendarDay } from "@/lib/clinic-date";
import { getSiteContent } from "@/lib/site";

const rawApiKey = (process.env.RESEND_API_KEY || "").trim();
const isKeyConfigured =
  rawApiKey.startsWith("re_") && rawApiKey.length > 10 && !rawApiKey.includes("...");
const resend = isKeyConfigured ? new Resend(rawApiKey) : null;

export function getFromEmail(): string {
  const env = (process.env.EMAIL_FROM || "").trim();
  if (env && !env.includes("onboarding@resend.dev")) return env;
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

// ─── Shared base layout ───────────────────────────────────────────────────────
// Every email uses this. Dark teal header with clinic name, white body, clean
// footer. Consistent, professional, not generic.

function baseLayout(
  clinicNameVal: string,
  accentColor: string = "#1a7a6a",
  content: string,
  footerNote?: string,
): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${clinicNameVal}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Header -->
          <tr>
            <td style="background-color:${accentColor};border-radius:12px 12px 0 0;padding:28px 32px;">
              <p style="margin:0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.18em;color:rgba(255,255,255,0.6);">Dental Clinic</p>
              <p style="margin:6px 0 0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;">${clinicNameVal}</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color:#ffffff;padding:32px 32px 24px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f9fafb;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 12px 12px;padding:18px 32px;">
              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
                ${footerNote || `This email was sent by <strong>${clinicNameVal}</strong>. Please do not reply directly to this email.`}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// ─── Detail table helper ──────────────────────────────────────────────────────
function detailTable(rows: { label: string; value: string; highlight?: boolean }[]): string {
  const rowsHtml = rows
    .map(
      (r) => `
      <tr>
        <td style="padding:10px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6;white-space:nowrap;width:36%;">${r.label}</td>
        <td style="padding:10px 16px;font-size:14px;font-weight:600;color:${r.highlight ? "#1a7a6a" : "#111827"};border-bottom:1px solid #f3f4f6;">${r.value}</td>
      </tr>`,
    )
    .join("");

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin:20px 0;">
      <tbody>${rowsHtml}</tbody>
    </table>`;
}

// ─── Button helper ────────────────────────────────────────────────────────────
function ctaButton(label: string, url: string, color = "#1a7a6a"): string {
  return `
    <div style="text-align:center;margin:28px 0;">
      <a href="${url}" style="background-color:${color};color:#ffffff;text-decoration:none;padding:13px 32px;border-radius:9999px;font-weight:600;font-size:14px;display:inline-block;letter-spacing:0.01em;">
        ${label}
      </a>
    </div>`;
}

// ─── Greeting + paragraph helpers ────────────────────────────────────────────
function greeting(name: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;color:#374151;">Hi <strong>${name}</strong>,</p>`;
}

function para(text: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.65;">${text}</p>`;
}

function divider(): string {
  return `<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />`;
}

// ─── Send wrapper ─────────────────────────────────────────────────────────────
async function sendEmail(to: string, subject: string, html: string) {
  if (!resend) {
    console.warn(`[email] RESEND_API_KEY not set — skipped "${subject}" to ${to}`);
    return { success: false, error: "RESEND_API_KEY not configured" };
  }
  try {
    const from = getFromEmail();
    const { data, error } = await resend.emails.send({ from, to, subject, html });
    if (error) {
      console.error("[email] Resend error:", error);
      return { success: false, error };
    }
    return { success: true, data };
  } catch (error) {
    console.error("[email] Failed to send:", error);
    return { success: false, error };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

/** Appointment confirmation sent to patient after booking. */
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
  const name  = await clinicName();
  const label = formatAppointmentDate(date);

  const content = `
    ${greeting(patientName)}
    ${para("Your appointment has been confirmed. Here are the details:")}
    ${detailTable([
      ...(serviceName ? [{ label: "Procedure", value: serviceName, highlight: true }] : []),
      { label: "Date",    value: label },
      { label: "Time",    value: `${hour}:00` },
      { label: "Room",    value: `Room ${room}` },
      { label: "Dentist", value: `Dr. ${dentistName}` },
    ])}
    ${para("Need to reschedule or cancel? Log in to your patient portal or call us.")}
  `;

  await sendEmail(
    to,
    `Appointment Confirmed — ${name}`,
    baseLayout(name, "#1a7a6a", content),
  );
}

/** Appointment reminder sent the day before. */
export async function sendAppointmentReminderEmail(params: {
  to: string;
  patientName: string;
  dentistName: string;
  room: string;
  date: CalendarDay;
  hour: number;
}) {
  const { to, patientName, dentistName, room, date, hour } = params;
  const name  = await clinicName();
  const label = formatAppointmentDate(date);

  const content = `
    ${greeting(patientName)}
    ${para("This is a reminder for your appointment tomorrow:")}
    ${detailTable([
      { label: "Date",    value: label },
      { label: "Time",    value: `${hour}:00` },
      { label: "Room",    value: `Room ${room}` },
      { label: "Dentist", value: `Dr. ${dentistName}` },
    ])}
    ${para("If you can no longer make it, please cancel or reschedule as soon as possible so another patient can take your slot.")}
  `;

  await sendEmail(
    to,
    `Reminder: Appointment Tomorrow — ${name}`,
    baseLayout(name, "#1a7a6a", content),
  );
}

/** Payment receipt sent to patient after Paystack payment. */
export async function sendPaymentReceiptEmail(params: {
  to: string;
  patientName: string;
  amount: number;
  serviceName: string;
}) {
  const { to, patientName, amount, serviceName } = params;
  const name = await clinicName();

  const content = `
    ${greeting(patientName)}
    ${para("We have received your payment. Thank you!")}
    ${detailTable([
      { label: "Procedure", value: serviceName },
      { label: "Amount",    value: formatNaira(amount), highlight: true },
      { label: "Status",    value: "Paid" },
    ])}
    ${para("A full invoice is available in your patient portal under Bills & Payments.")}
  `;

  await sendEmail(
    to,
    `Payment Confirmed — ${name}`,
    baseLayout(name, "#1a7a6a", content),
  );
}

/** Contact form inquiry forwarded to the clinic. */
export async function sendContactInquiryEmail(params: {
  to: string;
  fromName: string;
  fromEmail: string;
  message: string;
  clinicName: string;
}) {
  const { to, fromName, fromEmail, message, clinicName: name } = params;
  const safeMsg  = message.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const safeName = fromName.replace(/</g, "&lt;").replace(/>/g, "&gt;");

  if (!resend) {
    console.warn(`[email] RESEND_API_KEY not set — contact inquiry from ${fromEmail} logged only`);
    console.info(`[contact] ${safeName} <${fromEmail}>: ${message}`);
    return { sent: false as const };
  }

  const content = `
    ${para(`<strong>From:</strong> ${safeName} &lt;${fromEmail}&gt;`)}
    ${divider()}
    <p style="margin:0;font-size:15px;color:#374151;line-height:1.65;white-space:pre-wrap;">${safeMsg}</p>
  `;

  await sendEmail(
    to,
    `Website Inquiry from ${safeName} — ${name}`,
    baseLayout(name, "#374151", content, "Forwarded from the website contact form."),
  );
  return { sent: true as const };
}

/** Password reset link. */
export async function sendPasswordResetEmail(params: {
  to: string;
  resetUrl: string;
  name?: string;
}) {
  const { to, resetUrl, name: patientName = "there" } = params;
  const clinic = await clinicName();

  if (!resend) {
    console.warn(`[email] RESEND_API_KEY not set — reset link for ${to}: ${resetUrl}`);
    return { sent: false as const };
  }

  const content = `
    ${greeting(patientName)}
    ${para("We received a request to reset the password on your account. Click the button below to set a new one.")}
    ${ctaButton("Reset Password", resetUrl)}
    ${divider()}
    <p style="margin:0;font-size:12px;color:#9ca3af;">This link expires in 1 hour. If you did not request a password reset, you can safely ignore this email.</p>
    <p style="margin:8px 0 0;font-size:11px;color:#d1d5db;word-break:break-all;">${resetUrl}</p>
  `;

  const res = await sendEmail(
    to,
    `Reset Your Password — ${clinic}`,
    baseLayout(clinic, "#1a7a6a", content),
  );
  return { sent: Boolean(res?.success) };
}

/** Birthday greeting automation. */
export async function sendBirthdayEmail(params: {
  to: string;
  patientName: string;
  subject?: string;
  customMessage?: string;
}) {
  const { to, patientName, subject, customMessage } = params;
  const clinic = await clinicName();
  const emailSubject = subject || `Happy Birthday from ${clinic}`;

  const defaultMsg = `Wishing you a wonderful birthday. We are glad to be your dental care provider and hope this year brings you good health.`;
  const body = (customMessage || defaultMsg).replace(/\n/g, "<br/>");

  if (!resend) {
    console.info(`[birthday] Simulated send to ${patientName} <${to}>`);
    return { sent: true as const, simulated: true };
  }

  const content = `
    ${greeting(patientName)}
    <p style="margin:0 0 24px;font-size:22px;font-weight:700;color:#111827;">Happy Birthday!</p>
    ${para(body)}
    ${divider()}
    ${para(`With warm regards from the team at ${clinic}.`)}
  `;

  const res = await sendEmail(to, emailSubject, baseLayout(clinic, "#1a7a6a", content));
  return { sent: Boolean(res?.success), simulated: false };
}

/** Anniversary / milestone greeting automation. */
export async function sendAnniversaryEmail(params: {
  to: string;
  patientName: string;
  years?: number;
  subject?: string;
  customMessage?: string;
}) {
  const { to, patientName, years = 1, subject, customMessage } = params;
  const clinic = await clinicName();
  const emailSubject = subject || `Thank you for choosing ${clinic}`;

  const yearsLabel = years > 1 ? `${years} years` : "one year";
  const defaultMsg = `It has been ${yearsLabel} since your first visit with us. Thank you for your continued trust — it means a great deal to the whole team.`;
  const body = (customMessage || defaultMsg).replace(/\n/g, "<br/>");

  if (!resend) {
    console.info(`[anniversary] Simulated send to ${patientName} <${to}>`);
    return { sent: true as const, simulated: true };
  }

  const content = `
    ${greeting(patientName)}
    ${para(body)}
    ${divider()}
    ${para(`From the team at ${clinic}.`)}
  `;

  const res = await sendEmail(to, emailSubject, baseLayout(clinic, "#1a7a6a", content));
  return { sent: Boolean(res?.success), simulated: false };
}

/** Broadcast / promotional campaign. */
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
  const { to, patientName, subject, headline, content: body, ctaLabel, ctaUrl } = params;
  const clinic = await clinicName();

  if (!resend) {
    console.info(`[broadcast] Simulated send to ${patientName} <${to}>`);
    return { sent: true as const, simulated: true };
  }

  const safeBody = body.replace(/\n/g, "<br/>");

  const contentHtml = `
    ${greeting(patientName)}
    ${headline ? `<p style="margin:0 0 20px;font-size:20px;font-weight:700;color:#111827;">${headline}</p>` : ""}
    ${para(safeBody)}
    ${ctaLabel && ctaUrl ? ctaButton(ctaLabel, ctaUrl) : ""}
  `;

  const res = await sendEmail(to, subject, baseLayout(clinic, "#1a7a6a", contentHtml));
  return { sent: Boolean(res?.success), simulated: false };
}

/** New appointment alert sent to the dentist. */
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
  const name  = await clinicName();
  const label = formatAppointmentDate(date);

  const content = `
    ${greeting(`Dr. ${dentistName}`)}
    ${para("A new appointment has been added to your schedule:")}
    ${detailTable([
      { label: "Patient",    value: `${patientName} · ${patientEmail}` },
      ...(serviceName ? [{ label: "Procedure", value: serviceName, highlight: true }] : []),
      { label: "Date & Time", value: `${label} at ${hour}:00` },
      { label: "Room",        value: `Room ${room}` },
    ])}
  `;

  await sendEmail(
    to,
    `New Appointment: ${patientName} — ${label} at ${hour}:00`,
    baseLayout(name, "#1a7a6a", content, `${name} — automated schedule alert`),
  );
}

/** Appointment cancellation notice to patient or dentist. */
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
  const name  = await clinicName();
  const label = formatAppointmentDate(date);

  const bodyText = isDentist
    ? `The appointment with <strong>${otherPartyName}</strong> on <strong>${label} at ${hour}:00</strong> (Room ${room}) has been cancelled. The slot is now open.`
    : `Your appointment with <strong>Dr. ${otherPartyName}</strong> on <strong>${label} at ${hour}:00</strong> has been cancelled.`;

  const rescheduleNote = isDentist
    ? ""
    : para("To book a new appointment, log in to your patient portal and pick a date that works for you.");

  const content = `
    ${greeting(recipientName)}
    ${para(bodyText)}
    ${serviceName ? para(`Procedure: <strong>${serviceName}</strong>`) : ""}
    ${rescheduleNote}
  `;

  const subject = isDentist
    ? `Cancellation: ${otherPartyName} — ${label}`
    : `Appointment Cancelled — ${name}`;

  await sendEmail(to, subject, baseLayout(name, isDentist ? "#374151" : "#1a7a6a", content));
}

/** Visit & prescription summary sent to patient after treatment. */
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
        ${divider()}
        <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#111827;">Prescribed Medication</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;font-size:13px;">
          <thead>
            <tr style="background-color:#f9fafb;">
              <th style="padding:10px 14px;text-align:left;color:#6b7280;font-weight:600;border-bottom:1px solid #e5e7eb;">Medicine</th>
              <th style="padding:10px 14px;text-align:left;color:#6b7280;font-weight:600;border-bottom:1px solid #e5e7eb;">Dose</th>
              <th style="padding:10px 14px;text-align:left;color:#6b7280;font-weight:600;border-bottom:1px solid #e5e7eb;">Frequency</th>
              <th style="padding:10px 14px;text-align:left;color:#6b7280;font-weight:600;border-bottom:1px solid #e5e7eb;">Duration</th>
            </tr>
          </thead>
          <tbody>
            ${medicines.map((m) => `
              <tr>
                <td style="padding:10px 14px;font-weight:600;color:#111827;border-bottom:1px solid #f3f4f6;">${m.name}</td>
                <td style="padding:10px 14px;color:#6b7280;border-bottom:1px solid #f3f4f6;">${m.dose || "—"}</td>
                <td style="padding:10px 14px;color:#6b7280;border-bottom:1px solid #f3f4f6;">${m.frequency || "—"}</td>
                <td style="padding:10px 14px;color:#6b7280;border-bottom:1px solid #f3f4f6;">${m.duration || "—"}</td>
              </tr>
              ${m.instructions ? `<tr><td colspan="4" style="padding:4px 14px 10px;font-size:12px;color:#1a7a6a;border-bottom:1px solid #f3f4f6;">Note: ${m.instructions}</td></tr>` : ""}
            `).join("")}
          </tbody>
        </table>
        `
      : "";

  const content = `
    ${greeting(patientName)}
    ${para(`Thank you for your visit today with <strong>Dr. ${dentistName}</strong>. Here is your treatment summary:`)}
    ${detailTable([
      { label: "Procedure",    value: action + (toothNumber ? ` (Tooth #${toothNumber})` : ""), highlight: true },
      ...(description ? [{ label: "Clinical notes", value: description }] : []),
    ])}
    ${rxHtml}
    ${divider()}
    ${para("If you have any questions or experience unexpected discomfort, contact us right away.")}
  `;

  await sendEmail(
    to,
    `Your Visit Summary — ${name}`,
    baseLayout(name, "#1a7a6a", content),
  );
}

/** Staff invitation / access granted. */
export async function sendStaffInvitationEmail(params: {
  to: string;
  name: string;
  role: "admin" | "dentist" | "receptionist";
  roomNumber?: string | null;
  isExistingAccount: boolean;
}) {
  const { to, name: staffName, role, roomNumber, isExistingAccount } = params;
  const clinic = await clinicName();

  const roleTitle =
    role === "admin"
      ? "Clinic Administrator"
      : role === "dentist"
      ? `Dentist${roomNumber ? ` — Room ${roomNumber}` : ""}`
      : "Receptionist";

  const content = `
    ${greeting(staffName)}
    ${para(`You have been added to the <strong>${clinic}</strong> practice portal as <strong>${roleTitle}</strong>.`)}
    ${detailTable([
      { label: "Role",  value: roleTitle, highlight: true },
      { label: "Email", value: to },
    ])}
    ${para(isExistingAccount
      ? "You can log in now using your existing account."
      : "Sign in with this email address to complete your account setup."
    )}
    ${ctaButton("Sign In to Portal", "https://denpointment-theta.vercel.app/login")}
  `;

  await sendEmail(
    to,
    `You have been added to ${clinic} — ${roleTitle}`,
    baseLayout(clinic, "#1a7a6a", content, `${clinic} administration`),
  );
}

/** Post-visit follow-up sent ~24h after appointment completed. */
export async function sendPostVisitFollowUpEmail(params: {
  to: string;
  patientName: string;
  dentistName: string;
  clinicPhone: string;
}) {
  const { to, patientName, dentistName, clinicPhone } = params;
  const name = await clinicName();

  if (!resend) {
    console.info(`[followup] Simulated send to ${patientName} <${to}>`);
    return { sent: true as const, simulated: true };
  }

  const content = `
    ${greeting(patientName)}
    ${para(`It has been a day since your visit with <strong>Dr. ${dentistName}</strong>. We just wanted to check in — how are you feeling?`)}
    ${para("If you have any discomfort, questions about your medication, or anything else on your mind, please reach out.")}
    ${detailTable([
      { label: "Call or WhatsApp", value: clinicPhone, highlight: true },
    ])}
  `;

  const res = await sendEmail(
    to,
    `Checking in on you — ${name}`,
    baseLayout(name, "#1a7a6a", content),
  );
  return { sent: Boolean(res?.success), simulated: false };
}
