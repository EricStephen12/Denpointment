"use client";

import React, { useState, useTransition } from "react";
import {
  Users,
  ShieldCheck,
  Stethoscope,
  Headset,
  User,
  Plus,
  Search,
  Check,
  AlertCircle,
  KeyRound,
  DoorOpen,
  UserCheck,
  UserX,
  Sparkles,
} from "lucide-react";
import {
  assignOrPromoteMember,
  toggleMemberRole,
  updateDentistRoom,
  revokeStaffRoles,
  removeStaffMember,
} from "@/app/actions/admin";

export type MemberItem = {
  personId: number;
  firstName: string;
  lastName: string;
  email: string;
  gender: string;
  hasPassword: boolean;
  isAdmin: boolean;
  isDentist: boolean;
  dentistRoom: string | null;
  isReceptionist: boolean;
  isPatient: boolean;
};

export default function StaffRoleManager({
  members,
  currentAdminId,
}: {
  members: MemberItem[];
  currentAdminId: number;
}) {
  const [activeTab, setActiveTab] = useState<"staff" | "all">("staff");
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  // New role promotion form state
  const [promoteEmail, setPromoteEmail] = useState("");
  const [promoteRole, setPromoteRole] = useState<"admin" | "dentist" | "receptionist">("admin");
  const [promoteRoom, setPromoteRoom] = useState("1");
  const [promoteFirstName, setPromoteFirstName] = useState("");
  const [promoteLastName, setPromoteLastName] = useState("");
  const [promoteGender, setPromoteGender] = useState<"male" | "female">("female");
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Edit room modal / state
  const [editingRoomPersonId, setEditingRoomPersonId] = useState<number | null>(null);
  const [editingRoomValue, setEditingRoomValue] = useState("");

  const staffMembers = members.filter((m) => m.isAdmin || m.isDentist || m.isReceptionist);
  const displayedList = (activeTab === "staff" ? staffMembers : members).filter((m) => {
    const q = searchQuery.toLowerCase();
    return (
      m.firstName.toLowerCase().includes(q) ||
      m.lastName.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q)
    );
  });

  function handlePromoteSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatusMessage(null);

    const formData = new FormData();
    formData.set("email", promoteEmail);
    formData.set("role", promoteRole);
    if (promoteRole === "dentist") formData.set("roomNumber", promoteRoom);
    if (promoteFirstName) formData.set("firstName", promoteFirstName);
    if (promoteLastName) formData.set("lastName", promoteLastName);
    formData.set("gender", promoteGender);

    startTransition(async () => {
      const res = await assignOrPromoteMember(formData);
      if (res?.error) {
        setStatusMessage({ type: "error", text: res.error });
      } else {
        setStatusMessage({
          type: "success",
          text: res?.message || "Role updated successfully.",
        });
        setPromoteEmail("");
        setPromoteFirstName("");
        setPromoteLastName("");
      }
    });
  }

  function handleToggleRole(personId: number, role: "admin" | "dentist" | "receptionist", currentEnabled: boolean) {
    setStatusMessage(null);
    const formData = new FormData();
    formData.set("personId", String(personId));
    formData.set("role", role);
    formData.set("enabled", currentEnabled ? "false" : "true");
    formData.set("roomNumber", "1");

    startTransition(async () => {
      const res = await toggleMemberRole(formData);
      if (res?.error) {
        setStatusMessage({ type: "error", text: res.error });
      }
    });
  }

  function handleSaveRoom(personId: number) {
    if (!editingRoomValue) return;
    setStatusMessage(null);
    const formData = new FormData();
    formData.set("personId", String(personId));
    formData.set("roomNumber", editingRoomValue);

    startTransition(async () => {
      const res = await updateDentistRoom(formData);
      if (res?.error) {
        setStatusMessage({ type: "error", text: res.error });
      } else {
        setEditingRoomPersonId(null);
      }
    });
  }

  function handleRevokeStaff(personId: number) {
    if (!confirm("Revoke all staff privileges from this member? They will revert to a standard patient account.")) return;
    setStatusMessage(null);
    const formData = new FormData();
    formData.set("personId", String(personId));

    startTransition(async () => {
      const res = await revokeStaffRoles(formData);
      if (res?.error) {
        setStatusMessage({ type: "error", text: res.error });
      }
    });
  }

  function quickSelectMemberForRole(member: MemberItem, role: "admin" | "dentist" | "receptionist") {
    setPromoteEmail(member.email);
    setPromoteFirstName(member.firstName);
    setPromoteLastName(member.lastName);
    setPromoteRole(role);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="space-y-8">
      {/* Toast Alert */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
            statusMessage.type === "success"
              ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-300"
              : "bg-red-950/40 border-red-500/30 text-red-300"
          }`}
        >
          {statusMessage.type === "success" ? (
            <Check className="h-5 w-5 mt-0.5 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 mt-0.5 text-red-400 flex-shrink-0" />
          )}
          <div className="flex-1 text-sm font-medium">{statusMessage.text}</div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs opacity-70 hover:opacity-100 uppercase tracking-wider"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top Banner: Assign & Promote Member Card */}
      <div className="dash-surface p-6 rounded-2xl border border-sand-50/10 bg-gradient-to-br from-ink-900/90 to-ink-950/90 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-turq-600/20 text-turq-400 border border-turq-500/30">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-sand-50">Assign or Promote Member Roles</h2>
            <p className="text-xs text-sand-50/50 mt-0.5">
              Instantly promote any registered patient to Admin, Dentist, or Receptionist — or invite new clinic staff.
            </p>
          </div>
        </div>

        <form onSubmit={handlePromoteSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-sand-50/70 mb-1.5">
                Member Email <span className="text-turq-400">*</span>
              </label>
              <input
                type="email"
                required
                value={promoteEmail}
                onChange={(e) => setPromoteEmail(e.target.value)}
                placeholder="patient@example.com or new staff"
                className="dash-input w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-sand-50/70 mb-1.5">
                Assign Role <span className="text-turq-400">*</span>
              </label>
              <select
                value={promoteRole}
                onChange={(e) => setPromoteRole(e.target.value as any)}
                className="dash-input w-full font-medium"
              >
                <option value="admin">Administrator (Full clinic permissions)</option>
                <option value="dentist">Dentist (Treatments & Appointments)</option>
                <option value="receptionist">Receptionist (Booking & Check-in)</option>
              </select>
            </div>

            {promoteRole === "dentist" ? (
              <div>
                <label className="block text-xs font-medium text-sand-50/70 mb-1.5">
                  Consultation Room <span className="text-turq-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={promoteRoom}
                  onChange={(e) => setPromoteRoom(e.target.value)}
                  placeholder="e.g. Room 1 or A2"
                  className="dash-input w-full"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-sand-50/40 mb-1.5">
                  First Name (only needed if not registered)
                </label>
                <input
                  type="text"
                  value={promoteFirstName}
                  onChange={(e) => setPromoteFirstName(e.target.value)}
                  placeholder="Optional for existing members"
                  className="dash-input w-full"
                />
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-sand-50/5">
            <p className="text-xs text-sand-50/40">
              Existing users will be promoted immediately. New members can sign up with their email to activate.
            </p>
            <button
              type="submit"
              disabled={isPending}
              className="bg-turq-600 hover:bg-turq-500 text-ink-950 px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-lg shadow-turq-600/20 inline-flex items-center gap-2 disabled:opacity-50"
            >
              <UserCheck className="h-4 w-4" />
              {isPending ? "Assigning..." : "Assign / Promote Role"}
            </button>
          </div>
        </form>
      </div>

      {/* Main Table Card */}
      <div className="dash-surface rounded-2xl border border-sand-50/10 overflow-hidden shadow-xl">
        {/* Header & Controls */}
        <div className="p-5 border-b border-sand-50/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-ink-900/50">
          {/* Tabs */}
          <div className="flex items-center bg-black/30 p-1 rounded-xl border border-sand-50/10">
            <button
              type="button"
              onClick={() => setActiveTab("staff")}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "staff"
                  ? "bg-turq-600 text-ink-950 shadow-md"
                  : "text-sand-50/60 hover:text-sand-50"
              }`}
            >
              Clinic Staff ({staffMembers.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "all"
                  ? "bg-turq-600 text-ink-950 shadow-md"
                  : "text-sand-50/60 hover:text-sand-50"
              }`}
            >
              All Clinic Members ({members.length})
            </button>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-72">
            <Search className="h-4 w-4 text-sand-50/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="dash-input w-full pl-9 py-1.5 text-xs rounded-xl"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-sand-50/10 bg-black/20 text-[11px] font-semibold uppercase tracking-wider text-sand-50/50">
                <th className="py-3.5 px-6">Member</th>
                <th className="py-3.5 px-6">Active Roles</th>
                <th className="py-3.5 px-6">Direct Role Toggles</th>
                <th className="py-3.5 px-6">Account Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-50/5 text-sm">
              {displayedList.length > 0 ? (
                displayedList.map((m) => {
                  const isSelf = m.personId === currentAdminId;
                  const isStaff = m.isAdmin || m.isDentist || m.isReceptionist;

                  return (
                    <tr key={m.personId} className="hover:bg-sand-50/[0.02] transition-colors">
                      {/* Member info */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-turq-600/20 border border-turq-500/30 flex items-center justify-center font-bold text-xs text-turq-300">
                            {m.firstName.charAt(0).toUpperCase()}
                            {m.lastName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-sand-50 flex items-center gap-2">
                              {m.firstName} {m.lastName}
                              {isSelf && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-turq-600/30 text-turq-300 font-medium">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-sand-50/50 mt-0.5">{m.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Current Roles Badges */}
                      <td className="py-4 px-6">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {m.isAdmin && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-900/30 text-purple-300 border border-purple-500/30">
                              <ShieldCheck className="h-3 w-3" /> Admin
                            </span>
                          )}
                          {m.isDentist && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-turq-900/30 text-turq-300 border border-turq-500/30">
                              <Stethoscope className="h-3 w-3" /> Dentist ({m.dentistRoom || "Room 1"})
                            </span>
                          )}
                          {m.isReceptionist && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-900/30 text-blue-300 border border-blue-500/30">
                              <Headset className="h-3 w-3" /> Receptionist
                            </span>
                          )}
                          {!isStaff && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-sand-50/10 text-sand-50/60">
                              <User className="h-3 w-3" /> Patient
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Interactive Role Toggles */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          {/* Toggle Admin */}
                          <button
                            type="button"
                            disabled={isPending || isSelf}
                            onClick={() => handleToggleRole(m.personId, "admin", m.isAdmin)}
                            title={isSelf ? "You cannot remove your own Admin role" : m.isAdmin ? "Revoke Admin role" : "Grant Admin role"}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                              m.isAdmin
                                ? "bg-purple-900/40 border-purple-500/40 text-purple-200 hover:bg-purple-900/60"
                                : "bg-black/30 border-sand-50/10 text-sand-50/40 hover:text-purple-300 hover:border-purple-500/30"
                            } ${isSelf ? "cursor-not-allowed opacity-60" : ""}`}
                          >
                            Admin {m.isAdmin ? "✓" : "+"}
                          </button>

                          {/* Toggle Dentist */}
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleToggleRole(m.personId, "dentist", m.isDentist)}
                            title={m.isDentist ? "Revoke Dentist role" : "Grant Dentist role"}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                              m.isDentist
                                ? "bg-turq-900/40 border-turq-500/40 text-turq-200 hover:bg-turq-900/60"
                                : "bg-black/30 border-sand-50/10 text-sand-50/40 hover:text-turq-300 hover:border-turq-500/30"
                            }`}
                          >
                            Dentist {m.isDentist ? "✓" : "+"}
                          </button>

                          {/* Edit Dentist Room */}
                          {m.isDentist && (
                            editingRoomPersonId === m.personId ? (
                              <div className="inline-flex items-center gap-1 bg-black/60 p-1 rounded-lg border border-turq-500/40">
                                <input
                                  type="text"
                                  value={editingRoomValue}
                                  onChange={(e) => setEditingRoomValue(e.target.value)}
                                  className="w-14 px-1.5 py-0.5 text-xs bg-transparent text-sand-50 outline-none"
                                  placeholder="Room"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveRoom(m.personId)}
                                  className="px-1.5 py-0.5 bg-turq-600 text-ink-950 rounded text-[10px] font-bold"
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingRoomPersonId(null)}
                                  className="px-1 text-[10px] text-sand-50/40"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingRoomPersonId(m.personId);
                                  setEditingRoomValue(m.dentistRoom || "1");
                                }}
                                className="text-[11px] text-sand-50/40 hover:text-turq-300 underline"
                                title="Change room"
                              >
                                Edit Room
                              </button>
                            )
                          )}

                          {/* Toggle Receptionist */}
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleToggleRole(m.personId, "receptionist", m.isReceptionist)}
                            title={m.isReceptionist ? "Revoke Receptionist role" : "Grant Receptionist role"}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                              m.isReceptionist
                                ? "bg-blue-900/40 border-blue-500/40 text-blue-200 hover:bg-blue-900/60"
                                : "bg-black/30 border-sand-50/10 text-sand-50/40 hover:text-blue-300 hover:border-blue-500/30"
                            }`}
                          >
                            Receptionist {m.isReceptionist ? "✓" : "+"}
                          </button>
                        </div>
                      </td>

                      {/* Account Status */}
                      <td className="py-4 px-6">
                        {m.hasPassword ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-400" title="Can complete sign-up with their email to activate">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Pending sign-up
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isStaff && !isSelf && (
                            <button
                              type="button"
                              onClick={() => handleRevokeStaff(m.personId)}
                              disabled={isPending}
                              className="text-xs text-amber-400 hover:text-amber-300 font-medium px-2 py-1 rounded hover:bg-amber-950/30 transition-colors"
                              title="Revoke staff privileges (reverts to patient)"
                            >
                              Revoke Staff
                            </button>
                          )}
                          {!isStaff && (
                            <button
                              type="button"
                              onClick={() => quickSelectMemberForRole(m, "admin")}
                              className="text-xs text-turq-400 hover:text-turq-300 font-medium px-2 py-1 rounded hover:bg-turq-950/30 transition-colors"
                            >
                              + Make Admin
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-sand-50/40">
                    No members match your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
