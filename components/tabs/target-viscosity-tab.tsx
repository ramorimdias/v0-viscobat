"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useLanguage } from "@/contexts/language-context"
import { useWaltherSettings } from "@/contexts/walther-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { solve_two_bases } from "@/lib/viscosity-calculations"
import { Target, Plus, Trash2, Lightbulb } from "lucide-react"

interface KnownComponent {
  id: number
  percent: string
  viscosity: string
}

export function TargetViscosityTab() {
  const { t } = useLanguage()
  const { logBase } = useWaltherSettings()
  const [targetVisc, setTargetVisc] = useState("")
  const [baseA, setBaseA] = useState("")
  const [baseB, setBaseB] = useState("")
  const [knownComponents, setKnownComponents] = useState<KnownComponent[]>([])
  const [result, setResult] = useState<{ percentA: number; percentB: number } | { error: string } | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem("viscobat:target-viscosity")
    if (!stored) return
    try {
      const parsed = JSON.parse(stored) as {
        targetVisc?: string
        baseA?: string
        baseB?: string
        knownComponents?: KnownComponent[]
        result?: { percentA: number; percentB: number } | { error: string } | null
      }
      setTargetVisc(parsed.targetVisc ?? "")
      setBaseA(parsed.baseA ?? "")
      setBaseB(parsed.baseB ?? "")
      setKnownComponents(parsed.knownComponents ?? [])
      setResult(parsed.result ?? null)
    } catch {
      setTargetVisc("")
      setBaseA("")
      setBaseB("")
      setKnownComponents([])
      setResult(null)
    }
  }, [])

  useEffect(() => {
    const payload = {
      targetVisc,
      baseA,
      baseB,
      knownComponents,
      result,
    }
    localStorage.setItem("viscobat:target-viscosity", JSON.stringify(payload))
  }, [targetVisc, baseA, baseB, knownComponents, result])

  const addKnown = () => {
    const newId = knownComponents.length > 0 ? Math.max(...knownComponents.map((c) => c.id)) + 1 : 1
    setKnownComponents([...knownComponents, { id: newId, percent: "", viscosity: "" }])
  }

  const removeKnown = (id: number) => {
    setKnownComponents(knownComponents.filter((c) => c.id !== id))
  }

  const updateKnown = (id: number, field: "percent" | "viscosity", value: string) => {
    setKnownComponents(knownComponents.map((c) => (c.id === id ? { ...c, [field]: value } : c)))
  }

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault()

    const target = Number.parseFloat(targetVisc)
    const baseAVisc = Number.parseFloat(baseA)
    const baseBVisc = Number.parseFloat(baseB)

    if (isNaN(target) || isNaN(baseAVisc) || isNaN(baseBVisc)) {
      setResult({ error: t("error") })
      return
    }

    const known = knownComponents
      .filter((c) => c.percent !== "" && c.viscosity !== "")
      .map((c) => ({
        percent: Number.parseFloat(c.percent),
        viscosity: Number.parseFloat(c.viscosity),
      }))
      .filter((c) => !isNaN(c.percent) && !isNaN(c.viscosity) && c.percent > 0)

    const solveResult = solve_two_bases(target, baseAVisc, baseBVisc, known, logBase)
    setResult(solveResult)
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t("two_bases_heading")}</h2>
        <p className="text-muted-foreground mt-1">{t("target_description")}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Input Card */}
        <Card className="border-2 lg:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold uppercase tracking-wide">{t("target_config")}</CardTitle>
            <CardDescription>{t("define_target_desc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCalculate} className="space-y-6">
              {/* Target Viscosity */}
              <div className="p-4 rounded-lg bg-primary/10 border-2 border-primary">
                <Label
                  htmlFor="tb-target"
                  className="text-xs uppercase tracking-wide text-primary font-semibold mb-2 block"
                >
                  {t("label_target_mix")}
                </Label>
                <Input
                  id="tb-target"
                  type="number"
                  step="any"
                  value={targetVisc}
                  onChange={(e) => setTargetVisc(e.target.value)}
                  placeholder="e.g. 100"
                  className="font-mono text-lg"
                  required
                />
              </div>

              {/* Base Oils */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted">
                  <Label
                    htmlFor="tb-baseA"
                    className="text-xs uppercase tracking-wide text-muted-foreground mb-2 block"
                  >
                    {t("label_baseA")}
                  </Label>
                  <Input
                    id="tb-baseA"
                    type="number"
                    step="any"
                    value={baseA}
                    onChange={(e) => setBaseA(e.target.value)}
                    placeholder="mm²/s"
                    className="font-mono"
                    required
                  />
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <Label
                    htmlFor="tb-baseB"
                    className="text-xs uppercase tracking-wide text-muted-foreground mb-2 block"
                  >
                    {t("label_baseB")}
                  </Label>
                  <Input
                    id="tb-baseB"
                    type="number"
                    step="any"
                    value={baseB}
                    onChange={(e) => setBaseB(e.target.value)}
                    placeholder="mm²/s"
                    className="font-mono"
                    required
                  />
                </div>
              </div>

              {/* Known Components Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-semibold">{t("components")}</h4>
                    <p className="text-xs text-muted-foreground">{t("add_components_desc")}</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addKnown} className="gap-2 bg-transparent">
                    <Plus className="w-4 h-4" />
                    {t("btn_add_known")}
                  </Button>
                </div>

                {knownComponents.length > 0 && (
                  <div className="space-y-2">
                    {knownComponents.map((comp, index) => (
                      <div key={comp.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="w-6 h-6 rounded-full bg-muted-foreground/20 text-muted-foreground flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1 grid grid-cols-2 gap-3">
                          <Input
                            type="number"
                            step="any"
                            min="0"
                            value={comp.percent}
                            onChange={(e) => updateKnown(comp.id, "percent", e.target.value)}
                            placeholder={t("table_percent")}
                            className="font-mono"
                          />
                          <Input
                            type="number"
                            step="any"
                            min="0"
                            value={comp.viscosity}
                            onChange={(e) => updateKnown(comp.id, "viscosity", e.target.value)}
                            placeholder="mm²/s"
                            className="font-mono"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeKnown(comp.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full">
                <Target className="w-4 h-4 mr-2" />
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
            <CardDescription>{t("calculated_params")}</CardDescription>
          </CardHeader>
          <CardContent>
            {result ? (
              "error" in result ? (
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-destructive text-sm">{result.error}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-primary/10 border-2 border-primary">
                    <p className="text-xs uppercase tracking-wide text-primary mb-1 font-semibold">
                      {t("component")} A
                    </p>
                    <p className="text-3xl font-bold font-mono text-primary">{result.percentA.toFixed(2)}%</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">{t("component")} B</p>
                    <p className="text-3xl font-bold font-mono">{result.percentB.toFixed(2)}%</p>
                  </div>
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                <Target className="w-12 h-12 mb-3 opacity-20" />
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
              <p className="text-muted-foreground">{t("tip_target")}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
