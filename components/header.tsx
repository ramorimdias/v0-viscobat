"use client"

import Image from "next/image"
import { useLanguage } from "@/contexts/language-context"
import { useWaltherSettings } from "@/contexts/walther-context"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { RotateCcw, Info } from "lucide-react"

interface HeaderProps {
  onInfoClick: () => void
}

export function Header({ onInfoClick }: HeaderProps) {
  const { language, setLanguage, t } = useLanguage()
  const { logBase, setLogBase } = useWaltherSettings()

  const handleReset = () => {
    if (typeof window !== "undefined") {
      const keysToClear = [
        "viscobat:viscosity-index",
        "viscobat:mixture",
        "viscobat:target-viscosity",
        "viscobat:temperature-extrapolation",
        "viscobat:complex-blends",
        "viscobat:walther-log-base",
      ]

      keysToClear.forEach((key) => window.localStorage.removeItem(key))
    }
    window.location.reload()
  }

  return (
    <header className="sticky top-0 z-50 bg-primary">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          <Image src="/images/icon.png" alt="Viscobat" width={44} height={44} className="rounded-lg" />
          <div>
            <h1 className="text-lg font-bold tracking-tight text-primary-foreground">VISCOBAT</h1>
            <p className="text-xs text-primary-foreground/70 uppercase tracking-widest">v2.0</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select value={language} onValueChange={(val) => setLanguage(val as "FR" | "EN")}>
            <SelectTrigger className="w-20 h-9 text-sm bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EN">EN</SelectItem>
              <SelectItem value="FR">FR</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <span className="hidden md:inline text-xs text-primary-foreground/70">{t("walther_log_base")}</span>
            <Select value={logBase} onValueChange={(val) => setLogBase(val as "log10" | "ln")}>
              <SelectTrigger className="w-24 h-9 text-sm bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="log10">log10</SelectItem>
                <SelectItem value="ln">ln</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="h-9 gap-2 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">{t("btn_refresh")}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onInfoClick}
            className="h-9 w-9 p-0 text-primary-foreground hover:bg-primary-foreground/20"
          >
            <Info className="w-4 h-4" />
            <span className="sr-only">Info</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
