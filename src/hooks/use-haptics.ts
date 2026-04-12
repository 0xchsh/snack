"use client"

import { useWebHaptics } from "web-haptics/react"

export function useHaptics(options?: { sound?: boolean }) {
  const { trigger, cancel, isSupported } = useWebHaptics({
    debug: options?.sound ?? false,
  })

  return { trigger, cancel, isSupported }
}
