"use client";

import React from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

interface SubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  pendingText?: string;
  icon?: React.ReactNode;
  spinnerSize?: string;
}

export default function SubmitButton({
  children,
  pendingText,
  icon,
  className = "",
  disabled,
  spinnerSize = "h-4 w-4",
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className={`inline-flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      {pending ? (
        <>
          <Loader2 className={`${spinnerSize} animate-spin shrink-0`} />
          <span>{pendingText || "Processing..."}</span>
        </>
      ) : (
        <>
          {icon}
          <span>{children}</span>
        </>
      )}
    </button>
  );
}
