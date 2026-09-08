"use client";

import React, { useState, useTransition, useEffect } from "react";
import {
  Users,
  UserPlus,
  ShieldCheck,
  Stethoscope,
  Headset,
  User,
  Plus,
  Search,
  Check,
  AlertCircle,
  X,
  DoorOpen,
  Settings2,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  SlidersHorizontal,
} from "lucide-react";
import {
  assignOrPromoteMember,
  toggleMemberRole,
  updateDentistRoom,
  revokeStaffRoles,
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
  members: initialMembers,
  currentAdminId,
}: {
  members: MemberItem[];
  currentAdminId: number;
}) {
  const [membersList, setMembersList] = useState<MemberItem[]>(initialMembers);
  const [activeTab, setActiveTab] = useState<"all" | "staff" | "patients">("staff");
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  // Keep local state in sync when server revalidates props
  useEffect(() => {
    setMembersList(initialMembers);
  }, [initialMembers]);

  // Status notification toast
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Add / Invite Member Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "dentist" | "receptionist">("dentist");
  const [newRoom, setNewRoom] = useState("1");
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newGender, setNewGender] = useState<"female" | "male">("female");

  // Manage Roles Modal State
  const [managingPersonId, setManagingPersonId] = useState<number | null>(null);
  const [editingRoomValue, setEditingRoomValue] = useState("");
  const [isSavingRoom, setIsSavingRoom] = useState(false);

  // Active member being managed in modal
  const managingMember = membersList.find((m) => m.personId === managingPersonId) || null;

  // Counts
  const staffCount = membersList.filter((m) => m.isAdmin || m.isDentist || m.isReceptionist).length;
  const patientsCount = membersList.filter((m) => !m.isAdmin && !m.isDentist && !m.isReceptionist).length;
  const dentistsCount = membersList.filter((m) => m.isDentist).length;

  // Filtered members
  const filteredList = membersList.filter((m) => {
    const isStaff = m.isAdmin || m.isDentist || m.isReceptionist;
    if (activeTab === "staff" && !isStaff) return false;
    if (activeTab === "patients" && isStaff) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      m.firstName.toLowerCase().includes(q) ||
      m.lastName.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q)
    );
  });

  // Handle Add / Promote Member Form
  function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    setStatusMessage(null);

    const formData = new FormData();
    formData.set("email", newEmail);
    formData.set("role", newRole);
    if (newRole === "dentist") formData.set("roomNumber", newRoom);
    if (newFirstName.trim()) formData.set("firstName", newFirstName.trim());
    if (newLastName.trim()) formData.set("lastName", newLastName.trim());
    formData.set("gender", newGender);

    startTransition(async () => {
      const res = await assignOrPromoteMember(formData);
      if (res?.error) {
        setStatusMessage({ type: "error", text: res.error });
      } else {
        setStatusMessage({
          type: "success",
          text: res?.message || "Role updated successfully.",
        });
        setIsAddModalOpen(false);
        setNewEmail("");
        setNewFirstName("");
        setNewLastName("");
      }
    });
  }

  // Handle In-Modal Role Toggle
  function handleToggleRole(personId: number, role: "admin" | "dentist" | "receptionist", currentEnabled: boolean) {
    setStatusMessage(null);

    // Optimistically update local list
    setMembersList((prev) =>
      prev.map((m) => {
        if (m.personId !== personId) return m;
        if (role === "admin") return { ...m, isAdmin: !currentEnabled };
        if (role === "dentist") return { ...m, isDentist: !currentEnabled, dentistRoom: !currentEnabled ? (m.dentistRoom || "1") : null };
        if (role === "receptionist") return { ...m, isReceptionist: !currentEnabled };
        return m;
      })
    );

    const formData = new FormData();
    formData.set("personId", String(personId));
    formData.set("role", role);
    formData.set("enabled", currentEnabled ? "false" : "true");
    formData.set("roomNumber", editingRoomValue || "1");

    startTransition(async () => {
      const res = await toggleMemberRole(formData);
      if (res?.error) {
        setStatusMessage({ type: "error", text: res.error });
      }
    });
  }

  // Handle In-Modal Save Dentist Room
  function handleSaveRoom(personId: number) {
    if (!editingRoomValue.trim()) return;
    setIsSavingRoom(true);
    setStatusMessage(null);

    // Optimistically update
    setMembersList((prev) =>
      prev.map((m) => (m.personId === personId ? { ...m, dentistRoom: editingRoomValue.trim() } : m))
    );

    const formData = new FormData();
    formData.set("personId", String(personId));
    formData.set("roomNumber", editingRoomValue.trim());

    startTransition(async () => {
      const res = await updateDentistRoom(formData);
      setIsSavingRoom(false);
      if (res?.error) {
        setStatusMessage({ type: "error", text: res.error });
      } else {
        setStatusMessage({ type: "success", text: "Consultation room updated." });
      }
    });
  }

  // Handle Revoke All Staff Privileges
  function handleRevokeAll(personId: number) {
    if (!confirm("Revoke all staff privileges from this member? They will retain regular patient account access.")) {
      return;
    }

    setStatusMessage(null);

    // Optimistically update
    setMembersList((prev) =>
      prev.map((m) =>
        m.personId === personId
          ? { ...m, isAdmin: false, isDentist: false, isReceptionist: false, dentistRoom: null }
          : m
      )
    );

    const formData = new FormData();
    formData.set("personId", String(personId));

    startTransition(async () => {
      const res = await revokeStaffRoles(formData);
      if (res?.error) {
        setStatusMessage({ type: "error", text: res.error });
      } else {
        setStatusMessage({ type: "success", text: "Staff privileges revoked successfully." });
        setManagingPersonId(null);
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-sm transition-all ${
            statusMessage.type === "success"
              ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-300"
              : "bg-red-950/40 border-red-500/30 text-red-300"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {statusMessage.type === "success" ? (
              <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs opacity-70 hover:opacity-100 uppercase tracking-wider font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top Header & Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold font-display text-sand-50 tracking-tight">
            Staff & Permissions
          </h1>
          <p className="text-xs text-sand-50/50 mt-1">
            Manage practice providers, assign consultation rooms, and configure role-based access.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setNewEmail("");
            setNewFirstName("");
            setNewLastName("");
            setNewRole("dentist");
            setNewRoom("1");
            setIsAddModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 bg-turq-500 hover:bg-turq-400 text-ink-950 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-turq-500/10 hover:shadow-turq-500/20 active:scale-[0.98]"
        >
          <UserPlus className="h-4 w-4" />
          <span>Add or Promote Member</span>
        </button>
      </div>

      {/* Overview Stat Badges */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-sand-50/[0.02] border border-sand-50/10">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-sand-50/40">
            Clinic Staff
          </div>
          <div className="text-2xl font-bold text-sand-50 mt-1 font-display">
            {staffCount}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-sand-50/[0.02] border border-sand-50/10">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-sand-50/40">
            Active Providers
          </div>
          <div className="text-2xl font-bold text-turq-400 mt-1 font-display">
            {dentistsCount}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-sand-50/[0.02] border border-sand-50/10">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-sand-50/40">
            Total Members
          </div>
          <div className="text-2xl font-bold text-sand-50/80 mt-1 font-display">
            {membersList.length}
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="dash-surface rounded-2xl border border-sand-50/10 overflow-hidden shadow-xl">
        {/* Table Filters & Search */}
        <div className="p-4 sm:p-5 border-b border-sand-50/10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-black/20">
          {/* Segmented Filter Tabs */}
          <div className="inline-flex p-1 rounded-xl bg-black/40 border border-sand-50/10">
            <button
              type="button"
              onClick={() => setActiveTab("staff")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "staff"
                  ? "bg-white/[0.09] text-white shadow-sm font-semibold"
                  : "text-sand-50/50 hover:text-sand-50"
              }`}
            >
              Staff Only ({staffCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "all"
                  ? "bg-white/[0.09] text-white shadow-sm font-semibold"
                  : "text-sand-50/50 hover:text-sand-50"
              }`}
            >
              All Members ({membersList.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("patients")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "patients"
                  ? "bg-white/[0.09] text-white shadow-sm font-semibold"
                  : "text-sand-50/50 hover:text-sand-50"
              }`}
            >
              Patients ({patientsCount})
            </button>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <Search className="h-4 w-4 text-sand-50/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search member by name or email..."
              className="dash-input w-full pl-9 pr-8 py-2 text-xs rounded-xl"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-sand-50/40 hover:text-sand-50"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Members Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-sand-50/10 bg-black/15 text-[11px] font-semibold uppercase tracking-wider text-sand-50/45">
                <th className="py-3 px-6">Member</th>
                <th className="py-3 px-6">Role(s)</th>
                <th className="py-3 px-6">Operatory / Room</th>
                <th className="py-3 px-6">Account Status</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-50/5 text-sm">
              {filteredList.length > 0 ? (
                filteredList.map((m) => {
                  const isSelf = m.personId === currentAdminId;
                  const isStaff = m.isAdmin || m.isDentist || m.isReceptionist;
                  const initials = `${m.firstName?.[0] || ""}${m.lastName?.[0] || ""}`.toUpperCase();

                  return (
                    <tr
                      key={m.personId}
                      className="hover:bg-sand-50/[0.02] transition-colors group"
                    >
                      {/* Member Info */}
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-turq-500/10 border border-turq-500/20 text-turq-300 flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {initials || "U"}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-sand-50 flex items-center gap-2">
                              <span className="truncate">
                                {m.firstName} {m.lastName}
                              </span>
                              {isSelf && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-turq-500/15 text-turq-300 font-semibold border border-turq-500/20">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-sand-50/45 truncate mt-0.5">
                              {m.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role Badges */}
                      <td className="py-3.5 px-6">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {m.isAdmin && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-purple-500/10 text-purple-300 border border-purple-500/20">
                              <ShieldCheck className="h-3 w-3" /> Admin
                            </span>
                          )}
                          {m.isDentist && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-turq-500/10 text-turq-300 border border-turq-500/20">
                              <Stethoscope className="h-3 w-3" /> Dentist
                            </span>
                          )}
                          {m.isReceptionist && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20">
                              <Headset className="h-3 w-3" /> Receptionist
                            </span>
                          )}
                          {!isStaff && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-sand-50/5 text-sand-50/40 border border-sand-50/10">
                              <User className="h-3 w-3" /> Patient
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Operatory / Room */}
                      <td className="py-3.5 px-6 text-xs text-sand-50/60">
                        {m.isDentist ? (
                          <span className="inline-flex items-center gap-1.5 font-medium text-sand-50/80">
                            <DoorOpen className="h-3.5 w-3.5 text-turq-400/80" />
                            Room {m.dentistRoom || "1"}
                          </span>
                        ) : (
                          <span className="text-sand-50/20">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-6">
                        {m.hasPassword ? (
                          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs text-amber-400/90 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            Invited
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-6 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setManagingPersonId(m.personId);
                            setEditingRoomValue(m.dentistRoom || "1");
                          }}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            isStaff
                              ? "bg-white/[0.06] hover:bg-white/[0.12] text-sand-50 border border-sand-50/10"
                              : "bg-turq-500/10 hover:bg-turq-500/20 text-turq-300 border border-turq-500/20"
                          }`}
                        >
                          <Settings2 className="h-3.5 w-3.5 opacity-70" />
                          <span>{isStaff ? "Manage Roles" : "Promote to Staff"}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs text-sand-50/40">
                    No members match your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL 1: ADD / PROMOTE MEMBER MODAL ── */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-ink-900 border border-sand-50/15 rounded-2xl shadow-2xl p-6 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-sand-50/10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-turq-500/10 text-turq-400 border border-turq-500/20">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-sand-50 font-display">
                    Add or Promote Team Member
                  </h2>
                  <p className="text-xs text-sand-50/50 mt-0.5">
                    Grant administrative, provider, or receptionist privileges.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-sand-50/40 hover:text-sand-50 hover:bg-sand-50/10 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddMember} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-medium text-sand-50/70 mb-1.5">
                  Email Address <span className="text-turq-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  autoFocus
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="name@glowdental.com or registered patient email"
                  className="dash-input w-full"
                />
                <p className="text-[11px] text-sand-50/40 mt-1">
                  If this email already belongs to a registered patient, their permissions are upgraded instantly.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-sand-50/70 mb-1.5">
                  Assign Clinic Role <span className="text-turq-400">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewRole("dentist")}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      newRole === "dentist"
                        ? "bg-turq-500/15 border-turq-500/40 text-turq-300"
                        : "bg-black/30 border-sand-50/10 text-sand-50/60 hover:text-sand-50 hover:bg-sand-50/5"
                    }`}
                  >
                    <Stethoscope className="h-4 w-4 mb-1.5 text-turq-400" />
                    <div className="text-xs font-semibold">Dentist</div>
                    <div className="text-[10px] opacity-70 mt-0.5 leading-tight">Clinical chart &amp; care</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewRole("admin")}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      newRole === "admin"
                        ? "bg-purple-500/15 border-purple-500/40 text-purple-300"
                        : "bg-black/30 border-sand-50/10 text-sand-50/60 hover:text-sand-50 hover:bg-sand-50/5"
                    }`}
                  >
                    <ShieldCheck className="h-4 w-4 mb-1.5 text-purple-400" />
                    <div className="text-xs font-semibold">Admin</div>
                    <div className="text-[10px] opacity-70 mt-0.5 leading-tight">Full clinic operations</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewRole("receptionist")}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      newRole === "receptionist"
                        ? "bg-blue-500/15 border-blue-500/40 text-blue-300"
                        : "bg-black/30 border-sand-50/10 text-sand-50/60 hover:text-sand-50 hover:bg-sand-50/5"
                    }`}
                  >
                    <Headset className="h-4 w-4 mb-1.5 text-blue-400" />
                    <div className="text-xs font-semibold">Reception</div>
                    <div className="text-[10px] opacity-70 mt-0.5 leading-tight">Booking &amp; check-in</div>
                  </button>
                </div>
              </div>

              {newRole === "dentist" && (
                <div>
                  <label className="block text-xs font-medium text-sand-50/70 mb-1.5">
                    Consultation Room / Operatory <span className="text-turq-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newRoom}
                    onChange={(e) => setNewRoom(e.target.value)}
                    placeholder="e.g. Room 1, Operatory A"
                    className="dash-input w-full"
                  />
                </div>
              )}

              {/* Optional Name fields (only needed if user is completely new) */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-medium text-sand-50/50 mb-1">
                    First Name (if new account)
                  </label>
                  <input
                    type="text"
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    placeholder="First name"
                    className="dash-input w-full"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-sand-50/50 mb-1">
                    Last Name (if new account)
                  </label>
                  <input
                    type="text"
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    placeholder="Last name"
                    className="dash-input w-full"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-sand-50/10">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-sand-50/70 hover:text-sand-50 hover:bg-sand-50/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-turq-500 hover:bg-turq-400 text-ink-950 shadow-md shadow-turq-500/20 transition-all disabled:opacity-50"
                >
                  {isPending ? "Assigning..." : "Assign Permissions"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: MANAGE MEMBER ROLES DIALOG ── */}
      {managingMember && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setManagingPersonId(null)}
        >
          <div
            className="w-full max-w-lg bg-ink-900 border border-sand-50/15 rounded-2xl shadow-2xl p-6 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-sand-50/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-turq-500/10 border border-turq-500/20 text-turq-300 flex items-center justify-center font-bold text-sm">
                  {`${managingMember.firstName?.[0] || ""}${managingMember.lastName?.[0] || ""}`.toUpperCase()}
                </div>
                <div>
                  <h2 className="text-base font-semibold text-sand-50 font-display">
                    {managingMember.firstName} {managingMember.lastName}
                  </h2>
                  <p className="text-xs text-sand-50/50 mt-0.5">{managingMember.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setManagingPersonId(null)}
                className="p-1 rounded-lg text-sand-50/40 hover:text-sand-50 hover:bg-sand-50/10 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Role Switches */}
            <div className="py-5 space-y-4">
              {/* Administrator Toggle */}
              <div className="p-4 rounded-xl bg-black/30 border border-sand-50/10 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/15 text-purple-400 border border-purple-500/25 mt-0.5">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-sand-50">Administrator</div>
                    <p className="text-[11px] text-sand-50/50 mt-0.5">
                      Full access to practice settings, billing, marketing automations, and team permissions.
                    </p>
                    {managingMember.personId === currentAdminId && (
                      <p className="text-[10px] text-purple-300/80 mt-1 font-medium">
                        * You cannot revoke your own Administrator role.
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isPending || managingMember.personId === currentAdminId}
                  onClick={() =>
                    handleToggleRole(managingMember.personId, "admin", managingMember.isAdmin)
                  }
                  className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 disabled:opacity-50 ${
                    managingMember.isAdmin ? "bg-purple-600" : "bg-white/10"
                  }`}
                >
                  <span
                    className={`inline-block w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                      managingMember.isAdmin ? "right-1" : "left-1"
                    }`}
                  />
                </button>
              </div>

              {/* Dentist / Provider Toggle */}
              <div className="p-4 rounded-xl bg-black/30 border border-sand-50/10 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-turq-500/15 text-turq-400 border border-turq-500/25 mt-0.5">
                      <Stethoscope className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-sand-50">Dentist / Provider</div>
                      <p className="text-[11px] text-sand-50/50 mt-0.5">
                        Clinical treatment charts, appointment schedules, and patient medical notes.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() =>
                      handleToggleRole(managingMember.personId, "dentist", managingMember.isDentist)
                    }
                    className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${
                      managingMember.isDentist ? "bg-turq-600" : "bg-white/10"
                    }`}
                  >
                    <span
                      className={`inline-block w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                        managingMember.isDentist ? "right-1" : "left-1"
                      }`}
                    />
                  </button>
                </div>

                {/* Dentist Room Editor */}
                {managingMember.isDentist && (
                  <div className="pt-2 border-t border-sand-50/5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <DoorOpen className="h-4 w-4 text-turq-400" />
                      <span className="text-xs text-sand-50/70">Assigned Room:</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editingRoomValue}
                        onChange={(e) => setEditingRoomValue(e.target.value)}
                        placeholder="Room 1"
                        className="dash-input w-24 py-1 text-xs"
                      />
                      <button
                        type="button"
                        disabled={isSavingRoom || !editingRoomValue.trim()}
                        onClick={() => handleSaveRoom(managingMember.personId)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-turq-500/20 hover:bg-turq-500/30 text-turq-300 border border-turq-500/30 transition-all disabled:opacity-50"
                      >
                        {isSavingRoom ? "..." : "Save"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Receptionist Toggle */}
              <div className="p-4 rounded-xl bg-black/30 border border-sand-50/10 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/25 mt-0.5">
                    <Headset className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-sand-50">Receptionist</div>
                    <p className="text-[11px] text-sand-50/50 mt-0.5">
                      Front-desk check-in, patient directory registry, and appointment booking.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isPending}
                  onClick={() =>
                    handleToggleRole(
                      managingMember.personId,
                      "receptionist",
                      managingMember.isReceptionist
                    )
                  }
                  className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${
                    managingMember.isReceptionist ? "bg-blue-600" : "bg-white/10"
                  }`}
                >
                  <span
                    className={`inline-block w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                      managingMember.isReceptionist ? "right-1" : "left-1"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Danger / Revoke Action & Done Button */}
            <div className="flex items-center justify-between gap-3 pt-4 border-t border-sand-50/10">
              {(managingMember.isAdmin ||
                managingMember.isDentist ||
                managingMember.isReceptionist) &&
              managingMember.personId !== currentAdminId ? (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleRevokeAll(managingMember.personId)}
                  className="text-xs text-red-400 hover:text-red-300 font-medium px-2.5 py-1.5 rounded-lg hover:bg-red-950/20 transition-colors"
                >
                  Revoke Staff Privileges
                </button>
              ) : (
                <div />
              )}

              <button
                type="button"
                onClick={() => setManagingPersonId(null)}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-sand-50/10 hover:bg-sand-50/15 text-sand-50 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
