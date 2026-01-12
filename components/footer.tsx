"use client"

import Image from "next/image"
import { useLanguage } from "@/contexts/language-context"

export function Footer() {
  const { t } = useLanguage()

  return (
    <footer className="border-t bg-muted/30 py-6 mt-auto">
      <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">© 2025 Viscobat — Rodrigo AMORIM DIAS</p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{t("powered_by")}</span>
          <Image src="/images/motul-logo.png" alt="Motul" width={80} height={24} className="h-6 w-auto" />
        </div>
      </div>
    </footer>
  )
}
