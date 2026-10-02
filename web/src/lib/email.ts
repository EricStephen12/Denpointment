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

// ─── Shared base layout ───────────────────────────────────────────────────────
// Premier bespoke dental layout with jewel accent bar, typography, and card framing.

function baseLayout(
  clinicNameVal: string,
  accentColor: string = "#0f4c42",
  content: string,
  footerNote?: string,
): string {
  const currentYear = new Date().getFullYear();
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${clinicNameVal}</title>
</head>
<body style="margin:0;padding:0;background-color:#f6f8fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;color:#1e293b;">
  <!-- Hidden preheader preview text -->
  <div style="display:none;font-size:1px;color:#f6f8fa;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${clinicNameVal} — Official Dental Care Notice &amp; Patient Information
  </div>

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f6f8fa;padding:40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Container Card -->
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background-color:#ffffff;border-radius:18px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 12px 32px -8px rgba(15,23,42,0.07);">
          
          <!-- Top Jewel Accent Bar -->
          <tr>
            <td style="height:6px;background:linear-gradient(90deg, #0f4c42 0%, #0d9488 50%, #d4af37 100%);"></td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="padding:32px 36px 24px;border-bottom:1px solid #f1f5f9;background:#ffffff;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:42px;height:42px;background:linear-gradient(135deg, #0f4c42 0%, #064039 100%);border-radius:12px;text-align:center;vertical-align:middle;box-shadow:0 4px 10px rgba(15,76,66,0.18);">
                          <span style="font-size:20px;line-height:1;">🦷</span>
                        </td>
                        <td style="padding-left:14px;vertical-align:middle;">
                          <p style="margin:0;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.18em;color:#0d5c52;">Dental Clinic &amp; Surgery</p>
                          <p style="margin:3px 0 0;font-size:19px;font-weight:800;color:#0f172a;letter-spacing:-0.02em;">${clinicNameVal}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding:34px 36px 28px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#fafbfc;border-top:1px solid #edf2f7;padding:26px 36px;border-radius:0 0 18px 18px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom:14px;border-bottom:1px solid #f1f5f9;">
                    <p style="margin:0;font-size:12px;font-weight:700;color:#334155;">${clinicNameVal}</p>
                    <p style="margin:4px 0 0;font-size:12px;color:#64748b;line-height:1.6;">
                      Dedicated to gentle clinical dentistry, personalized oral care, and lasting smile confidence.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:14px;">
                    <p style="margin:0;font-size:11px;color:#94a3b8;line-height:1.6;">
                      ${footerNote || `This is an official communication from <strong>${clinicNameVal}</strong>. Please do not reply directly to this automated email.`}
                    </p>
                    <p style="margin:6px 0 0;font-size:11px;color:#cbd5e1;">
                      © ${currentYear} ${clinicNameVal}. All rights reserved. Confidential health &amp; clinical notice.
                    </p>
                  </td>
                </tr>
              </table>
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

// ─── Status Badge helper ──────────────────────────────────────────────────────
function statusBadge(text: string, type: "confirmed" | "reminder" | "paid" | "care" = "confirmed"): string {
  const styles = {
    confirmed: "background:#e6f7f5;color:#0d5c52;border:1px solid #99ded6;",
    reminder: "background:#fffbeb;color:#92400e;border:1px solid #fde68a;",
    paid: "background:#ecfdf5;color:#065f46;border:1px solid #a7f3d0;",
    care: "background:#eff6ff;color:#1e40af;border:1px solid #bfdbfe;",
  }[type];

  return `
    <div style="margin-bottom:18px;">
      <span style="display:inline-block;padding:5px 13px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;${styles}">
        ${text}
      </span>
    </div>`;
}

// ─── Callout Box helper ───────────────────────────────────────────────────────
function calloutBox(text: string): string {
  return `
    <div style="background:#f8fafc;border-left:4px solid #0d5c52;border-radius:0 10px 10px 0;padding:14px 18px;margin:22px 0;">
      <p style="margin:0;font-size:13px;color:#334155;line-height:1.65;">${text}</p>
    </div>`;
}

// ─── Detail table helper ──────────────────────────────────────────────────────
function detailTable(rows: { label: string; value: string; highlight?: boolean }[]): string {
  const rowsHtml = rows
    .map(
      (r, idx) => `
      <tr>
        <td style="padding:13px 18px;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;font-weight:700;color:#64748b;white-space:nowrap;width:34%;${idx !== rows.length - 1 ? "border-bottom:1px solid #edf2f7;" : ""}">${r.label}</td>
        <td style="padding:13px 18px;font-size:14px;font-weight:700;color:${r.highlight ? "#0d5c52" : "#0f172a"};${idx !== rows.length - 1 ? "border-bottom:1px solid #edf2f7;" : ""}">
          ${r.highlight ? `<span style="background:#e6f7f5;color:#0d5c52;padding:3px 10px;border-radius:6px;font-size:14px;border:1px solid #99ded6;display:inline-block;">${r.value}</span>` : r.value}
        </td>
      </tr>`,
    )
    .join("");

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin:24px 0;">
      <tbody>${rowsHtml}</tbody>
    </table>`;
}

// ─── Button helper ────────────────────────────────────────────────────────────
function ctaButton(label: string, url: string, color = "#0d5c52"): string {
  return `
    <div style="text-align:center;margin:32px 0 16px;">
      <a href="${url}" style="background:linear-gradient(135deg, ${color} 0%, #064039 100%);color:#ffffff;text-decoration:none;padding:14px 34px;border-radius:10px;font-weight:700;font-size:14px;display:inline-block;letter-spacing:0.02em;box-shadow:0 4px 14px rgba(13,92,82,0.25);">
        ${label} →
      </a>
    </div>`;
}

// ─── Greeting + paragraph helpers ────────────────────────────────────────────
function greeting(name: string): string {
  return `<p style="margin:0 0 14px;font-size:16px;font-weight:700;color:#0f172a;">Dear <strong>${name}</strong>,</p>`;
}

function para(text: string): string {
  return `<p style="margin:0 0 16px;font-size:14px;color:#334155;line-height:1.7;">${text}</p>`;
}

function divider(): string {
  return `<hr style="border:none;border-top:1px solid #f1f5f9;margin:24px 0;" />`;
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
    ${statusBadge("✓ Appointment Confirmed", "confirmed")}
    ${greeting(patientName)}
    ${para("Your dental appointment has been scheduled and confirmed on our clinic calendar. We look forward to welcoming you.")}
    ${detailTable([
      ...(serviceName ? [{ label: "Procedure", value: serviceName, highlight: true }] : []),
      { label: "Date",    value: label },
      { label: "Time",    value: `${hour}:00 (${hour >= 12 ? "PM" : "AM"})` },
      { label: "Suite / Room", value: `Room ${room}` },
      { label: "Dentist", value: `Dr. ${dentistName}` },
    ])}
    ${calloutBox("<strong>Arrival Guidance:</strong> Please arrive 10 minutes before your scheduled appointment time to complete any necessary intake formalities. If you take medication or have active medical conditions, kindly inform our staff.")}
    ${para("Need to reschedule? You can manage your appointments directly through your patient portal.")}
  `;

  await sendEmail(
    to,
    `Appointment Confirmed — ${name}`,
    baseLayout(name, "#0f4c42", content),
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
    ${statusBadge("⏰ Upcoming Visit Reminder", "reminder")}
    ${greeting(patientName)}
    ${para("This is a friendly reminder of your upcoming dental visit scheduled for tomorrow:")}
    ${detailTable([
      { label: "Date",    value: label },
      { label: "Time",    value: `${hour}:00 (${hour >= 12 ? "PM" : "AM"})` },
      { label: "Suite / Room", value: `Room ${room}` },
      { label: "Dentist", value: `Dr. ${dentistName}` },
    ])}
    ${calloutBox("<strong>Change of plans?</strong> If you can no longer attend, please cancel or reschedule through your portal or by calling us so another patient in need may use the chair time.")}
  `;

  await sendEmail(
    to,
    `Reminder: Appointment Tomorrow — ${name}`,
    baseLayout(name, "#0f4c42", content),
  );
}

/** Payment receipt sent to patient after Paystack or desk payment. */
export async function sendPaymentReceiptEmail(params: {
  to: string;
  patientName: string;
  amount: number;
  serviceName: string;
}) {
  const { to, patientName, amount, serviceName } = params;
  const name = await clinicName();

  const content = `
    ${statusBadge("💳 Payment Receipt", "paid")}
    ${greeting(patientName)}
    ${para("Thank you for your payment. Your patient account has been credited and updated on our records.")}
    ${detailTable([
      { label: "Procedure / Service", value: serviceName },
      { label: "Amount Paid",        value: formatNaira(amount), highlight: true },
      { label: "Payment Status",     value: "Paid & Settled" },
    ])}
    ${calloutBox("A full itemized invoice is permanently available in your patient portal under <strong>Bills &amp; Payments</strong>.")}
  `;

  await sendEmail(
    to,
    `Payment Confirmed — ${name}`,
    baseLayout(name, "#0f4c42", content),
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
    ${statusBadge("🔒 Security Notice", "reminder")}
    ${greeting(patientName)}
    ${para("We received a request to reset the password associated with your clinic account. Click the button below to choose a new secure password:")}
    ${ctaButton("Reset My Password", resetUrl)}
    ${calloutBox("<strong>Security Reminder:</strong> This link is uniquely generated and will expire in <strong>1 hour</strong>. If you did not request a password reset, you can safely disregard this email — your account remains secure.")}
    ${divider()}
    <p style="margin:0;font-size:11px;color:#94a3b8;word-break:break-all;">Direct link: ${resetUrl}</p>
  `;

  const res = await sendEmail(
    to,
    `Reset Your Password — ${clinic}`,
    baseLayout(clinic, "#0f4c42", content),
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
  const emailSubject = subject || `Happy Birthday from ${clinic}! 🎂`;

  const defaultMsg = `Wishing you a wonderful birthday celebration filled with joy and smiles. We are truly delighted to be your dental health provider and wish you radiant health in the year ahead.`;
  const body = (customMessage || defaultMsg).replace(/\n/g, "<br/>");

  if (!resend) {
    console.info(`[birthday] Simulated send to ${patientName} <${to}>`);
    return { sent: true as const, simulated: true };
  }

  const content = `
    ${statusBadge("🎉 Warmest Birthday Wishes", "confirmed")}
    ${greeting(patientName)}
    <h2 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#0f172a;letter-spacing:-0.02em;">Happy Birthday from all of us!</h2>
    ${para(body)}
    ${calloutBox("As our valued patient, your smile is our greatest passion. We look forward to seeing you at your next preventive visit!")}
    ${divider()}
    ${para(`With warm regards,<br/><strong>The Clinical Team &amp; Staff at ${clinic}</strong>`)}
  `;

  const res = await sendEmail(to, emailSubject, baseLayout(clinic, "#0f4c42", content));
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
        <p style="margin:0 0 14px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#0f172a;">Prescribed Medication</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;font-size:13px;">
          <thead>
            <tr style="background-color:#edf2f7;">
              <th style="padding:10px 14px;text-align:left;color:#475569;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;font-weight:700;border-bottom:1px solid #e2e8f0;">Medicine</th>
              <th style="padding:10px 14px;text-align:left;color:#475569;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;font-weight:700;border-bottom:1px solid #e2e8f0;">Dose</th>
              <th style="padding:10px 14px;text-align:left;color:#475569;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;font-weight:700;border-bottom:1px solid #e2e8f0;">Frequency</th>
              <th style="padding:10px 14px;text-align:left;color:#475569;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;font-weight:700;border-bottom:1px solid #e2e8f0;">Duration</th>
            </tr>
          </thead>
          <tbody>
            ${medicines.map((m, idx) => `
              <tr>
                <td style="padding:10px 14px;font-weight:700;color:#0f172a;${idx !== medicines.length - 1 ? "border-bottom:1px solid #e2e8f0;" : ""}">${m.name}</td>
                <td style="padding:10px 14px;color:#64748b;${idx !== medicines.length - 1 ? "border-bottom:1px solid #e2e8f0;" : ""}">${m.dose || "—"}</td>
                <td style="padding:10px 14px;color:#64748b;${idx !== medicines.length - 1 ? "border-bottom:1px solid #e2e8f0;" : ""}">${m.frequency || "—"}</td>
                <td style="padding:10px 14px;color:#64748b;${idx !== medicines.length - 1 ? "border-bottom:1px solid #e2e8f0;" : ""}">${m.duration || "—"}</td>
              </tr>
              ${m.instructions ? `<tr><td colspan="4" style="padding:4px 14px 10px;font-size:12px;color:#0d5c52;background:#f0fdf4;border-bottom:1px solid #e2e8f0;"><strong>Instructions:</strong> ${m.instructions}</td></tr>` : ""}
            `).join("")}
          </tbody>
        </table>
        `
      : "";

  const content = `
    ${statusBadge("🦷 Visit Summary & Clinical Notes", "care")}
    ${greeting(patientName)}
    ${para(`Thank you for your visit today with <strong>Dr. ${dentistName}</strong>. Here is your official clinical treatment summary:`)}
    ${detailTable([
      { label: "Procedure",    value: action + (toothNumber ? ` (Tooth #${toothNumber})` : ""), highlight: true },
      ...(description ? [{ label: "Clinical Notes", value: description }] : []),
    ])}
    ${rxHtml}
    ${calloutBox("<strong>Post-Treatment Care:</strong> If you experience unexpected discomfort, unusual swelling, or have questions about taking your medication, please contact the clinic immediately.")}
  `;

  await sendEmail(
    to,
    `Your Visit Summary — ${name}`,
    baseLayout(name, "#0f4c42", content),
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
