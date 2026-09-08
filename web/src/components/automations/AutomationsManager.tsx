"use client";

import React, { useState, useTransition } from "react";
import {
  saveAutomationSettingsAction,
  triggerDailyAutomationsAction,
  sendBroadcastAction,
} from "@/app/actions/automations";
import type { AutomationSettingsData } from "@/lib/automations";
import {
  Sparkles,
  Cake,
  HeartHandshake,
  Send,
  Play,
  CheckCircle2,
  AlertCircle,
  Clock,
  Users,
  Megaphone,
  Tag,
  Loader2,
  ExternalLink,
} from "lucide-react";

type Campaign = {
  id: number;
  title: string;
  subject: string;
  headline: string | null;
  content: string;
  category: string;
  targetAudience: string;
  ctaLabel: string | null;
  ctaUrl: string | null;
  recipientCount: number;
  sentAt: Date;
  status: string;
};

export default function AutomationsManager({
  initialSettings,
  initialCampaigns,
  isEmailConfigured,
  clinicName,
}: {
  initialSettings: AutomationSettingsData;
  initialCampaigns: Campaign[];
  isEmailConfigured: boolean;
  clinicName: string;
}) {
  const [activeTab, setActiveTab] = useState<"automations" | "broadcast" | "history">("automations");

  // Automation settings state
  const [birthdayEnabled, setBirthdayEnabled] = useState(initialSettings.birthdayEnabled);
  const [birthdaySubject, setBirthdaySubject] = useState(initialSettings.birthdaySubject);
  const [birthdayMessage, setBirthdayMessage] = useState(
    initialSettings.birthdayMessage ||
      `The entire dental care team at ${clinicName} wishes you a wonderful birthday filled with health, joy, and plenty of reasons to smile bright!`
  );

  const [anniversaryEnabled, setAnniversaryEnabled] = useState(initialSettings.anniversaryEnabled);
  const [anniversarySubject, setAnniversarySubject] = useState(initialSettings.anniversarySubject);
  const [anniversaryMessage, setAnniversaryMessage] = useState(
    initialSettings.anniversaryMessage ||
      `Thank you for trusting our doctors with your dental wellness over the years. We are honored to be part of your smile story!`
  );

  // Broadcast state
  const [campaignCategory, setCampaignCategory] = useState<"broadcast" | "promo">("broadcast");
  const [campaignAudience, setCampaignAudience] = useState<"all" | "active" | "upcoming" | "inactive">("all");
  const [campaignTitle, setCampaignTitle] = useState("");
  const [campaignSubject, setCampaignSubject] = useState("");
  const [campaignHeadline, setCampaignHeadline] = useState("");
  const [campaignContent, setCampaignContent] = useState("");
  const [campaignCtaLabel, setCampaignCtaLabel] = useState("Book Appointment");
  const [campaignCtaUrl, setCampaignCtaUrl] = useState("/dashboard/book");

  // Feedback states
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [triggerStatus, setTriggerStatus] = useState<string | null>(null);
  const [broadcastStatus, setBroadcastStatus] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns);

  const [isPending, startTransition] = useTransition();

  // Save automations
  function handleSaveAutomations(e: React.FormEvent) {
    e.preventDefault();
    setSaveStatus(null);

    const formData = new FormData();
    formData.set("birthdayEnabled", String(birthdayEnabled));
    formData.set("birthdaySubject", birthdaySubject);
    formData.set("birthdayMessage", birthdayMessage);
    formData.set("anniversaryEnabled", String(anniversaryEnabled));
    formData.set("anniversarySubject", anniversarySubject);
    formData.set("anniversaryMessage", anniversaryMessage);

    startTransition(async () => {
      const res = await saveAutomationSettingsAction(formData);
      if (res?.error) {
        setSaveStatus(`Error: ${res.error}`);
      } else {
        setSaveStatus("Automation templates and settings saved successfully!");
        setTimeout(() => setSaveStatus(null), 4000);
      }
    });
  }

  // Trigger daily check immediately
  function handleTriggerNow() {
    setTriggerStatus(null);
    startTransition(async () => {
      const res = await triggerDailyAutomationsAction();
      if (res?.error) {
        setTriggerStatus(`Failed: ${res.error}`);
      } else if (res?.stats) {
        const { birthdaysSent, anniversariesSent, eligibleBirthdays, eligibleAnniversaries } = res.stats;
        setTriggerStatus(
          `Daily sweep executed: ${birthdaysSent} birthday wishes sent (${eligibleBirthdays} eligible), ${anniversariesSent} anniversary wishes sent (${eligibleAnniversaries} eligible).`
        );
      }
    });
  }

  // Send Broadcast Campaign
  function handleSendBroadcast(e: React.FormEvent) {
    e.preventDefault();
    setBroadcastStatus(null);

    if (!campaignTitle || !campaignSubject || !campaignContent) {
      setBroadcastStatus("Error: Please fill in Title, Subject, and Message content.");
      return;
    }

    const formData = new FormData();
    formData.set("title", campaignTitle);
    formData.set("subject", campaignSubject);
    formData.set("headline", campaignHeadline);
    formData.set("content", campaignContent);
    formData.set("category", campaignCategory);
    formData.set("targetAudience", campaignAudience);
    formData.set("ctaLabel", campaignCtaLabel);
    formData.set("ctaUrl", campaignCtaUrl);

    startTransition(async () => {
      const res = await sendBroadcastAction(formData);
      if (res?.error) {
        setBroadcastStatus(`Failed: ${res.error}`);
      } else {
        setBroadcastStatus(`Campaign sent successfully to ${res.recipientCount} patients!`);
        setCampaigns((prev) => [
          {
            id: Date.now(),
            title: campaignTitle,
            subject: campaignSubject,
            headline: campaignHeadline || null,
            content: campaignContent,
            category: campaignCategory,
            targetAudience: campaignAudience,
            ctaLabel: campaignCtaLabel || null,
            ctaUrl: campaignCtaUrl || null,
            recipientCount: res.recipientCount ?? 0,
            sentAt: new Date(),
            status: "sent",
          },
          ...prev,
        ]);
        setCampaignTitle("");
        setCampaignSubject("");
        setCampaignHeadline("");
        setCampaignContent("");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Service banner */}
      {!isEmailConfigured && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3 text-amber-300 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Resend Email API Key Not Configured</p>
            <p className="text-xs text-amber-300/80 mt-1">
              Emails will be logged in simulated test mode. To send live emails to patients, add a valid{" "}
              <code className="bg-black/30 px-1.5 py-0.5 rounded text-amber-200">RESEND_API_KEY</code> to your{" "}
              <code className="bg-black/30 px-1.5 py-0.5 rounded text-amber-200">.env</code> file.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-sand-50/10 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("automations")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeTab === "automations"
              ? "bg-turq-500/15 text-turq-300 border border-turq-500/30"
              : "text-sand-50/60 hover:text-sand-50 hover:bg-sand-50/5"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Automations (Birthdays & Milestones)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("broadcast")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeTab === "broadcast"
              ? "bg-turq-500/15 text-turq-300 border border-turq-500/30"
              : "text-sand-50/60 hover:text-sand-50 hover:bg-sand-50/5"
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Broadcast & Promo Blasts</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeTab === "history"
              ? "bg-turq-500/15 text-turq-300 border border-turq-500/30"
              : "text-sand-50/60 hover:text-sand-50 hover:bg-sand-50/5"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Campaign History ({campaigns.length})</span>
        </button>
      </div>

      {/* ── TAB 1: AUTOMATIONS (BIRTHDAYS & ANNIVERSARIES) ── */}
      {activeTab === "automations" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-sand-50/[0.02] border border-sand-50/10">
            <div>
              <h2 className="text-base font-semibold text-sand-50">Automated Daily Sweeps</h2>
              <p className="text-xs text-sand-50/60 mt-0.5">
                Checks patient birthdays and smile anniversaries every day. Each patient receives at most 1 greeting per year.
              </p>
            </div>
            <button
              type="button"
              onClick={handleTriggerNow}
              disabled={isPending}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sand-50/10 hover:bg-sand-50/15 border border-sand-50/15 text-sand-50 text-xs font-medium transition-all disabled:opacity-50 shrink-0 cursor-pointer"
            >
              {isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 text-turq-400" />
              )}
              <span>Run Today's Check Now</span>
            </button>
          </div>

          {triggerStatus && (
            <div className="p-4 rounded-xl bg-turq-500/10 border border-turq-500/25 text-turq-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{triggerStatus}</span>
            </div>
          )}

          <form onSubmit={handleSaveAutomations} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Birthday Card */}
              <div className="dash-surface p-6 space-y-4 rounded-2xl border border-sand-50/10">
                <div className="flex items-center justify-between pb-3 border-b border-sand-50/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-pink-500/15 text-pink-400 flex items-center justify-center">
                      <Cake className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-sand-50">Happy Birthday Greetings</h3>
                      <p className="text-xs text-sand-50/50">Triggers on patient's birthday</p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={birthdayEnabled}
                      onChange={(e) => setBirthdayEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-sand-50/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-turq-500"></div>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-medium text-sand-50/60 mb-1.5">Subject Line</label>
                  <input
                    type="text"
                    value={birthdaySubject}
                    onChange={(e) => setBirthdaySubject(e.target.value)}
                    required
                    disabled={!birthdayEnabled}
                    className="dash-input text-sm disabled:opacity-40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-sand-50/60 mb-1.5">
                    Personal Greeting Message
                  </label>
                  <textarea
                    rows={4}
                    value={birthdayMessage}
                    onChange={(e) => setBirthdayMessage(e.target.value)}
                    disabled={!birthdayEnabled}
                    placeholder="Warm personal wishes from the clinic..."
                    className="dash-input text-sm resize-none disabled:opacity-40"
                  />
                  <p className="text-[11px] text-sand-50/40 mt-1">
                    Delivered automatically on their birthday with celebratory styling.
                  </p>
                </div>
              </div>

              {/* Anniversary Card */}
              <div className="dash-surface p-6 space-y-4 rounded-2xl border border-sand-50/10">
                <div className="flex items-center justify-between pb-3 border-b border-sand-50/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
                      <HeartHandshake className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-sand-50">Smile Anniversary</h3>
                      <p className="text-xs text-sand-50/50">Triggers annually on visit milestone</p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={anniversaryEnabled}
                      onChange={(e) => setAnniversaryEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-sand-50/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-turq-500"></div>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-medium text-sand-50/60 mb-1.5">Subject Line</label>
                  <input
                    type="text"
                    value={anniversarySubject}
                    onChange={(e) => setAnniversarySubject(e.target.value)}
                    required
                    disabled={!anniversaryEnabled}
                    className="dash-input text-sm disabled:opacity-40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-sand-50/60 mb-1.5">
                    Milestone Message
                  </label>
                  <textarea
                    rows={4}
                    value={anniversaryMessage}
                    onChange={(e) => setAnniversaryMessage(e.target.value)}
                    disabled={!anniversaryEnabled}
                    placeholder="Heartfelt appreciation message..."
                    className="dash-input text-sm resize-none disabled:opacity-40"
                  />
                  <p className="text-[11px] text-sand-50/40 mt-1">
                    Sent once a year to patients who reached their 1+ year mark with {clinicName}.
                  </p>
                </div>
              </div>
            </div>

            {saveStatus && (
              <div
                className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
                  saveStatus.startsWith("Error")
                    ? "bg-red-500/10 border border-red-500/20 text-red-400"
                    : "bg-turq-500/10 border border-turq-500/20 text-turq-300"
                }`}
              >
                {saveStatus.startsWith("Error") ? (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                )}
                <span>{saveStatus}</span>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isPending}
                className="px-6 py-3 rounded-xl bg-turq-600 hover:bg-turq-500 text-ink-950 font-semibold text-sm transition-all shadow-lg shadow-turq-900/20 disabled:opacity-60 cursor-pointer"
              >
                {isPending ? "Saving..." : "Save Automation Settings"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── TAB 2: COMPOSE BROADCAST / PROMO BLAST ── */}
      {activeTab === "broadcast" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Form on left */}
          <form onSubmit={handleSendBroadcast} className="lg:col-span-7 dash-surface p-6 rounded-2xl border border-sand-50/10 space-y-5">
            <div>
              <h2 className="text-base font-semibold text-sand-50">Create Campaign Blast</h2>
              <p className="text-xs text-sand-50/60 mt-0.5">
                Send an announcement or special promotion directly to patient email inboxes via Resend.
              </p>
            </div>

            {broadcastStatus && (
              <div
                className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
                  broadcastStatus.startsWith("Failed") || broadcastStatus.startsWith("Error")
                    ? "bg-red-500/10 border border-red-500/20 text-red-400"
                    : "bg-turq-500/10 border border-turq-500/20 text-turq-300"
                }`}
              >
                {broadcastStatus.startsWith("Failed") || broadcastStatus.startsWith("Error") ? (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                )}
                <span>{broadcastStatus}</span>
              </div>
            )}

            {/* Campaign Category */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCampaignCategory("broadcast")}
                className={`p-3 rounded-xl text-left border transition-all flex items-center gap-3 ${
                  campaignCategory === "broadcast"
                    ? "bg-turq-500/15 border-turq-500/40 text-sand-50"
                    : "bg-sand-50/[0.02] border-sand-50/10 text-sand-50/60 hover:text-sand-50"
                }`}
              >
                <Megaphone className="w-4 h-4 text-turq-400 shrink-0" />
                <div>
                  <p className="text-xs font-semibold">Announcement</p>
                  <p className="text-[10px] text-sand-50/50">News, hours & updates</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setCampaignCategory("promo")}
                className={`p-3 rounded-xl text-left border transition-all flex items-center gap-3 ${
                  campaignCategory === "promo"
                    ? "bg-emerald-500/15 border-emerald-500/40 text-sand-50"
                    : "bg-sand-50/[0.02] border-sand-50/10 text-sand-50/60 hover:text-sand-50"
                }`}
              >
                <Tag className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-xs font-semibold">Promotion</p>
                  <p className="text-[10px] text-sand-50/50">Special offers & packages</p>
                </div>
              </button>
            </div>

            {/* Target Audience */}
            <div>
              <label className="block text-xs font-medium text-sand-50/60 mb-1.5 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                <span>Target Audience</span>
              </label>
              <select
                value={campaignAudience}
                onChange={(e: any) => setCampaignAudience(e.target.value)}
                className="dash-input text-sm"
              >
                <option value="all">All Patients (Full Patient Roster)</option>
                <option value="active">Active Patients (Visited in Last 12 Months)</option>
                <option value="upcoming">Patients With Upcoming Appointments</option>
                <option value="inactive">Inactive Patients (No Visit in 12+ Months)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-sand-50/60 mb-1.5">Campaign Name (Internal)</label>
              <input
                type="text"
                value={campaignTitle}
                onChange={(e) => setCampaignTitle(e.target.value)}
                placeholder="e.g., Summer Oral Hygiene Awareness"
                required
                className="dash-input text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-sand-50/60 mb-1.5">Email Subject Line</label>
              <input
                type="text"
                value={campaignSubject}
                onChange={(e) => setCampaignSubject(e.target.value)}
                placeholder="e.g., Important Updates Regarding Your Dental Care at Glow Dental"
                required
                className="dash-input text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-sand-50/60 mb-1.5">Banner Headline (Optional)</label>
              <input
                type="text"
                value={campaignHeadline}
                onChange={(e) => setCampaignHeadline(e.target.value)}
                placeholder="e.g., Extended Saturday Hours Now Available"
                className="dash-input text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-sand-50/60 mb-1.5">Message Content</label>
              <textarea
                rows={5}
                value={campaignContent}
                onChange={(e) => setCampaignContent(e.target.value)}
                placeholder="Write your email body here..."
                required
                className="dash-input text-sm resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-sand-50/60 mb-1.5">Button Label (Optional)</label>
                <input
                  type="text"
                  value={campaignCtaLabel}
                  onChange={(e) => setCampaignCtaLabel(e.target.value)}
                  placeholder="e.g., Book Appointment"
                  className="dash-input text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-sand-50/60 mb-1.5">Button Link</label>
                <input
                  type="text"
                  value={campaignCtaUrl}
                  onChange={(e) => setCampaignCtaUrl(e.target.value)}
                  placeholder="e.g., /dashboard/book"
                  className="dash-input text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3.5 rounded-xl bg-turq-600 hover:bg-turq-500 text-ink-950 font-semibold text-sm transition-all shadow-lg shadow-turq-900/30 flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Dispatching Campaign via Resend...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Dispatch Campaign Now</span>
                </>
              )}
            </button>
          </form>

          {/* Live Preview on right */}
          <div className="lg:col-span-5 space-y-3 sticky top-24">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-sand-50/50 font-medium">
                Live Email Preview
              </span>
              <span className="text-[11px] text-turq-400 bg-turq-500/10 px-2 py-0.5 rounded-full border border-turq-500/20">
                Resend HTML Preview
              </span>
            </div>

            <div className="bg-white rounded-2xl p-6 text-slate-900 shadow-2xl border border-slate-200">
              <div className="border-b-2 border-turq-600 pb-3 mb-4 flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900">{clinicName}</span>
                {campaignCategory === "promo" && (
                  <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    Special Offer
                  </span>
                )}
              </div>

              {campaignHeadline && (
                <h4 className="font-bold text-base text-slate-900 mb-2 leading-tight">
                  {campaignHeadline}
                </h4>
              )}

              <p className="text-xs text-slate-500 mb-2">Hello John,</p>

              <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line min-h-16">
                {campaignContent || "Your composed message will appear here in real-time as you write..."}
              </div>

              {campaignCtaLabel && (
                <div className="text-center my-4">
                  <span className="inline-block bg-turq-600 text-white font-medium text-xs py-2 px-5 rounded-full">
                    {campaignCtaLabel}
                  </span>
                </div>
              )}

              <div className="border-t border-slate-100 pt-3 text-center">
                <p className="text-[10px] text-slate-400">Warm regards, <br /><strong>{clinicName}</strong></p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: CAMPAIGN HISTORY & LOGS ── */}
      {activeTab === "history" && (
        <div className="dash-surface rounded-2xl border border-sand-50/10 overflow-hidden">
          <div className="p-5 border-b border-sand-50/10 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-sand-50">Dispatched Campaigns & Broadcasts</h2>
              <p className="text-xs text-sand-50/50 mt-0.5">Audit log of one-to-many communications sent via Resend.</p>
            </div>
          </div>

          {campaigns.length === 0 ? (
            <div className="p-12 text-center text-sand-50/40 text-xs">
              No broadcast campaigns sent yet. Use the "Broadcast & Promo Blasts" tab to send your first email.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-sand-50/[0.03] text-sand-50/50 border-b border-sand-50/10 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3">Campaign Title</th>
                    <th className="px-5 py-3">Category</th>
                    <th className="px-5 py-3">Target Audience</th>
                    <th className="px-5 py-3 text-right">Recipients</th>
                    <th className="px-5 py-3 text-right">Sent At</th>
                    <th className="px-5 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-50/5">
                  {campaigns.map((camp) => (
                    <tr key={camp.id} className="hover:bg-sand-50/[0.02]">
                      <td className="px-5 py-3.5 font-medium text-sand-50">
                        <div>{camp.title}</div>
                        <div className="text-[11px] text-sand-50/40 font-normal truncate max-w-xs">{camp.subject}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                            camp.category === "promo"
                              ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20"
                              : "bg-blue-500/15 text-blue-300 border border-blue-500/20"
                          }`}
                        >
                          {camp.category}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 capitalize text-sand-50/70">{camp.targetAudience}</td>
                      <td className="px-5 py-3.5 text-right font-semibold text-sand-50">{camp.recipientCount}</td>
                      <td className="px-5 py-3.5 text-right text-sand-50/50">
                        {new Date(camp.sentAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="inline-flex items-center gap-1 text-[11px] text-turq-400 font-medium">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Sent</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
