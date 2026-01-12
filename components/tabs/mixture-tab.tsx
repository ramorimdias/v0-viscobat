"use client"

import type React from "react"
import { useState } from "react"
import { useLanguage } from "@/contexts/language-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { compute_mixture } from "@/lib/viscosity-calculations"
import { Plus, Trash2, FlaskConical, Lightbulb } from "lucide-react"

interface Component {
  id: number
  percent: string
  viscosity: string
}

export function MixtureTab() {
  const { t } = useLanguage()
  const [components, setComponents] = useState<Component[]>([
    { id: 1, percent: "", viscosity: "" },
    { id: 2, percent: "", viscosity: "" },
  ])
  const [result, setResult] = useState<{ viscosity: number } | { error: string } | null>(null)

  const addComponent = () => {
    const newId = Math.max(...components.map((c) => c.id), 0) + 1
    setComponents([...components, { id: newId, percent: "", viscosity: "" }])
  }

  const removeComponent = (id: number) => {
    if (components.length <= 2) return
    setComponents(components.filter((c) => c.id !== id))
  }

  const updateComponent = (id: number, field: "percent" | "viscosity", value: string) => {
    setComponents(components.map((c) => (c.id === id ? { ...c, [field]: value } : c)))
  }

  const totalPercent = components.reduce((sum, c) => {
    const val = Number.parseFloat(c.percent)
    return sum + (isNaN(val) ? 0 : val)
  }, 0)

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault()

    const validComponents = components
      .filter((c) => c.percent !== "" && c.viscosity !== "")
      .map((c) => ({
        percent: Number.parseFloat(c.percent),
        viscosity: Number.parseFloat(c.viscosity),
      }))
      .filter((c) => !isNaN(c.percent) && !isNaN(c.viscosity) && c.percent > 0)

    if (validComponents.length === 0) {
      setResult({ error: t("no_components") })
      return
    }

    const total = validComponents.reduce((sum, c) => sum + c.percent, 0)
    if (Math.abs(total - 100) > 1e-6) {
      setResult({ error: t("sum_must_100") })
      return
    }

    const viscosities = validComponents.map((c) => c.viscosity)
    const fractions = validComponents.map((c) => c.percent / 100)
    const mixtureVisc = compute_mixture(viscosities, fractions)

    if (isNaN(mixtureVisc)) {
      setResult({ error: t("error") })
    } else {
      setResult({ viscosity: mixtureVisc })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t("mixture_heading")}</h2>
        <p className="text-muted-foreground mt-1">{t("mixture_description")}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Input Card */}
        <Card className="border-2 lg:col-span-2">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold uppercase tracking-wide">{t("components")}</CardTitle>
                <CardDescription>{t("add_components_desc")}</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={addComponent} className="gap-2 bg-transparent">
                <Plus className="w-4 h-4" />
                {t("btn_add_component")}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCalculate} className="space-y-4">
              <div className="space-y-3">
                {components.map((comp, index) => (
                  <div key={comp.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs uppercase tracking-wide text-muted-foreground">
                          {t("table_percent")}
                        </label>
                        <Input
                          type="number"
                          step="any"
                          min="0"
                          max="100"
                          value={comp.percent}
                          onChange={(e) => updateComponent(comp.id, "percent", e.target.value)}
                          placeholder="0"
                          className="font-mono mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs uppercase tracking-wide text-muted-foreground">
                          {t("table_viscosity")} (mm²/s)
                        </label>
                        <Input
                          type="number"
                          step="any"
                          min="0"
                          value={comp.viscosity}
                          onChange={(e) => updateComponent(comp.id, "viscosity", e.target.value)}
                          placeholder="0"
                          className="font-mono mt-1"
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeComponent(comp.id)}
                      disabled={components.length <= 2}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Total indicator */}
              <div
                className={`p-3 rounded-lg border-2 ${Math.abs(totalPercent - 100) < 0.01 ? "border-green-500 bg-green-50 dark:bg-green-950" : "border-border bg-muted/30"}`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total</span>
                  <span
                    className={`text-lg font-bold font-mono ${Math.abs(totalPercent - 100) < 0.01 ? "text-green-600 dark:text-green-400" : "text-foreground"}`}
                  >
                    {totalPercent.toFixed(1)}%
                  </span>
                </div>
              </div>

              <Button type="submit" className="w-full">
                <FlaskConical className="w-4 h-4 mr-2" />
                {t("btn_calculate")}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Results Card */}
        <Card
          className={`border-2 transition-all ${result && !("error" in result) ? "border-primary" : "border-dashed"}`}
        >
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold uppercase tracking-wide">{t("results")}</CardTitle>
            <CardDescription>{t("mixture_result")}</CardDescription>
          </CardHeader>
          <CardContent>
            {result ? (
              "error" in result ? (
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-destructive text-sm">{result.error}</p>
                </div>
              ) : (
                <div className="p-6 rounded-lg bg-primary/10 border-2 border-primary text-center">
                  <p className="text-xs uppercase tracking-wide text-primary mb-2">{t("mixture_result")}</p>
                  <p className="text-4xl font-bold font-mono text-primary">{result.viscosity.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground mt-1">mm²/s</p>
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                <FlaskConical className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-sm">{t("enter_data_calculate")}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tips Section */}
      <Card className="bg-muted/50 border-dashed">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-primary mt-0.5" />
            <div className="text-sm">
              <p className="font-medium mb-1">{t("tip_title")}</p>
              <p className="text-muted-foreground">{t("tip_mixture")}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
