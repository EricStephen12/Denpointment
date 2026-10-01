"use client";

import { deleteWaitlistEntry } from "@/app/actions/appointments";
import { Trash2 } from "lucide-react";

export default function DeleteWaitlistButton({ waitlistId }: { waitlistId: number }) {
  return (
    <form
      action={deleteWaitlistEntry}
      onSubmit={(event) => {
        if (!window.confirm("Permanently delete this waiting-list entry?")) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="waitlistId" value={waitlistId} />
      <button
        type="submit"
        aria-label="Delete waiting-list entry"
        title="Delete waiting-list entry"
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-500/20 text-red-300 hover:bg-red-500/10"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </form>
  );
}