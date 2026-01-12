"use client"

import Image from "next/image"
import { useLanguage } from "@/contexts/language-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Calendar, User, GitBranch } from "lucide-react"

interface InfoModalProps {
  isOpen: boolean
  onClose: () => void
}

export function InfoModal({ isOpen, onClose }: InfoModalProps) {
  const { t } = useLanguage()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <Image src="/images/icon.png" alt="Viscobat" width={44} height={44} className="rounded-lg" />
            <div>
              <DialogTitle className="text-xl">VISCOBAT</DialogTitle>
              <p className="text-sm text-muted-foreground">{t("modal_subtitle")}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-muted">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <GitBranch className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wide">{t("modal_version")}</span>
              </div>
              <p className="font-semibold">2.0</p>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wide">{t("modal_last_update")}</span>
              </div>
              <p className="font-semibold">Jan 2026</p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-muted">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <User className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wide">{t("modal_author")}</span>
            </div>
            <p className="font-semibold">Rodrigo AMORIM DIAS</p>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">{t("modal_description")}</p>

          <div className="pt-4 border-t border-border flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{t("modal_footer")}</p>
          </div>

          <div className="flex justify-center pt-2">
            <Image src="/images/motul-logo.png" alt="Motul" width={120} height={36} className="h-8 w-auto" />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
