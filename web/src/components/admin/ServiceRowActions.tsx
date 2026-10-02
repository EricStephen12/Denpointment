"use client";

import React, { useState, useTransition } from "react";
import { Pencil, Trash2, Loader2 } from "lucide-react";
import { toggleServiceActive, updateService, deleteService } from "@/app/actions/settings";

interface ServiceRowActionsProps {
  service: {
    serviceId: number;
    name: string;
    price: number;
    active: boolean;
  };
}

export default function ServiceRowActions({ service }: ServiceRowActionsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(service.name);
  const [editPrice, setEditPrice] = useState(service.price);
  const [isPending, startTransition] = useTransition();
  const [actionType, setActionType] = useState<"toggle" | "delete" | "edit" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleToggle = () => {
    const formData = new FormData();
    formData.append("serviceId", String(service.serviceId));
    formData.append("active", String(service.active));
    setActionType("toggle");
    startTransition(async () => {
      try {
        await toggleServiceActive(formData);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to update status";
        setErrorMessage(msg);
      } finally {
        setActionType(null);
      }
    });
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("serviceId", String(service.serviceId));
    formData.append("name", editName);
    formData.append("price", String(editPrice));
    setActionType("edit");
    startTransition(async () => {
      try {
        setErrorMessage(null);
        await updateService(formData);
        setIsEditing(false);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to update service";
        setErrorMessage(msg);
      } finally {
        setActionType(null);
      }
    });
  };

  const handleDelete = () => {
    if (!confirm(`Delete "${service.name}"? This will fail if the service is linked to any treatment records.`)) {
      return;
    }
    const formData = new FormData();
    formData.append("serviceId", String(service.serviceId));
    setActionType("delete");
    startTransition(async () => {
      try {
        setErrorMessage(null);
        await deleteService(formData);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Cannot delete service that is in use.";
        alert(msg);
      } finally {
        setActionType(null);
      }
    });
  };

  return (
    <div className="flex items-center justify-end gap-3 relative">
      {/* Toggle active */}
      <button
        type="button"
        disabled={isPending}
        onClick={handleToggle}
        className="text-xs text-sand-50/50 hover:text-turq-400 font-medium transition-colors disabled:opacity-50 cursor-pointer inline-flex items-center gap-1"
      >
        {actionType === "toggle" && isPending ? (
          <>
            <Loader2 className="h-3 w-3 animate-spin text-turq-400" />
            <span>Updating...</span>
          </>
        ) : (
          service.active ? "Deactivate" : "Activate"
        )}
      </button>

      {/* Edit button */}
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          setIsEditing(!isEditing);
          setErrorMessage(null);
        }}
        className="text-xs text-turq-400 hover:text-turq-300 font-medium flex items-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
      >
        <Pencil className="h-3 w-3" /> Edit
      </button>

      {/* Delete button */}
      <button
        type="button"
        disabled={isPending}
        onClick={handleDelete}
        title={actionType === "delete" && isPending ? "Deleting service..." : `Delete ${service.name}`}
        className="text-xs text-red-400/70 hover:text-red-300 font-medium flex items-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
      >
        {actionType === "delete" && isPending ? (
          <Loader2 className="h-3 w-3 animate-spin text-red-400" />
        ) : (
          <Trash2 className="h-3 w-3" />
        )}
      </button>

      {/* Inline edit dropdown modal */}
      {isEditing && (
        <div className="absolute right-0 top-7 z-30 w-72 bg-ink-900 border border-sand-50/15 rounded-xl p-4 shadow-2xl text-left">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-sand-50/70 uppercase tracking-wider">Edit Service</p>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-sand-50/40 hover:text-sand-50 text-xs p-1"
            >
              ✕
            </button>
          </div>
          {errorMessage && (
            <p className="text-xs text-red-400 bg-red-950/40 border border-red-800/40 rounded p-1.5 mb-2.5">
              {errorMessage}
            </p>
          )}
          <form onSubmit={handleEdit} className="space-y-3">
            <div>
              <label className="block text-[10px] text-sand-50/40 mb-1">Name</label>
              <input
                type="text"
                required
                maxLength={100}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="dash-input w-full text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] text-sand-50/40 mb-1">Price (₦)</label>
              <input
                type="number"
                required
                min={0}
                value={editPrice}
                onChange={(e) => setEditPrice(parseInt(e.target.value, 10) || 0)}
                className="dash-input w-full text-xs"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 bg-turq-600 text-ink-950 py-1.5 rounded-lg text-xs font-semibold hover:bg-turq-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-1 cursor-pointer"
              >
                {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-sand-50/60 hover:bg-sand-50/10 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
