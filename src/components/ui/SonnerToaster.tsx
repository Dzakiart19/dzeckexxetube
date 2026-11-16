"use client";

import { Toaster as Sonner } from "sonner";

/**
 * App-wide toast host. Notifications are used sparingly for transient
 * feedback; persistent states (errors, empty) use dedicated components.
 */
export function Toaster() {
  return (
    <Sonner
      theme="dark"
      position="top-center"
      duration={3500}
      toastOptions={{
        classNames: {
          toast: "!bg-popover !border-border !text-foreground !rounded-lg !shadow-lg",
          description: "!text-muted-foreground",
        },
      }}
    />
  );
}

export { toast } from "sonner";
