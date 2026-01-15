"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import type { CorrelationType } from "@/lib/viscosity-calculations"

interface CorrelationContextType {
  correlation: CorrelationType
  setCorrelation: (correlation: CorrelationType) => void
}

const CORRELATION_STORAGE_KEY = "viscobat:correlation"
const LEGACY_WALTHER_BASE_KEY = "viscobat:walther-log-base"

const CorrelationContext = createContext<CorrelationContextType | undefined>(undefined)

const migrateLegacyCorrelation = (storedBase: string | null): CorrelationType | null => {
  if (storedBase === "log10") return "walther"
  if (storedBase === "ln") return "refutas"
  return null
}

export function CorrelationProvider({ children }: { children: ReactNode }) {
  const [correlation, setCorrelation] = useState<CorrelationType>("walther")

  useEffect(() => {
    const storedCorrelation = window.localStorage.getItem(CORRELATION_STORAGE_KEY)
    if (storedCorrelation === "walther" || storedCorrelation === "refutas") {
      setCorrelation(storedCorrelation)
      return
    }

    const legacy = migrateLegacyCorrelation(window.localStorage.getItem(LEGACY_WALTHER_BASE_KEY))
    if (legacy) {
      setCorrelation(legacy)
      window.localStorage.setItem(CORRELATION_STORAGE_KEY, legacy)
      window.localStorage.removeItem(LEGACY_WALTHER_BASE_KEY)
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(CORRELATION_STORAGE_KEY, correlation)
  }, [correlation])

  return (
    <CorrelationContext.Provider value={{ correlation, setCorrelation }}>
      {children}
    </CorrelationContext.Provider>
  )
}

export function useCorrelationSettings() {
  const context = useContext(CorrelationContext)
  if (!context) {
    throw new Error("useCorrelationSettings must be used within a CorrelationProvider")
  }
  return context
}
