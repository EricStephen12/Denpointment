"use client";

import { useState, useTransition } from "react";
import { sendContactMessage } from "@/app/actions/contact";

export default function ContactForm() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok?: boolean; error?: string } | null>(null);

  const fieldClass =
    "w-full bg-transparent border-b border-sand-50/20 px-0 py-3 text-sm text-sand-50 placeholder:text-sand-50/30 focus:outline-none focus:border-turq-400 transition-colors";

  return (
    <form
      className="space-y-8"
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
        <label htmlFor="name" className="block text-[10px] font-medium text-sand-50/40 uppercase tracking-[0.2em] mb-2">
          Name
        </label>
        <input id="name" name="name" required maxLength={80} className={fieldClass} />
      </div>
      <div>
        <label htmlFor="email" className="block text-[10px] font-medium text-sand-50/40 uppercase tracking-[0.2em] mb-2">
          Email
        </label>
        <input id="email" name="email" type="email" required maxLength={80} className={fieldClass} />
      </div>
      <div>
        <label htmlFor="message" className="block text-[10px] font-medium text-sand-50/40 uppercase tracking-[0.2em] mb-2">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          maxLength={2000}
          rows={4}
          className={`${fieldClass} resize-y`}
        />
      </div>
      {result?.ok && (
        <p className="text-sm text-turq-300">Thanks — your message was sent.</p>
      )}
      {result?.error && (
        <p className="text-sm text-red-400">{result.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="bg-turq-600 hover:bg-turq-500 text-ink-950 px-8 py-3.5 text-sm font-medium tracking-wide transition-colors disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
