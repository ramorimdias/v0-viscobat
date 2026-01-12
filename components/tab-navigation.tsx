"use client"

import { useLanguage } from "@/contexts/language-context"
import { cn } from "@/lib/utils"
import { Calculator, Thermometer, FlaskConical, Target, Puzzle } from "lucide-react"

interface TabNavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const tabs = [
  { id: "vi", labelKey: "tab_vi", icon: Calculator },
  { id: "temp", labelKey: "tab_temp", icon: Thermometer },
  { id: "mixture", labelKey: "tab_mixture", icon: FlaskConical },
  { id: "twoBases", labelKey: "tab_two_bases", icon: Target },
  { id: "solver", labelKey: "tab_solver", icon: Puzzle },
]

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const { t } = useLanguage()

  return (
    <nav className="bg-card border-b border-border">
      <div className="max-w-6xl mx-auto">
        <div className="flex overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-all border-b-2 -mb-px",
                  activeTab === tab.id
                    ? "text-primary border-primary"
                    : "text-muted-foreground border-transparent hover:text-foreground hover:border-border",
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{t(tab.labelKey)}</span>
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
