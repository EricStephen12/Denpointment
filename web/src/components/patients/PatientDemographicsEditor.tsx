"use client";

import React, { useState, useTransition } from "react";
import {
  updatePatientDemographics,
  addChronicDisease,
  removeChronicDisease,
  addPatientContactNumber,
  removePatientContactNumber,
} from "@/app/actions/patients";
import {
  addCurrentMedication,
  removeCurrentMedication,
} from "@/app/actions/clinical-care";
import {
  Pencil,
  X,
  Plus,
  Check,
  Phone,
  MapPin,
  User,
  Pill,
  AlertTriangle,
  Mail,
  Trash2,
} from "lucide-react";

type Medication = {
  medicationId: number;
  name: string;
  dose: string | null;
  notes: string | null;
};

type Props = {
  patientId: number;
  canEdit: boolean;
  data: {
    firstName: string;
    lastName: string;
    email?: string;
    phone: string;
    contacts?: string[];
    street: string;
    city: string;
    occupation: string;
    referralSource: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    diseases: string[];
    currentMedications: Medication[];
  };
};

const REFERRAL_OPTIONS = [
  "Walk-in",
  "Referred by patient",
  "Google",
  "Instagram",
  "Facebook",
  "Doctor referral",
  "Other",
];

export default function PatientDemographicsEditor({ patientId, canEdit, data }: Props) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [newDisease, setNewDisease] = useState("");
  const [newMedName, setNewMedName] = useState("");
  const [newMedDose, setNewMedDose] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [showAddPhone, setShowAddPhone] = useState(false);

  function handleDemographicsSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("patientId", String(patientId));
    setError(null);
    startTransition(async () => {
      try {
        await updatePatientDemographics(fd);
        setEditing(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save.");
      }
    });
  }

  function handleAddDisease(e: React.FormEvent) {
    e.preventDefault();
    if (!newDisease.trim()) return;
    const fd = new FormData();
    fd.set("patientId", String(patientId));
    fd.set("disease", newDisease.trim());
    setError(null);
    startTransition(async () => {
      try {
        await addChronicDisease(fd);
        setNewDisease("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not add.");
      }
    });
  }

  function handleRemoveDisease(disease: string) {
    const fd = new FormData();
    fd.set("patientId", String(patientId));
    fd.set("disease", disease);
    setError(null);
    startTransition(async () => {
      try {
        await removeChronicDisease(fd);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not remove.");
      }
    });
  }

  function handleAddMedication(e: React.FormEvent) {
    e.preventDefault();
    if (!newMedName.trim()) return;
    const fd = new FormData();
    fd.set("patientId", String(patientId));
    fd.set("name", newMedName.trim());
    fd.set("dose", newMedDose.trim());
    setError(null);
    startTransition(async () => {
      try {
        await addCurrentMedication(fd);
        setNewMedName("");
        setNewMedDose("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not add.");
      }
    });
  }

  function handleRemoveMedication(medicationId: number) {
    const fd = new FormData();
    fd.set("medicationId", String(medicationId));
    setError(null);
    startTransition(async () => {
      try {
        await removeCurrentMedication(fd);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not remove.");
      }
    });
  }

  function handleAddContactNumber(e: React.FormEvent) {
    e.preventDefault();
    if (!newPhone.trim()) return;
    const fd = new FormData();
    fd.set("patientId", String(patientId));
    fd.set("phone", newPhone.trim());
    setError(null);
    startTransition(async () => {
      try {
        await addPatientContactNumber(fd);
        setNewPhone("");
        setShowAddPhone(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not add phone number.");
      }
    });
  }

  function handleRemoveContactNumber(phone: string) {
    if (!confirm(`Remove phone number ${phone}?`)) return;
    const fd = new FormData();
    fd.set("patientId", String(patientId));
    fd.set("phone", phone);
    setError(null);
    startTransition(async () => {
      try {
        await removePatientContactNumber(fd);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not remove phone number.");
      }
    });
  }

  const allContacts = data.contacts && data.contacts.length > 0
    ? data.contacts
    : data.phone
    ? [data.phone]
    : [];

  return (
    <div className="dash-surface p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-turq-400" />
          <h2 className="text-sm font-semibold text-sand-50">Patient Details</h2>
        </div>
        {canEdit && !editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1 text-xs text-sand-50/40 hover:text-turq-400 transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
        )}
        {canEdit && editing && (
          <button
            type="button"
            onClick={() => { setEditing(false); setError(null); }}
            className="inline-flex items-center gap-1 text-xs text-sand-50/40 hover:text-red-400 transition-colors"
          >
            <X className="h-3.5 w-3.5" /> Cancel
          </button>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-400 bg-red-900/20 border border-red-500/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* ── View mode ── */}
      {!editing && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            {data.email && (
              <InfoRow icon={<Mail className="h-3.5 w-3.5" />} label="Email" value={data.email} />
            )}
            <div>
              <p className="text-[10px] uppercase tracking-wider text-sand-50/35 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" /> Phone Numbers
                </span>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => setShowAddPhone((v) => !v)}
                    className="text-[11px] text-turq-400 hover:text-turq-300 normal-case"
                  >
                    + Add number
                  </button>
                )}
              </p>
              {allContacts.length === 0 ? (
                <p className="text-sm text-sand-50/40">—</p>
              ) : (
                <div className="space-y-1">
                  {allContacts.map((c, i) => (
                    <div key={c} className="flex items-center justify-between text-sm text-sand-50/75">
                      <span>
                        {c}
                        {i === 0 && <span className="text-[10px] text-turq-400/80 ml-2">(primary)</span>}
                      </span>
                      {canEdit && allContacts.length > 1 && (
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => handleRemoveContactNumber(c)}
                          className="text-sand-50/30 hover:text-red-400 p-0.5"
                          title="Remove number"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {showAddPhone && (
                <form onSubmit={handleAddContactNumber} className="flex gap-2 mt-2">
                  <input
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="e.g. 0801 234 5678"
                    type="tel"
                    className="dash-input flex-1 text-xs"
                    required
                  />
                  <button
                    type="submit"
                    disabled={pending || !newPhone.trim()}
                    className="px-2.5 py-1 text-xs bg-turq-600 text-ink-950 font-semibold rounded hover:bg-turq-500"
                  >
                    Add
                  </button>
                </form>
              )}
            </div>

            <InfoRow
              icon={<MapPin className="h-3.5 w-3.5" />}
              label="Address"
              value={[data.street, data.city].filter(Boolean).join(", ") || "—"}
            />
            {data.occupation && <InfoRow label="Occupation" value={data.occupation} />}
            {data.referralSource && <InfoRow label="Referred via" value={data.referralSource} />}
            {data.emergencyContactName && (
              <InfoRow
                label="Emergency Contact"
                value={`${data.emergencyContactName}${data.emergencyContactPhone ? ` · ${data.emergencyContactPhone}` : ""}`}
              />
            )}
          </div>

          {/* Chronic diseases */}
          <div className="pt-3 border-t border-sand-50/8">
            <p className="text-[10px] uppercase tracking-wider text-sand-50/35 mb-2 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> Chronic Conditions
            </p>
            {data.diseases.length === 0 ? (
              <p className="text-xs text-sand-50/30">None recorded</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {data.diseases.map((d) => (
                  <span key={d} className="text-xs bg-amber-900/25 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded-full">
                    {d}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Current medications */}
          <div className="pt-3 border-t border-sand-50/8">
            <p className="text-[10px] uppercase tracking-wider text-sand-50/35 mb-2 flex items-center gap-1">
              <Pill className="h-3 w-3" /> Current Medications
            </p>
            {data.currentMedications.length === 0 ? (
              <p className="text-xs text-sand-50/30">None recorded</p>
            ) : (
              <ul className="space-y-1">
                {data.currentMedications.map((m) => (
                  <li key={m.medicationId} className="text-xs text-sand-50/70">
                    <span className="text-sand-50">{m.name}</span>
                    {m.dose ? <span className="text-sand-50/40"> · {m.dose}</span> : null}
                    {m.notes ? <span className="text-sand-50/30"> — {m.notes}</span> : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* ── Edit mode ── */}
      {editing && (
        <div className="space-y-5">
          <form onSubmit={handleDemographicsSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-sand-50/40 mb-1">First Name</label>
                <input name="firstName" defaultValue={data.firstName} required className="dash-input" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-sand-50/40 mb-1">Last Name</label>
                <input name="lastName" defaultValue={data.lastName} required className="dash-input" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-sand-50/40 mb-1">Email Address</label>
              <input name="email" defaultValue={data.email ?? ""} type="email" className="dash-input" />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-sand-50/40 mb-1">Primary Phone</label>
              <input name="phone" defaultValue={data.phone} type="tel" className="dash-input" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-sand-50/40 mb-1">Street / Area</label>
                <input name="street" defaultValue={data.street} className="dash-input" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-sand-50/40 mb-1">City</label>
                <input name="city" defaultValue={data.city} className="dash-input" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-sand-50/40 mb-1">Occupation</label>
              <input name="occupation" defaultValue={data.occupation} maxLength={80} className="dash-input" />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-sand-50/40 mb-1">How did they find us?</label>
              <select name="referralSource" defaultValue={data.referralSource} className="dash-input">
                <option value="">Select…</option>
                {REFERRAL_OPTIONS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-sand-50/40 mb-1">Emergency Contact Name</label>
                <input name="emergencyContactName" defaultValue={data.emergencyContactName} maxLength={80} className="dash-input" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-sand-50/40 mb-1">Emergency Contact Phone</label>
                <input name="emergencyContactPhone" defaultValue={data.emergencyContactPhone} type="tel" maxLength={20} className="dash-input" />
              </div>
            </div>
            <button
              type="submit"
              disabled={pending}
              className="w-full inline-flex items-center justify-center gap-2 bg-turq-600 hover:bg-turq-500 text-ink-950 py-2 px-4 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              {pending ? "Saving…" : "Save Changes"}
            </button>
          </form>

          {/* Chronic diseases — edit inline */}
          <div className="pt-4 border-t border-sand-50/10 space-y-3">
            <p className="text-[10px] uppercase tracking-wider text-sand-50/35 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> Chronic Conditions
            </p>
            <div className="flex flex-wrap gap-1.5">
              {data.diseases.map((d) => (
                <span key={d} className="inline-flex items-center gap-1 text-xs bg-amber-900/25 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded-full">
                  {d}
                  <button type="button" disabled={pending} onClick={() => handleRemoveDisease(d)} className="hover:text-red-400 transition-colors">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <form onSubmit={handleAddDisease} className="flex gap-2">
              <input
                value={newDisease}
                onChange={(e) => setNewDisease(e.target.value)}
                maxLength={50}
                placeholder="e.g. Hypertension, Diabetes"
                className="dash-input flex-1 text-xs"
              />
              <button
                type="submit"
                disabled={pending || !newDisease.trim()}
                className="inline-flex items-center gap-1 text-xs bg-sand-50/10 hover:bg-sand-50/15 text-sand-50 px-3 py-2 rounded-lg transition-colors disabled:opacity-40"
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </button>
            </form>
          </div>

          {/* Current medications — edit inline */}
          <div className="pt-4 border-t border-sand-50/10 space-y-3">
            <p className="text-[10px] uppercase tracking-wider text-sand-50/35 flex items-center gap-1">
              <Pill className="h-3 w-3" /> Current Medications
            </p>
            <ul className="space-y-1.5">
              {data.currentMedications.map((m) => (
                <li key={m.medicationId} className="flex items-center justify-between gap-2 text-xs text-sand-50/70">
                  <span>
                    <span className="text-sand-50">{m.name}</span>
                    {m.dose ? <span className="text-sand-50/40"> · {m.dose}</span> : null}
                  </span>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => handleRemoveMedication(m.medicationId)}
                    className="text-sand-50/30 hover:text-red-400 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
            <form onSubmit={handleAddMedication} className="flex gap-2">
              <input
                value={newMedName}
                onChange={(e) => setNewMedName(e.target.value)}
                maxLength={100}
                placeholder="Drug name"
                className="dash-input flex-1 text-xs"
              />
              <input
                value={newMedDose}
                onChange={(e) => setNewMedDose(e.target.value)}
                maxLength={60}
                placeholder="Dose"
                className="dash-input w-24 text-xs"
              />
              <button
                type="submit"
                disabled={pending || !newMedName.trim()}
                className="inline-flex items-center gap-1 text-xs bg-sand-50/10 hover:bg-sand-50/15 text-sand-50 px-3 py-2 rounded-lg transition-colors disabled:opacity-40"
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-sand-50/35 mb-0.5 flex items-center gap-1">
        {icon}
        {label}
      </p>
      <p className="text-sm text-sand-50/75">{value}</p>
    </div>
  );
}
