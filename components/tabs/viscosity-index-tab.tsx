"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useLanguage } from "@/contexts/language-context"
import { useCorrelationSettings } from "@/contexts/correlation-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { walther_params, walther_viscosity_at_temp, compute_vi_from_v40_v100 } from "@/lib/viscosity-calculations"
import { parseNumericInput } from "@/lib/number-utils"
import { Calculator, Lightbulb } from "lucide-react"

export function ViscosityIndexTab() {
  const { t } = useLanguage()
  const { correlation } = useCorrelationSettings()
  const [v1, setV1] = useState("")
  const [t1, setT1] = useState("40")
  const [v2, setV2] = useState("")
  const [t2, setT2] = useState("100")
  const [result, setResult] = useState<{ v40: number; v100: number; vi: number } | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem("viscobat:viscosity-index")
    if (!stored) return
    try {
      const parsed = JSON.parse(stored) as {
        v1?: string
        t1?: string
        v2?: string
        t2?: string
        result?: { v40: number; v100: number; vi: number } | null
      }
      setV1(parsed.v1 ?? "")
      setT1(parsed.t1 ?? "40")
      setV2(parsed.v2 ?? "")
      setT2(parsed.t2 ?? "100")
      setResult(parsed.result ?? null)
    } catch {
      setV1("")
      setT1("40")
      setV2("")
      setT2("100")
      setResult(null)
    }
  }, [])

  useEffect(() => {
    const payload = {
      v1,
      t1,
      v2,
      t2,
      result,
    }
    localStorage.setItem("viscobat:viscosity-index", JSON.stringify(payload))
  }, [v1, t1, v2, t2, result])

  const computeResult = () => {
    const v1Num = parseNumericInput(v1)
    const t1Num = parseNumericInput(t1)
    const v2Num = parseNumericInput(v2)
    const t2Num = parseNumericInput(t2)

    if (isNaN(v1Num) || isNaN(t1Num) || isNaN(v2Num) || isNaN(t2Num)) return null

    const params = walther_params(v1Num, t1Num, v2Num, t2Num, correlation)
    const v40 = walther_viscosity_at_temp(params.slope, params.intercept, 40, correlation)
    const v100 = walther_viscosity_at_temp(params.slope, params.intercept, 100, correlation)
    const vi = compute_vi_from_v40_v100(v40, v100)
    return { v40, v100, vi }
  }

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault()
    const computed = computeResult()
    if (!computed) return
    setResult(computed)
  }

  useEffect(() => {
    if (!result) return
    const computed = computeResult()
    setResult(computed)
  }, [correlation])

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t("vi_heading")}</h2>
        <p className="text-muted-foreground mt-1">{t("vi_description")}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Card */}
        <Card className="border-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold uppercase tracking-wide">{t("input_data")}</CardTitle>
            <CardDescription>{t("input_two_points")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCalculate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vi-v1" className="text-xs uppercase tracking-wide text-muted-foreground">
                    {t("label_v1")}
                  </Label>
                  <Input
                    id="vi-v1"
                    type="text"
                    inputMode="decimal"
                    value={v1}
                    onChange={(e) => setV1(e.target.value)}
                    placeholder="e.g. 100"
                    className="font-mono"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vi-t1" className="text-xs uppercase tracking-wide text-muted-foreground">
                    {t("label_t1")}
                  </Label>
                  <Input
                    id="vi-t1"
                    type="text"
                    inputMode="decimal"
                    value={t1}
                    onChange={(e) => setT1(e.target.value)}
                    className="font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vi-v2" className="text-xs uppercase tracking-wide text-muted-foreground">
                    {t("label_v2")}
                  </Label>
                  <Input
                    id="vi-v2"
                    type="text"
                    inputMode="decimal"
                    value={v2}
                    onChange={(e) => setV2(e.target.value)}
                    placeholder="e.g. 14"
                    className="font-mono"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vi-t2" className="text-xs uppercase tracking-wide text-muted-foreground">
                    {t("label_t2")}
                  </Label>
                  <Input
                    id="vi-t2"
                    type="text"
                    inputMode="decimal"
                    value={t2}
                    onChange={(e) => setT2(e.target.value)}
                    className="font-mono"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full">
                <Calculator className="w-4 h-4 mr-2" />
                {t("btn_calculate")}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Results Card */}
        <Card className={`border-2 transition-all ${result ? "border-primary" : "border-dashed"}`}>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold uppercase tracking-wide">{t("results")}</CardTitle>
            <CardDescription>{t("calculated_params")}</CardDescription>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">KV @ 40°C</p>
                    <p className="text-2xl font-bold font-mono">{result.v40.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">mm²/s</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">KV @ 100°C</p>
                    <p className="text-2xl font-bold font-mono">{result.v100.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">mm²/s</p>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-primary/10 border-2 border-primary">
                  <p className="text-xs uppercase tracking-wide text-primary mb-1">{t("vi_result_vi")}</p>
                  <p className="text-4xl font-bold font-mono text-primary">{result.vi}</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                <Calculator className="w-12 h-12 mb-3 opacity-20" />
                <p>{t("enter_data_calculate")}</p>
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
              <p className="text-muted-foreground">{t("tip_vi")}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
