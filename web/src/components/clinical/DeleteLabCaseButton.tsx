"use client";

import { deleteLabCase } from "@/app/actions/clinical-care";
import { Trash2 } from "lucide-react";

export default function DeleteLabCaseButton({ labCaseId }: { labCaseId: number }) {
  return (
    <form
      action={deleteLabCase}
      onSubmit={(event) => {
        if (!window.confirm("Delete this lab case? This cannot be undone.")) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="labCaseId" value={labCaseId} />
      <button
        type="submit"
        aria-label="Delete lab case"
        title="Delete lab case"
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-500/20 text-red-300 hover:bg-red-500/10"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </form>
  );
}