"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      theme="light"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "!bg-surface !border !border-border !shadow-md !rounded-md !text-ink !font-sans",
          title: "!font-medium !text-ink",
          description: "!text-ink-soft",
          actionButton: "!bg-aubergine !text-on-aubergine",
          cancelButton: "!bg-cream-warm !text-ink-soft",
          success: "!border-success/30 !bg-success/5",
          error: "!border-error/30 !bg-error/5",
          warning: "!border-gold/30 !bg-gold-soft/40",
          info: "!border-aubergine/20 !bg-aubergine-50/50",
        },
      }}
    />
  );
}

export { toast } from "sonner";
