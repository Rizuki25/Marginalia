"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"
import { useThemeMode } from "@/components/wild/theme"

const Toaster = ({ ...props }: ToasterProps) => {
  // Reads the same store as the toggle instead of a provider, so there is one
  // source of truth for the theme in the whole app.
  const mode = useThemeMode()

  return (
    <Sonner
      theme={mode}
      position="bottom-right"
      offset={{ bottom: 24, right: 24 }}
      mobileOffset={{ bottom: 84, left: 16, right: 16 }}
      gap={12}
      visibleToasts={3}
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--paper)",
          "--normal-text": "var(--ink)",
          "--normal-border": "var(--ink)",
          "--border-radius": "0px",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast w-full sm:w-auto",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
