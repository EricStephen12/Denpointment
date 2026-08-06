"use server";

import { getSiteContent } from "@/lib/site";
import { sendContactInquiryEmail } from "@/lib/email";
import { notifyN8n } from "@/lib/n8n";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function sendContactMessage(formData: FormData) {
  const name = ((formData.get("name") as string) || "").trim();
  const email = ((formData.get("email") as string) || "").trim().toLowerCase();
  const message = ((formData.get("message") as string) || "").trim();

  if (!name || !email || !message) {
    return { error: "Please fill in all fields." };
  }
  if (name.length > 80 || email.length > 80 || message.length > 2000) {
    return { error: "One of the fields is too long." };
  }
  if (!EMAIL_RE.test(email)) {
    return { error: "Please enter a valid email address." };
  }

  const site = await getSiteContent();
  try {
    await sendContactInquiryEmail({
      to: site.email,
      fromName: name,
      fromEmail: email,
      message,
      clinicName: site.clinicName,
    });
    await notifyN8n("contact", {
      name,
      email,
      message,
      clinicEmail: site.email,
    });
    return { ok: true };
  } catch (error) {
    console.error("[contact] Failed to send inquiry:", error);
    return { error: "Couldn't send your message right now. Please try calling the clinic." };
  }
}
