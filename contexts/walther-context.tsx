"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import type { WaltherLogBase } from "@/lib/viscosity-calculations"

interface WaltherContextType {
  logBase: WaltherLogBase
  setLogBase: (base: WaltherLogBase) => void
}

const WALTHER_STORAGE_KEY = "viscobat:walther-log-base"

const WaltherContext = createContext<WaltherContextType | undefined>(undefined)

export function WaltherProvider({ children }: { children: ReactNode }) {
  const [logBase, setLogBase] = useState<WaltherLogBase>("log10")

  useEffect(() => {
    const storedBase = window.localStorage.getItem(WALTHER_STORAGE_KEY)
    if (storedBase === "log10" || storedBase === "ln") {
      setLogBase(storedBase)
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(WALTHER_STORAGE_KEY, logBase)
  }, [logBase])

  return <WaltherContext.Provider value={{ logBase, setLogBase }}>{children}</WaltherContext.Provider>
}

export function useWaltherSettings() {
  const context = useContext(WaltherContext)
  if (!context) {
    throw new Error("useWaltherSettings must be used within a WaltherProvider")
  }
  return context
}
