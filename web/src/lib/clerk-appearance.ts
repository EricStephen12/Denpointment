import type { SignIn } from "@clerk/nextjs";
import type { ComponentProps } from "react";

type ClerkAppearance = NonNullable<ComponentProps<typeof SignIn>["appearance"]>;

/** Dark auth UI — overrides the light ClerkProvider defaults used in the dashboard. */
export const clerkAuthAppearance: ClerkAppearance = {
  variables: {
    colorPrimary: "#248473",
    colorForeground: "#f8f6f1",
    colorMutedForeground: "rgba(248, 246, 241, 0.55)",
    colorBackground: "transparent",
    colorInput: "transparent",
    colorInputForeground: "#f8f6f1",
    colorNeutral: "#f8f6f1",
    colorDanger: "#f87171",
    borderRadius: "0",
    fontFamily: "var(--font-poppins), sans-serif",
  },
  elements: {
    rootBox: "w-full",
    cardBox: "bg-transparent shadow-none border-0 w-full !p-0",
    card: "bg-transparent shadow-none border-0 !p-0 w-full",
    main: "gap-4",
    headerTitle: "hidden",
    headerSubtitle: "hidden",
    socialButtons: "gap-3",
    socialButtonsBlockButton:
      "rounded-none border border-sand-50/20 bg-transparent text-sand-50 hover:bg-sand-50/5 shadow-none",
    socialButtonsBlockButtonText:
      "font-sans uppercase text-[10px] tracking-widest text-sand-50",
    socialButtonsProviderIcon: "brightness-0 invert",
    dividerLine: "bg-sand-50/10",
    dividerText: "text-sand-50/40 uppercase tracking-widest text-[10px]",
    formFieldLabel: "uppercase text-[10px] tracking-widest text-sand-50/60 font-sans",
    formFieldInput:
      "rounded-none border-sand-50/20 bg-transparent text-sand-50 placeholder:text-sand-50/30 focus:border-turq-400 focus:ring-0 transition-colors",
    formButtonPrimary:
      "rounded-none bg-sand-50 hover:bg-turq-400 transition-colors text-ink-950 font-sans uppercase text-xs tracking-widest py-4 shadow-none",
    footer: "bg-transparent !bg-none shadow-none border-0 mt-6",
    footerAction: "bg-transparent",
    footerActionText: "text-sand-50/60 font-sans text-xs",
    footerActionLink:
      "text-turq-400 hover:text-turq-300 font-sans uppercase tracking-widest text-[10px]",
    identityPreviewEditButtonIcon: "text-turq-400",
    formFieldInputShowPasswordButton: "text-sand-50/50 hover:text-sand-50",
    otpCodeFieldInput: "border-sand-50/20 text-sand-50 bg-transparent",
  },
};
