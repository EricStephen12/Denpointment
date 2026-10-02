"use client";

import React, { useState } from "react";
import {
  CalendarCheck,
  Clock,
  CreditCard,
  Stethoscope,
  Cake,
  KeyRound,
  Smartphone,
  Monitor,
  Sparkles,
} from "lucide-react";

interface Props {
  clinicName: string;
}

export default function EmailTemplatesGallery({ clinicName }: Props) {
  const [selectedTemplate, setSelectedTemplate] = useState<
    "confirmation" | "reminder" | "receipt" | "treatment" | "birthday" | "reset"
  >("confirmation");

  const [deviceView, setDeviceView] = useState<"desktop" | "mobile">("desktop");

  const currentYear = new Date().getFullYear();

  // HTML templates matching the exact design in email.ts
  const templates = {
    confirmation: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:24px 12px;background:#f6f8fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:18px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 10px 28px -6px rgba(15,23,42,0.06);">
    <div style="height:6px;background:linear-gradient(90deg, #0f4c42 0%, #0d9488 50%, #d4af37 100%);"></div>
    <div style="padding:28px 32px 20px;border-bottom:1px solid #f1f5f9;">
      <table cellpadding="0" cellspacing="0">
        <tr>
          <td style="width:40px;height:40px;background:linear-gradient(135deg, #0f4c42 0%, #064039 100%);border-radius:12px;text-align:center;vertical-align:middle;">
            <span style="font-size:20px;line-height:1;">🦷</span>
          </td>
          <td style="padding-left:14px;">
            <p style="margin:0;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.18em;color:#0d5c52;">Dental Clinic &amp; Surgery</p>
            <p style="margin:3px 0 0;font-size:18px;font-weight:800;color:#0f172a;letter-spacing:-0.02em;">${clinicName}</p>
          </td>
        </tr>
      </table>
    </div>
    <div style="padding:32px 32px 24px;">
      <div style="margin-bottom:18px;">
        <span style="display:inline-block;padding:5px 13px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;background:#e6f7f5;color:#0d5c52;border:1px solid #99ded6;">
          ✓ Appointment Confirmed
        </span>
      </div>
      <p style="margin:0 0 12px;font-size:16px;font-weight:700;color:#0f172a;">Dear <strong>Ada Okafor</strong>,</p>
      <p style="margin:0 0 16px;font-size:14px;color:#334155;line-height:1.7;">
        Your dental appointment has been scheduled and confirmed on our clinic calendar. We look forward to welcoming you.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin:22px 0;">
        <tr>
          <td style="padding:12px 16px;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;font-weight:700;color:#64748b;width:34%;border-bottom:1px solid #edf2f7;">Procedure</td>
          <td style="padding:12px 16px;font-size:14px;font-weight:700;color:#0d5c52;border-bottom:1px solid #edf2f7;">
            <span style="background:#e6f7f5;color:#0d5c52;padding:3px 10px;border-radius:6px;font-size:13px;border:1px solid #99ded6;">Scaling &amp; Polishing</span>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 16px;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;font-weight:700;color:#64748b;border-bottom:1px solid #edf2f7;">Date</td>
          <td style="padding:12px 16px;font-size:14px;font-weight:700;color:#0f172a;border-bottom:1px solid #edf2f7;">Thursday, 15 October 2026</td>
        </tr>
        <tr>
          <td style="padding:12px 16px;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;font-weight:700;color:#64748b;border-bottom:1px solid #edf2f7;">Time</td>
          <td style="padding:12px 16px;font-size:14px;font-weight:700;color:#0f172a;border-bottom:1px solid #edf2f7;">10:00 AM</td>
        </tr>
        <tr>
          <td style="padding:12px 16px;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;font-weight:700;color:#64748b;border-bottom:1px solid #edf2f7;">Suite / Room</td>
          <td style="padding:12px 16px;font-size:14px;font-weight:700;color:#0f172a;border-bottom:1px solid #edf2f7;">Suite 102</td>
        </tr>
        <tr>
          <td style="padding:12px 16px;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;font-weight:700;color:#64748b;">Attending Dentist</td>
          <td style="padding:12px 16px;font-size:14px;font-weight:700;color:#0f172a;">Dr. Eric Stephen, BDS</td>
        </tr>
      </table>
      <div style="background:#f8fafc;border-left:4px solid #0d5c52;border-radius:0 10px 10px 0;padding:14px 18px;margin:22px 0;">
        <p style="margin:0;font-size:13px;color:#334155;line-height:1.65;">
          <strong>Arrival Guidance:</strong> Please arrive 10 minutes prior to complete any intake formalities. If you take blood thinners or have cardiac conditions, kindly inform our reception.
        </p>
      </div>
      <div style="text-align:center;margin:28px 0 12px;">
        <a href="#" style="background:linear-gradient(135deg, #0d5c52 0%, #064039 100%);color:#ffffff;text-decoration:none;padding:13px 32px;border-radius:10px;font-weight:700;font-size:14px;display:inline-block;box-shadow:0 4px 14px rgba(13,92,82,0.25);">
          View in Patient Portal →
        </a>
      </div>
    </div>
    <div style="background:#fafbfc;border-top:1px solid #edf2f7;padding:22px 32px;">
      <p style="margin:0;font-size:12px;font-weight:700;color:#334155;">${clinicName}</p>
      <p style="margin:3px 0 0;font-size:11px;color:#64748b;line-height:1.6;">
        Victoria Island, Lagos · Tel: +234 800 000 0000 · care@glowdentalklinic.com
      </p>
      <p style="margin:8px 0 0;font-size:10px;color:#94a3b8;">
        © ${currentYear} ${clinicName}. Confidential medical communication.
      </p>
    </div>
  </div>
</body>
</html>`,

    reminder: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:24px 12px;background:#f6f8fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:18px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 10px 28px -6px rgba(15,23,42,0.06);">
    <div style="height:6px;background:linear-gradient(90deg, #0f4c42 0%, #0d9488 50%, #d4af37 100%);"></div>
    <div style="padding:28px 32px 20px;border-bottom:1px solid #f1f5f9;">
      <table cellpadding="0" cellspacing="0">
        <tr>
          <td style="width:40px;height:40px;background:linear-gradient(135deg, #0f4c42 0%, #064039 100%);border-radius:12px;text-align:center;vertical-align:middle;">
            <span style="font-size:20px;line-height:1;">🦷</span>
          </td>
          <td style="padding-left:14px;">
            <p style="margin:0;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.18em;color:#0d5c52;">Dental Clinic &amp; Surgery</p>
            <p style="margin:3px 0 0;font-size:18px;font-weight:800;color:#0f172a;letter-spacing:-0.02em;">${clinicName}</p>
          </td>
        </tr>
      </table>
    </div>
    <div style="padding:32px 32px 24px;">
      <div style="margin-bottom:18px;">
        <span style="display:inline-block;padding:5px 13px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;background:#fffbeb;color:#92400e;border:1px solid #fde68a;">
          ⏰ Upcoming Visit Reminder
        </span>
      </div>
      <p style="margin:0 0 12px;font-size:16px;font-weight:700;color:#0f172a;">Dear <strong>Ada Okafor</strong>,</p>
      <p style="margin:0 0 16px;font-size:14px;color:#334155;line-height:1.7;">
        This is a friendly reminder that you have an appointment scheduled with us for <strong>tomorrow</strong>:
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin:22px 0;">
        <tr>
          <td style="padding:12px 16px;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;font-weight:700;color:#64748b;width:34%;border-bottom:1px solid #edf2f7;">Date</td>
          <td style="padding:12px 16px;font-size:14px;font-weight:700;color:#0f172a;border-bottom:1px solid #edf2f7;">Tomorrow, 10:00 AM</td>
        </tr>
        <tr>
          <td style="padding:12px 16px;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;font-weight:700;color:#64748b;border-bottom:1px solid #edf2f7;">Suite</td>
          <td style="padding:12px 16px;font-size:14px;font-weight:700;color:#0f172a;border-bottom:1px solid #edf2f7;">Suite 102</td>
        </tr>
        <tr>
          <td style="padding:12px 16px;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;font-weight:700;color:#64748b;">Dentist</td>
          <td style="padding:12px 16px;font-size:14px;font-weight:700;color:#0f172a;">Dr. Eric Stephen, BDS</td>
        </tr>
      </table>
      <div style="background:#f8fafc;border-left:4px solid #0d5c52;border-radius:0 10px 10px 0;padding:14px 18px;margin:22px 0;">
        <p style="margin:0;font-size:13px;color:#334155;line-height:1.65;">
          <strong>Need to reschedule?</strong> If you can no longer attend, please cancel or postpone through your portal so we can make this chair available to patients on our emergency waitlist.
        </p>
      </div>
      <div style="text-align:center;margin:28px 0 12px;">
        <a href="#" style="background:linear-gradient(135deg, #0d5c52 0%, #064039 100%);color:#ffffff;text-decoration:none;padding:13px 32px;border-radius:10px;font-weight:700;font-size:14px;display:inline-block;box-shadow:0 4px 14px rgba(13,92,82,0.25);">
          Manage Appointment →
        </a>
      </div>
    </div>
    <div style="background:#fafbfc;border-top:1px solid #edf2f7;padding:22px 32px;">
      <p style="margin:0;font-size:12px;font-weight:700;color:#334155;">${clinicName}</p>
      <p style="margin:3px 0 0;font-size:11px;color:#64748b;line-height:1.6;">
        Victoria Island, Lagos · Tel: +234 800 000 0000 · care@glowdentalklinic.com
      </p>
    </div>
  </div>
</body>
</html>`,

    receipt: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:24px 12px;background:#f6f8fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:18px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 10px 28px -6px rgba(15,23,42,0.06);">
    <div style="height:6px;background:linear-gradient(90deg, #0f4c42 0%, #0d9488 50%, #d4af37 100%);"></div>
    <div style="padding:28px 32px 20px;border-bottom:1px solid #f1f5f9;">
      <table cellpadding="0" cellspacing="0">
        <tr>
          <td style="width:40px;height:40px;background:linear-gradient(135deg, #0f4c42 0%, #064039 100%);border-radius:12px;text-align:center;vertical-align:middle;">
            <span style="font-size:20px;line-height:1;">🦷</span>
          </td>
          <td style="padding-left:14px;">
            <p style="margin:0;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.18em;color:#0d5c52;">Dental Clinic &amp; Surgery</p>
            <p style="margin:3px 0 0;font-size:18px;font-weight:800;color:#0f172a;letter-spacing:-0.02em;">${clinicName}</p>
          </td>
        </tr>
      </table>
    </div>
    <div style="padding:32px 32px 24px;">
      <div style="margin-bottom:18px;">
        <span style="display:inline-block;padding:5px 13px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;background:#ecfdf5;color:#065f46;border:1px solid #a7f3d0;">
          💳 Payment Receipt
        </span>
      </div>
      <p style="margin:0 0 12px;font-size:16px;font-weight:700;color:#0f172a;">Dear <strong>Ada Okafor</strong>,</p>
      <p style="margin:0 0 16px;font-size:14px;color:#334155;line-height:1.7;">
        Thank you for your payment. Your patient account has been credited and updated on our records.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin:22px 0;">
        <tr>
          <td style="padding:12px 16px;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;font-weight:700;color:#64748b;width:34%;border-bottom:1px solid #edf2f7;">Procedure</td>
          <td style="padding:12px 16px;font-size:14px;font-weight:700;color:#0f172a;border-bottom:1px solid #edf2f7;">Composite Resin Filling + Scaling</td>
        </tr>
        <tr>
          <td style="padding:12px 16px;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;font-weight:700;color:#64748b;border-bottom:1px solid #edf2f7;">Amount Paid</td>
          <td style="padding:12px 16px;font-size:15px;font-weight:800;color:#0d5c52;border-bottom:1px solid #edf2f7;">
            <span style="background:#e6f7f5;color:#0d5c52;padding:3px 10px;border-radius:6px;font-size:14px;border:1px solid #99ded6;">₦35,000</span>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 16px;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;font-weight:700;color:#64748b;border-bottom:1px solid #edf2f7;">Payment Method</td>
          <td style="padding:12px 16px;font-size:14px;font-weight:700;color:#0f172a;border-bottom:1px solid #edf2f7;">POS Card Terminal</td>
        </tr>
        <tr>
          <td style="padding:12px 16px;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;font-weight:700;color:#64748b;">Account Status</td>
          <td style="padding:12px 16px;font-size:13px;font-weight:700;color:#059669;">Settled in Full ✓</td>
        </tr>
      </table>
      <div style="background:#f8fafc;border-left:4px solid #0d5c52;border-radius:0 10px 10px 0;padding:14px 18px;margin:22px 0;">
        <p style="margin:0;font-size:13px;color:#334155;line-height:1.65;">
          A full tax invoice and payment history is permanently archived in your patient portal under <strong>Bills &amp; Payments</strong>.
        </p>
      </div>
      <div style="text-align:center;margin:28px 0 12px;">
        <a href="#" style="background:linear-gradient(135deg, #0d5c52 0%, #064039 100%);color:#ffffff;text-decoration:none;padding:13px 32px;border-radius:10px;font-weight:700;font-size:14px;display:inline-block;box-shadow:0 4px 14px rgba(13,92,82,0.25);">
          Download Invoice PDF →
        </a>
      </div>
    </div>
    <div style="background:#fafbfc;border-top:1px solid #edf2f7;padding:22px 32px;">
      <p style="margin:0;font-size:12px;font-weight:700;color:#334155;">${clinicName}</p>
      <p style="margin:3px 0 0;font-size:11px;color:#64748b;line-height:1.6;">
        Official Receipt &amp; Billing Statement
      </p>
    </div>
  </div>
</body>
</html>`,

    treatment: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:24px 12px;background:#f6f8fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:18px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 10px 28px -6px rgba(15,23,42,0.06);">
    <div style="height:6px;background:linear-gradient(90deg, #0f4c42 0%, #0d9488 50%, #d4af37 100%);"></div>
    <div style="padding:28px 32px 20px;border-bottom:1px solid #f1f5f9;">
      <table cellpadding="0" cellspacing="0">
        <tr>
          <td style="width:40px;height:40px;background:linear-gradient(135deg, #0f4c42 0%, #064039 100%);border-radius:12px;text-align:center;vertical-align:middle;">
            <span style="font-size:20px;line-height:1;">🦷</span>
          </td>
          <td style="padding-left:14px;">
            <p style="margin:0;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.18em;color:#0d5c52;">Dental Clinic &amp; Surgery</p>
            <p style="margin:3px 0 0;font-size:18px;font-weight:800;color:#0f172a;letter-spacing:-0.02em;">${clinicName}</p>
          </td>
        </tr>
      </table>
    </div>
    <div style="padding:32px 32px 24px;">
      <div style="margin-bottom:18px;">
        <span style="display:inline-block;padding:5px 13px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;background:#eff6ff;color:#1e40af;border:1px solid #bfdbfe;">
          🦷 Clinical Summary &amp; Aftercare
        </span>
      </div>
      <p style="margin:0 0 12px;font-size:16px;font-weight:700;color:#0f172a;">Dear <strong>Ada Okafor</strong>,</p>
      <p style="margin:0 0 16px;font-size:14px;color:#334155;line-height:1.7;">
        Thank you for visiting us today with <strong>Dr. Eric Stephen</strong>. Here is your official clinical visit summary:
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin:22px 0;">
        <tr>
          <td style="padding:12px 16px;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;font-weight:700;color:#64748b;width:34%;border-bottom:1px solid #edf2f7;">Procedure</td>
          <td style="padding:12px 16px;font-size:14px;font-weight:700;color:#0d5c52;border-bottom:1px solid #edf2f7;">
            <span style="background:#e6f7f5;color:#0d5c52;padding:3px 10px;border-radius:6px;font-size:13px;border:1px solid #99ded6;">Root Canal Therapy (Tooth #16)</span>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 16px;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;font-weight:700;color:#64748b;">Clinical Notes</td>
          <td style="padding:12px 16px;font-size:13px;color:#334155;line-height:1.6;">
            Access cavity prepared, 3 canals located and shaped under rubber dam isolation. Temporary dressing placed.
          </td>
        </tr>
      </table>
      <p style="margin:20px 0 10px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#0f172a;">
        Prescribed Medication
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;font-size:13px;">
        <tr style="background:#edf2f7;">
          <th style="padding:10px 12px;text-align:left;color:#475569;font-size:11px;text-transform:uppercase;">Medicine</th>
          <th style="padding:10px 12px;text-align:left;color:#475569;font-size:11px;text-transform:uppercase;">Dose</th>
          <th style="padding:10px 12px;text-align:left;color:#475569;font-size:11px;text-transform:uppercase;">Frequency</th>
          <th style="padding:10px 12px;text-align:left;color:#475569;font-size:11px;text-transform:uppercase;">Duration</th>
        </tr>
        <tr>
          <td style="padding:10px 12px;font-weight:700;color:#0f172a;border-bottom:1px solid #e2e8f0;">Amoxicillin</td>
          <td style="padding:10px 12px;color:#64748b;border-bottom:1px solid #e2e8f0;">500mg</td>
          <td style="padding:10px 12px;color:#64748b;border-bottom:1px solid #e2e8f0;">3 times daily</td>
          <td style="padding:10px 12px;color:#64748b;border-bottom:1px solid #e2e8f0;">5 days</td>
        </tr>
        <tr>
          <td style="padding:10px 12px;font-weight:700;color:#0f172a;">Ibuprofen</td>
          <td style="padding:10px 12px;color:#64748b;">400mg</td>
          <td style="padding:10px 12px;color:#64748b;">Twice daily</td>
          <td style="padding:10px 12px;color:#64748b;">3 days</td>
        </tr>
      </table>
      <div style="background:#f8fafc;border-left:4px solid #0d5c52;border-radius:0 10px 10px 0;padding:14px 18px;margin:22px 0;">
        <p style="margin:0;font-size:13px;color:#334155;line-height:1.65;">
          <strong>Post-Treatment Care:</strong> Avoid chewing hard foods on the upper right quadrant until the permanent crown is placed. If severe pain or swelling occurs, call our 24/7 hotline immediately.
        </p>
      </div>
    </div>
    <div style="background:#fafbfc;border-top:1px solid #edf2f7;padding:22px 32px;">
      <p style="margin:0;font-size:12px;font-weight:700;color:#334155;">${clinicName}</p>
      <p style="margin:3px 0 0;font-size:11px;color:#64748b;line-height:1.6;">
        Electronic Health Record (EHR) Clinical Summary
      </p>
    </div>
  </div>
</body>
</html>`,

    birthday: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:24px 12px;background:#f6f8fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:18px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 10px 28px -6px rgba(15,23,42,0.06);">
    <div style="height:6px;background:linear-gradient(90deg, #0f4c42 0%, #0d9488 50%, #d4af37 100%);"></div>
    <div style="padding:28px 32px 20px;border-bottom:1px solid #f1f5f9;">
      <table cellpadding="0" cellspacing="0">
        <tr>
          <td style="width:40px;height:40px;background:linear-gradient(135deg, #0f4c42 0%, #064039 100%);border-radius:12px;text-align:center;vertical-align:middle;">
            <span style="font-size:20px;line-height:1;">🦷</span>
          </td>
          <td style="padding-left:14px;">
            <p style="margin:0;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.18em;color:#0d5c52;">Dental Clinic &amp; Surgery</p>
            <p style="margin:3px 0 0;font-size:18px;font-weight:800;color:#0f172a;letter-spacing:-0.02em;">${clinicName}</p>
          </td>
        </tr>
      </table>
    </div>
    <div style="padding:32px 32px 24px;">
      <div style="margin-bottom:18px;">
        <span style="display:inline-block;padding:5px 13px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;background:#e6f7f5;color:#0d5c52;border:1px solid #99ded6;">
          🎉 Warmest Birthday Wishes
        </span>
      </div>
      <p style="margin:0 0 12px;font-size:16px;font-weight:700;color:#0f172a;">Dear <strong>Ada Okafor</strong>,</p>
      <h2 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#0f172a;letter-spacing:-0.02em;">
        Happy Birthday from all of us! 🎂
      </h2>
      <p style="margin:0 0 16px;font-size:14px;color:#334155;line-height:1.7;">
        Wishing you a wonderful celebration filled with happiness and bright smiles. We are genuinely delighted to be your dental health provider and wish you radiant health and prosperity in the year ahead.
      </p>
      <div style="background:#f8fafc;border-left:4px solid #0d5c52;border-radius:0 10px 10px 0;padding:14px 18px;margin:22px 0;">
        <p style="margin:0;font-size:13px;color:#334155;line-height:1.65;">
          As our valued patient, your smile is our greatest pride. Don't forget to claim your complimentary birthday polish check at your next routine exam!
        </p>
      </div>
      <div style="text-align:center;margin:28px 0 12px;">
        <a href="#" style="background:linear-gradient(135deg, #0d5c52 0%, #064039 100%);color:#ffffff;text-decoration:none;padding:13px 32px;border-radius:10px;font-weight:700;font-size:14px;display:inline-block;box-shadow:0 4px 14px rgba(13,92,82,0.25);">
          Book My Annual Routine Checkup →
        </a>
      </div>
    </div>
    <div style="background:#fafbfc;border-top:1px solid #edf2f7;padding:22px 32px;">
      <p style="margin:0;font-size:12px;font-weight:700;color:#334155;">${clinicName}</p>
      <p style="margin:3px 0 0;font-size:11px;color:#64748b;line-height:1.6;">
        Warm regards from our entire clinical and patient care team.
      </p>
    </div>
  </div>
</body>
</html>`,

    reset: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:24px 12px;background:#f6f8fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:18px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 10px 28px -6px rgba(15,23,42,0.06);">
    <div style="height:6px;background:linear-gradient(90deg, #0f4c42 0%, #0d9488 50%, #d4af37 100%);"></div>
    <div style="padding:28px 32px 20px;border-bottom:1px solid #f1f5f9;">
      <table cellpadding="0" cellspacing="0">
        <tr>
          <td style="width:40px;height:40px;background:linear-gradient(135deg, #0f4c42 0%, #064039 100%);border-radius:12px;text-align:center;vertical-align:middle;">
            <span style="font-size:20px;line-height:1;">🦷</span>
          </td>
          <td style="padding-left:14px;">
            <p style="margin:0;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.18em;color:#0d5c52;">Dental Clinic &amp; Surgery</p>
            <p style="margin:3px 0 0;font-size:18px;font-weight:800;color:#0f172a;letter-spacing:-0.02em;">${clinicName}</p>
          </td>
        </tr>
      </table>
    </div>
    <div style="padding:32px 32px 24px;">
      <div style="margin-bottom:18px;">
        <span style="display:inline-block;padding:5px 13px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;background:#fffbeb;color:#92400e;border:1px solid #fde68a;">
          🔒 Security Notice
        </span>
      </div>
      <p style="margin:0 0 12px;font-size:16px;font-weight:700;color:#0f172a;">Dear <strong>Ada Okafor</strong>,</p>
      <p style="margin:0 0 16px;font-size:14px;color:#334155;line-height:1.7;">
        We received a request to reset the password associated with your clinic account. Click the button below to choose a new secure password:
      </p>
      <div style="text-align:center;margin:32px 0 16px;">
        <a href="#" style="background:linear-gradient(135deg, #0d5c52 0%, #064039 100%);color:#ffffff;text-decoration:none;padding:14px 34px;border-radius:10px;font-weight:700;font-size:14px;display:inline-block;box-shadow:0 4px 14px rgba(13,92,82,0.25);">
          Reset My Password →
        </a>
      </div>
      <div style="background:#f8fafc;border-left:4px solid #0d5c52;border-radius:0 10px 10px 0;padding:14px 18px;margin:22px 0;">
        <p style="margin:0;font-size:13px;color:#334155;line-height:1.65;">
          <strong>Security Notice:</strong> This link expires in <strong>1 hour</strong>. If you did not request this reset, you can safely ignore this email — your account remains fully protected.
        </p>
      </div>
    </div>
    <div style="background:#fafbfc;border-top:1px solid #edf2f7;padding:22px 32px;">
      <p style="margin:0;font-size:12px;font-weight:700;color:#334155;">${clinicName}</p>
      <p style="margin:3px 0 0;font-size:11px;color:#64748b;line-height:1.6;">
        Security &amp; Account Protection System
      </p>
    </div>
  </div>
</body>
</html>`,
  };

  return (
    <div className="space-y-6">
      {/* Selector pills & Device switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-sand-50/[0.03] border border-sand-50/10">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedTemplate("confirmation")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              selectedTemplate === "confirmation"
                ? "bg-turq-600 text-ink-950 font-semibold"
                : "text-sand-50/60 hover:text-sand-50 hover:bg-sand-50/5"
            }`}
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>Appointment Confirmation</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedTemplate("reminder")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              selectedTemplate === "reminder"
                ? "bg-turq-600 text-ink-950 font-semibold"
                : "text-sand-50/60 hover:text-sand-50 hover:bg-sand-50/5"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Visit Reminder</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedTemplate("receipt")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              selectedTemplate === "receipt"
                ? "bg-turq-600 text-ink-950 font-semibold"
                : "text-sand-50/60 hover:text-sand-50 hover:bg-sand-50/5"
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Payment Receipt</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedTemplate("treatment")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              selectedTemplate === "treatment"
                ? "bg-turq-600 text-ink-950 font-semibold"
                : "text-sand-50/60 hover:text-sand-50 hover:bg-sand-50/5"
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Treatment &amp; Meds</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedTemplate("birthday")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              selectedTemplate === "birthday"
                ? "bg-turq-600 text-ink-950 font-semibold"
                : "text-sand-50/60 hover:text-sand-50 hover:bg-sand-50/5"
            }`}
          >
            <Cake className="w-3.5 h-3.5" />
            <span>Birthday Greeting</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedTemplate("reset")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              selectedTemplate === "reset"
                ? "bg-turq-600 text-ink-950 font-semibold"
                : "text-sand-50/60 hover:text-sand-50 hover:bg-sand-50/5"
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Password Reset</span>
          </button>
        </div>

        {/* Device toggle */}
        <div className="flex items-center gap-1 border border-sand-50/15 p-1 rounded-xl shrink-0">
          <button
            type="button"
            onClick={() => setDeviceView("desktop")}
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              deviceView === "desktop"
                ? "bg-sand-50/15 text-turq-400"
                : "text-sand-50/40 hover:text-sand-50"
            }`}
            title="Desktop preview"
          >
            <Monitor className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setDeviceView("mobile")}
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              deviceView === "mobile"
                ? "bg-sand-50/15 text-turq-400"
                : "text-sand-50/40 hover:text-sand-50"
            }`}
            title="Mobile preview"
          >
            <Smartphone className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Simulator Frame */}
      <div className="flex justify-center p-6 md:p-10 rounded-2xl bg-black/40 border border-sand-50/10 min-h-[640px]">
        <div
          className={`w-full transition-all duration-300 ${
            deviceView === "mobile" ? "max-w-[380px]" : "max-w-[620px]"
          }`}
        >
          {/* Email Client Header bar */}
          <div className="bg-ink-900 border border-sand-50/10 rounded-t-2xl px-4 py-2.5 flex items-center justify-between text-xs text-sand-50/50">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
            </div>
            <span className="text-[11px] font-mono text-sand-50/30">
              {deviceView === "mobile" ? "iPhone Mail · 380px" : "Gmail Client · Desktop"}
            </span>
            <Sparkles className="w-3.5 h-3.5 text-turq-400/60" />
          </div>

          {/* Rendered Email Frame */}
          <div className="border border-t-0 border-sand-50/10 rounded-b-2xl overflow-hidden bg-white shadow-2xl">
            <iframe
              title="Email Template Live Preview"
              srcDoc={templates[selectedTemplate]}
              className="w-full border-none h-[640px] bg-[#f6f8fa]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
