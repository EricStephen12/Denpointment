"use client";

import { useState, useTransition } from "react";
import { sendContactMessage } from "@/app/actions/contact";

export default function ContactForm() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok?: boolean; error?: string } | null>(null);

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        setResult(null);
        startTransition(async () => {
          const res = await sendContactMessage(formData);
          setResult(res);
          if (res.ok) e.currentTarget.reset();
        });
      }}
    >
      <div>
        <label htmlFor="name" className="block text-xs font-medium text-ink-950/50 mb-1">Name</label>
        <input
          id="name"
          name="name"
          required
          maxLength={80}
          className="w-full rounded-lg border border-ink-950/15 bg-white px-3 py-2.5 text-sm text-ink-950 focus:outline-none focus:ring-2 focus:ring-turq-500/40"
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-xs font-medium text-ink-950/50 mb-1">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          maxLength={80}
          className="w-full rounded-lg border border-ink-950/15 bg-white px-3 py-2.5 text-sm text-ink-950 focus:outline-none focus:ring-2 focus:ring-turq-500/40"
        />
      </div>
      <div>
        <label htmlFor="message" className="block text-xs font-medium text-ink-950/50 mb-1">Message</label>
        <textarea
          id="message"
          name="message"
          required
          maxLength={2000}
          rows={4}
          className="w-full rounded-lg border border-ink-950/15 bg-white px-3 py-2.5 text-sm text-ink-950 focus:outline-none focus:ring-2 focus:ring-turq-500/40 resize-y"
        />
      </div>
      {result?.ok && (
        <p className="text-sm text-turq-700">Thanks — your message was sent.</p>
      )}
      {result?.error && (
        <p className="text-sm text-red-600">{result.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="bg-ink-950 hover:bg-turq-600 text-sand-50 hover:text-ink-950 px-6 py-3 rounded-full text-sm font-medium transition-colors disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
