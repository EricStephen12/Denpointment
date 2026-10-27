"use client";

import React, { useTransition } from "react";
import { updateReferralStatus } from "@/app/actions/clinical-care";

export default function ReferralStatusSelect({
  referralId,
  status,
}: {
  referralId: number;
  status: string;
}) {
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextStatus = e.target.value;
    const form = e.target.form;
    if (!form) return;

    startTransition(() => {
      form.requestSubmit();
    });
  };

  return (
    <form action={updateReferralStatus}>
      <input type="hidden" name="referralId" value={referralId} />
      <label className="sr-only" htmlFor={`referral-status-${referralId}`}>
        Referral status
      </label>
      <select
        id={`referral-status-${referralId}`}
        name="status"
        defaultValue={status}
        onChange={handleChange}
        disabled={isPending}
        className="dash-input text-xs py-1.5 w-auto disabled:opacity-60 cursor-pointer"
      >
        <option value="pending">Pending</option>
        <option value="sent">Sent to Specialist</option>
        <option value="completed">Completed</option>
        <option value="cancelled">Cancelled</option>
      </select>
    </form>
  );
}
