"use client"

import Image from "next/image"
import { useLanguage } from "@/contexts/language-context"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { RotateCcw, Info } from "lucide-react"

interface HeaderProps {
  onInfoClick: () => void
}

export function Header({ onInfoClick }: HeaderProps) {
  const { language, setLanguage, t } = useLanguage()

  const handleReset = () => {
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
