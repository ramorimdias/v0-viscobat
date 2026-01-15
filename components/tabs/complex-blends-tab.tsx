"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useLanguage } from "@/contexts/language-context"
import { useCorrelationSettings } from "@/contexts/correlation-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { solve_complex_blend } from "@/lib/viscosity-calculations"
import { parseNumericInput } from "@/lib/number-utils"
import { Puzzle, Plus, Trash2, Lightbulb, CheckCircle, AlertTriangle } from "lucide-react"

type ConstraintType = "free" | "range" | "objectiveMin" | "objectiveMax" | "setValue"

interface SolverComponent {
  id: number
  name: string
  viscosity: string
  type: ConstraintType
  value: string
  min: string
  max: string
}

export function ComplexBlendsTab() {
  const { t } = useLanguage()
  const { correlation } = useCorrelationSettings()
  const [components, setComponents] = useState<SolverComponent[]>([
    { id: 1, name: "Base Oil A", viscosity: "", type: "free", value: "", min: "", max: "" },
    { id: 2, name: "Base Oil B", viscosity: "", type: "free", value: "", min: "", max: "" },
  ])
  const [mixtureType, setMixtureType] = useState<ConstraintType>("free")
  const [mixtureValue, setMixtureValue] = useState("")
  const [mixtureMin, setMixtureMin] = useState("")
  const [mixtureMax, setMixtureMax] = useState("")
  const [result, setResult] = useState<{
    fractions: Record<number, number>
    viscosity: number
    diagnostics: { status: string; variableRanges: Record<string, { min: number; max: number }> }
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem("viscobat:complex-blends")
    if (!stored) return
    try {
      const parsed = JSON.parse(stored) as {
        components?: SolverComponent[]
        mixtureType?: ConstraintType
        mixtureValue?: string
        mixtureMin?: string
        mixtureMax?: string
        result?: {
          fractions: Record<number, number>
          viscosity: number
          diagnostics: { status: string; variableRanges: Record<string, { min: number; max: number }> }
        } | null
        error?: string | null
      }
      setComponents(
        parsed.components && parsed.components.length > 0
          ? parsed.components
          : [
              { id: 1, name: "Base Oil A", viscosity: "", type: "free", value: "", min: "", max: "" },
              { id: 2, name: "Base Oil B", viscosity: "", type: "free", value: "", min: "", max: "" },
            ],
      )
      setMixtureType(parsed.mixtureType ?? "free")
      setMixtureValue(parsed.mixtureValue ?? "")
      setMixtureMin(parsed.mixtureMin ?? "")
      setMixtureMax(parsed.mixtureMax ?? "")
      setResult(parsed.result ?? null)
      setError(parsed.error ?? null)
    } catch {
      setComponents([
        { id: 1, name: "Base Oil A", viscosity: "", type: "free", value: "", min: "", max: "" },
        { id: 2, name: "Base Oil B", viscosity: "", type: "free", value: "", min: "", max: "" },
      ])
      setMixtureType("free")
      setMixtureValue("")
      setMixtureMin("")
      setMixtureMax("")
      setResult(null)
      setError(null)
    }
  }, [])

  useEffect(() => {
    const payload = {
      components,
      mixtureType,
      mixtureValue,
      mixtureMin,
      mixtureMax,
      result,
      error,
    }
    localStorage.setItem("viscobat:complex-blends", JSON.stringify(payload))
  }, [components, mixtureType, mixtureValue, mixtureMin, mixtureMax, result, error])

  const addComponent = () => {
    const newId = Math.max(...components.map((c) => c.id), 0) + 1
    setComponents([
      ...components,
      { id: newId, name: `${t("component")} ${newId}`, viscosity: "", type: "free", value: "", min: "", max: "" },
    ])
  }

  const removeComponent = (id: number) => {
    if (components.length <= 2) return
    setComponents(components.filter((c) => c.id !== id))
  }

  const updateComponent = (id: number, field: keyof SolverComponent, val: string) => {
    setComponents(components.map((c) => (c.id === id ? { ...c, [field]: val } : c)))
  }

  const handleSolve = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setResult(null)

    const comps = components.map((c) => ({
      viscosity: parseNumericInput(c.viscosity),
      type: c.type,
      value: c.value !== "" ? parseNumericInput(c.value) : undefined,
      min: c.min !== "" ? parseNumericInput(c.min) : undefined,
      max: c.max !== "" ? parseNumericInput(c.max) : undefined,
      name: c.name,
    }))

    const mixture = {
      type: mixtureType,
      value: mixtureValue !== "" ? parseNumericInput(mixtureValue) : undefined,
      min: mixtureMin !== "" ? parseNumericInput(mixtureMin) : undefined,
      max: mixtureMax !== "" ? parseNumericInput(mixtureMax) : undefined,
    }

    const solveResult = solve_complex_blend(comps, mixture, correlation)

    if ("error" in solveResult) {
      setError(solveResult.error)
    } else {
      setResult(solveResult)
    }
  }

  useEffect(() => {
    if (!result && !error) return
    const comps = components.map((c) => ({
      viscosity: parseNumericInput(c.viscosity),
      type: c.type,
      value: c.value !== "" ? parseNumericInput(c.value) : undefined,
      min: c.min !== "" ? parseNumericInput(c.min) : undefined,
      max: c.max !== "" ? parseNumericInput(c.max) : undefined,
      name: c.name,
    }))

    const mixture = {
      type: mixtureType,
      value: mixtureValue !== "" ? parseNumericInput(mixtureValue) : undefined,
      min: mixtureMin !== "" ? parseNumericInput(mixtureMin) : undefined,
      max: mixtureMax !== "" ? parseNumericInput(mixtureMax) : undefined,
    }

    const solveResult = solve_complex_blend(comps, mixture, correlation)

    if ("error" in solveResult) {
      setError(solveResult.error)
      setResult(null)
    } else {
      setResult(solveResult)
      setError(null)
    }
  }, [correlation])

  const constraintOptions = [
    { value: "free", label: t("solver_free") },
    { value: "range", label: t("solver_range") },
    { value: "objectiveMin", label: t("solver_min") },
    { value: "objectiveMax", label: t("solver_max") },
    { value: "setValue", label: t("solver_set") },
  ]

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t("solver_heading")}</h2>
        <p className="text-muted-foreground mt-1">{t("solver_description")}</p>
      </div>

      <form onSubmit={handleSolve}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Components Card */}
          <Card className="border-2 lg:col-span-2">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold uppercase tracking-wide">{t("components")}</CardTitle>
                  <CardDescription>{t("define_constraints_desc")}</CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addComponent}
                  className="gap-2 bg-transparent"
                >
                  <Plus className="w-4 h-4" />
                  {t("btn_add_component")}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {components.map((comp, index) => (
                <div key={comp.id} className="p-4 rounded-lg bg-muted/50 space-y-3">
                  <div className="grid gap-3 md:grid-cols-[auto,1fr,minmax(0,140px),minmax(0,180px),minmax(0,140px),minmax(0,140px),auto] items-center">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <Input
                      value={comp.name}
                      onChange={(e) => updateComponent(comp.id, "name", e.target.value)}
                      className="font-medium"
                      placeholder={t("component")}
                    />
                    <div className="space-y-1 md:col-start-3">
                      <label className="text-xs uppercase tracking-wide text-muted-foreground">
                        {t("table_viscosity")} (mm²/s)
                      </label>
                      <Input
                        type="text"
                        inputMode="decimal"
                        min="0"
                        value={comp.viscosity}
                        onChange={(e) => updateComponent(comp.id, "viscosity", e.target.value)}
                        className="font-mono"
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-1 md:col-start-4">
                      <label className="text-xs uppercase tracking-wide text-muted-foreground">
                        {t("table_constraint")}
                      </label>
                      <Select value={comp.type} onValueChange={(val) => updateComponent(comp.id, "type", val)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {constraintOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {comp.type === "setValue" && (
                      <div className="space-y-1 md:col-start-5">
                        <label className="text-xs uppercase tracking-wide text-muted-foreground">
                          {t("table_value")} (%)
                        </label>
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={comp.value}
                          onChange={(e) => updateComponent(comp.id, "value", e.target.value)}
                          className="font-mono"
                          placeholder="%"
                        />
                      </div>
                    )}

                    {comp.type === "range" && (
                      <>
                        <div className="space-y-1 md:col-start-5">
                          <label className="text-xs uppercase tracking-wide text-muted-foreground">
                            {t("solver_min_value")} %
                          </label>
                          <Input
                            type="text"
                            inputMode="decimal"
                            value={comp.min}
                            onChange={(e) => updateComponent(comp.id, "min", e.target.value)}
                            className="font-mono"
                            placeholder="0"
                          />
                        </div>
                        <div className="space-y-1 md:col-start-6">
                          <label className="text-xs uppercase tracking-wide text-muted-foreground">
                            {t("solver_max_value")} %
                          </label>
                          <Input
                            type="text"
                            inputMode="decimal"
                            value={comp.max}
                            onChange={(e) => updateComponent(comp.id, "max", e.target.value)}
                            className="font-mono"
                            placeholder="100"
                          />
                        </div>
                      </>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeComponent(comp.id)}
                      disabled={components.length <= 2}
                      className="text-muted-foreground hover:text-destructive md:col-start-7"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Mixture Constraint Card */}
          <Card className="border-2">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold uppercase tracking-wide">{t("solver_mix")}</CardTitle>
              <CardDescription>{t("solver_mix_type")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">{t("table_constraint")}</Label>
                <Select value={mixtureType} onValueChange={(val) => setMixtureType(val as ConstraintType)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {constraintOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {mixtureType === "setValue" && (
                <div>
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                    {t("solver_mix_value")}
                  </Label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={mixtureValue}
                    onChange={(e) => setMixtureValue(e.target.value)}
                    className="font-mono mt-1"
                  />
                </div>
              )}

              {mixtureType === "range" && (
                <>
                  <div>
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                      {t("solver_min_value")}
                    </Label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={mixtureMin}
                      onChange={(e) => setMixtureMin(e.target.value)}
                      className="font-mono mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                      {t("solver_max_value")}
                    </Label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={mixtureMax}
                      onChange={(e) => setMixtureMax(e.target.value)}
                      className="font-mono mt-1"
                    />
                  </div>
                </>
              )}

              <Button type="submit" className="w-full">
                <Puzzle className="w-4 h-4 mr-2" />
                {t("btn_solve")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>

      {/* Error Display */}
      {error && (
        <Card className="border-2 border-destructive">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
              <div>
                <p className="font-medium text-destructive">{t("error")}</p>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Display */}
      {result && (
        <Card className="border-2 border-primary">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-primary" />
              <div>
                <CardTitle className="text-base font-semibold uppercase tracking-wide">
                  {t("solver_result_title")}
                </CardTitle>
                <CardDescription>
                  {result.diagnostics.status === "unique" ? t("solver_diag_unique") : t("solver_diag_multiple")}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Blend Proportions */}
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                {t("solver_summary_title")}
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {components.map((comp, idx) => {
                  const fraction = result.fractions[idx]
                  const range = result.diagnostics.variableRanges[String(idx)]
                  return (
                    <div key={comp.id} className="p-3 rounded-lg bg-muted">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1 truncate">
                        {comp.name}
                      </p>
                      <p className="text-2xl font-bold font-mono">{fraction?.toFixed(2) ?? "—"}%</p>
                      {range && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {t("solver_possible_range")}: {range.min.toFixed(1)}% – {range.max.toFixed(1)}%
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Final Viscosity */}
            <div className="p-4 rounded-lg bg-primary/10 border-2 border-primary">
              <p className="text-xs uppercase tracking-wide text-primary mb-1">{t("solver_mixture_result")}</p>
              <p className="text-4xl font-bold font-mono text-primary">{result.viscosity.toFixed(3)}</p>
              <p className="text-sm text-muted-foreground mt-1">mm²/s</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tips Section */}
      <Card className="bg-muted/50 border-dashed">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-primary mt-0.5" />
            <div className="text-sm">
              <p className="font-medium mb-1">{t("tip_title")}</p>
              <p className="text-muted-foreground">{t("tip_solver")}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
