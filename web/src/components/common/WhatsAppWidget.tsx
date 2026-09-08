"use client";

import React, { useState } from "react";
import { MessageCircle, X, Send, Sparkles } from "lucide-react";

type WhatsAppWidgetProps = {
  clinicName: string;
  phone: string;
};

export default function WhatsAppWidget({
  clinicName,
  phone,
}: WhatsAppWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Normalize Nigerian / International phone number for wa.me link
  const rawDigits = phone.replace(/[^0-9]/g, "");
  const waNumber = rawDigits.startsWith("0") ? `234${rawDigits.slice(1)}` : rawDigits;

  const defaultMessage = `Hello ${clinicName}, I'd like to make an inquiry about your dental services.`;
  const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(defaultMessage)}`;

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans print:hidden">
      {/* Pop-up Chat Card */}
      {isOpen && (
        <div className="mb-3 w-80 sm:w-88 rounded-2xl bg-ink-900 border border-sand-50/15 shadow-2xl overflow-hidden animate-fade-up">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm text-white">
                  {clinicName.charAt(0)}
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-emerald-800 rounded-full" />
              </div>
              <div>
                <h4 className="font-semibold text-sm leading-none">{clinicName}</h4>
                <p className="text-[11px] text-white/80 mt-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                  Reception Online
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-white/70 hover:text-white p-1 rounded-lg transition-colors"
              aria-label="Close chat preview"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 bg-ink-950/80 space-y-3">
            <div className="bg-ink-900 border border-sand-50/10 rounded-2xl rounded-tl-sm p-3.5 text-xs text-sand-50/90 leading-relaxed shadow-sm">
              <p className="font-medium text-turq-300 mb-1 flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Clinic Reception
              </p>
              Hello! 👋 Welcome to {clinicName}. How can our dental specialists help you today?
            </div>
            <p className="text-[10px] text-sand-50/40 text-center tracking-wider uppercase">
              Usually replies in a few minutes
            </p>
          </div>

          {/* Action CTA */}
          <div className="p-3 bg-ink-900 border-t border-sand-50/10">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/20"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Start WhatsApp Chat</span>
            </a>
          </div>
        </div>
      )}

      {/* Floating Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Chat with clinic on WhatsApp"
        className="group relative flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white p-3.5 sm:px-4 sm:py-3 rounded-full shadow-2xl shadow-emerald-600/40 hover:scale-105 transition-all duration-200 border border-emerald-400/30"
      >
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full animate-ping" />
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-ink-950" />
        <MessageCircle className="h-5 w-5" />
        <span className="hidden sm:inline text-xs font-semibold tracking-wide">
          {isOpen ? "Close" : "Chat with Clinic"}
        </span>
      </button>
    </div>
  );
}
