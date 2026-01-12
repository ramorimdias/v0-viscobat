"use client"

import type React from "react"
import { useState } from "react"
import { useLanguage } from "@/contexts/language-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { walther_regression, walther_viscosity_at_temp, linear_regression } from "@/lib/viscosity-calculations"
import { ViscosityChart } from "@/components/viscosity-chart"
import { Thermometer, Plus, Trash2, Lightbulb, Droplets, Gauge, Flame } from "lucide-react"

type SubTab = "kv" | "density" | "cp" | "thermal"

interface DataPoint {
  id: number
  temperature: string
  value: string
}

export function TemperatureExtrapolationTab() {
  const { t } = useLanguage()
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("kv")
  const [kvPoints, setKvPoints] = useState<DataPoint[]>([
    { id: 1, temperature: "40", value: "" },
    { id: 2, temperature: "100", value: "" },
  ])
  const [densityPoints, setDensityPoints] = useState<DataPoint[]>([
    { id: 1, temperature: "", value: "" },
    { id: 2, temperature: "", value: "" },
  ])
  const [cpPoints, setCpPoints] = useState<DataPoint[]>([
    { id: 1, temperature: "", value: "" },
    { id: 2, temperature: "", value: "" },
  ])
  const [thermalPoints, setThermalPoints] = useState<DataPoint[]>([
    { id: 1, temperature: "", value: "" },
    { id: 2, temperature: "", value: "" },
  ])
  const [targetTemp, setTargetTemp] = useState("20")
  const [kvResult, setKvResult] = useState<{
    table: { temp: number; value: number }[]
    targetValue: number | null
    equation: string
    params: { slope: number; intercept: number }
    chartData: { x: number; y: number }[]
    experimental: { x: number; y: number }[]
  } | null>(null)
  const [linearResult, setLinearResult] = useState<{
    table: { temp: number; value: number }[]
    targetValue: number | null
    equation: string
    beta?: number
    chartData: { x: number; y: number }[]
    experimental: { x: number; y: number }[]
  } | null>(null)

  const subTabs: { id: SubTab; labelKey: string; icon: React.ElementType; unit: string }[] = [
    { id: "kv", labelKey: "subtab_kv", icon: Droplets, unit: "mm²/s" },
    { id: "density", labelKey: "subtab_density", icon: Gauge, unit: "kg/m³" },
    { id: "cp", labelKey: "subtab_cp", icon: Flame, unit: "kJ/kgK" },
    { id: "thermal", labelKey: "subtab_thermal", icon: Thermometer, unit: "W/mK" },
  ]

  const currentSubTab = subTabs.find((s) => s.id === activeSubTab)!

  const getPoints = () => {
    switch (activeSubTab) {
      case "kv":
        return kvPoints
      case "density":
        return densityPoints
      case "cp":
        return cpPoints
      case "thermal":
        return thermalPoints
    }
  }

  const setPoints = (points: DataPoint[]) => {
    switch (activeSubTab) {
      case "kv":
        setKvPoints(points)
        break
      case "density":
        setDensityPoints(points)
        break
      case "cp":
        setCpPoints(points)
        break
      case "thermal":
        setThermalPoints(points)
        break
    }
  }

  const addPoint = () => {
    const points = getPoints()
    const newId = Math.max(...points.map((p) => p.id), 0) + 1
    setPoints([...points, { id: newId, temperature: "", value: "" }])
  }

  const removePoint = (id: number) => {
    const points = getPoints()
    if (points.length <= 2) return
    setPoints(points.filter((p) => p.id !== id))
  }

  const updatePoint = (id: number, field: "temperature" | "value", val: string) => {
    const points = getPoints()
    setPoints(points.map((p) => (p.id === id ? { ...p, [field]: val } : p)))
  }

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault()
    const points = getPoints()
    const targetTempNum = Number.parseFloat(targetTemp)

    const validPoints = points
      .filter((p) => p.temperature !== "" && p.value !== "")
      .map((p) => ({
        temperature: Number.parseFloat(p.temperature),
        value: Number.parseFloat(p.value),
        viscosity: Number.parseFloat(p.value),
      }))

    if (validPoints.length < 2) return

    if (activeSubTab === "kv") {
      const params = walther_regression(
        validPoints.map((p) => ({ temperature: p.temperature, viscosity: p.viscosity })),
      )
      if (!params) return

      const table: { temp: number; value: number }[] = []
      const chartData: { x: number; y: number }[] = []
      for (let T = -20; T <= 100; T += 10) {
        const visc = walther_viscosity_at_temp(params.slope, params.intercept, T)
        table.push({ temp: T, value: visc })
        chartData.push({ x: T, y: visc })
      }

      let targetValue: number | null = null
      if (!isNaN(targetTempNum)) {
        targetValue = walther_viscosity_at_temp(params.slope, params.intercept, targetTempNum)
      }

      const equation = `KV(T) = 10^(10^(${params.intercept.toFixed(4)} − ${params.slope.toFixed(4)} · log₁₀(T + 273.15))) − 0.7`

      setKvResult({
        table,
        targetValue,
        equation,
        params,
        chartData,
        experimental: validPoints.map((p) => ({ x: p.temperature, y: p.viscosity })),
      })
      setLinearResult(null)
    } else {
      const fit = linear_regression(validPoints.map((p) => ({ temperature: p.temperature, value: p.value })))
      if (!fit) return

      const table: { temp: number; value: number }[] = []
      const chartData: { x: number; y: number }[] = []
      for (let T = 0; T <= 100; T += 10) {
        const val = fit.intercept + fit.slope * T
        table.push({ temp: T, value: val })
        chartData.push({ x: T, y: val })
      }

      let targetValue: number | null = null
      if (!isNaN(targetTempNum)) {
        targetValue = fit.intercept + fit.slope * targetTempNum
      }

      const propName = activeSubTab === "density" ? "ρ" : activeSubTab === "cp" ? "Cp" : "k"
      const equation = `${propName}(T) = ${fit.intercept.toFixed(4)} ${fit.slope >= 0 ? "+" : "−"} ${Math.abs(fit.slope).toFixed(4)}·T`

      let beta: number | undefined
      if (activeSubTab === "density") {
        const meanTemp = validPoints.reduce((sum, p) => sum + p.temperature, 0) / validPoints.length
        const refDensity = fit.intercept + fit.slope * meanTemp
        if (refDensity !== 0) {
          beta = -fit.slope / refDensity
        }
      }

      setLinearResult({
        table,
        targetValue,
        equation,
        beta,
        chartData,
        experimental: validPoints.map((p) => ({ x: p.temperature, y: p.value })),
      })
      setKvResult(null)
    }
  }

  const points = getPoints()
  const result = activeSubTab === "kv" ? kvResult : linearResult
  const valueLabel = t(currentSubTab.labelKey)

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t("temp_heading")}</h2>
        <p className="text-muted-foreground mt-1">{t("temp_description")}</p>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex flex-wrap gap-2">
        {subTabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                activeSubTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
              )}
            >
              <Icon className="w-4 h-4" />
              {t(tab.labelKey)}
            </button>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Card */}
        <Card className="border-2">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold uppercase tracking-wide">{t("data_points")}</CardTitle>
                <CardDescription>{t("add_data_points_desc")}</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={addPoint} className="gap-2 bg-transparent">
                <Plus className="w-4 h-4" />
                {t("btn_add_point")}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCalculate} className="space-y-4">
              <div className="space-y-2">
                {points.map((point, index) => (
                  <div key={point.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs uppercase tracking-wide text-muted-foreground">°C</label>
                        <Input
                          type="number"
                          step="any"
                          value={point.temperature}
                          onChange={(e) => updatePoint(point.id, "temperature", e.target.value)}
                          className="font-mono mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs uppercase tracking-wide text-muted-foreground">
                          {currentSubTab.unit}
                        </label>
                        <Input
                          type="number"
                          step="any"
                          value={point.value}
                          onChange={(e) => updatePoint(point.id, "value", e.target.value)}
                          className="font-mono mt-1"
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removePoint(point.id)}
                      disabled={points.length <= 2}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Target Temperature */}
              <div className="p-4 rounded-lg bg-primary/10 border-2 border-primary">
                <Label htmlFor="target-temp" className="text-xs uppercase tracking-wide text-primary font-semibold">
                  {t("label_target_temp")}
                </Label>
                <Input
                  id="target-temp"
                  type="number"
                  step="any"
                  value={targetTemp}
                  onChange={(e) => setTargetTemp(e.target.value)}
                  className="font-mono mt-2"
                />
              </div>

              <Button type="submit" className="w-full">
                <Thermometer className="w-4 h-4 mr-2" />
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
                {/* Target Value */}
                {result.targetValue !== null && (
                  <div className="p-4 rounded-lg bg-primary/10 border-2 border-primary">
                    <p className="text-xs uppercase tracking-wide text-primary mb-1">
                      {t("target_result")} {Number.parseFloat(targetTemp)}°C
                    </p>
                    <p className="text-3xl font-bold font-mono text-primary">{result.targetValue.toFixed(4)}</p>
                    <p className="text-xs text-muted-foreground mt-1">{currentSubTab.unit}</p>
                  </div>
                )}

                {/* Equation */}
                <div className="p-3 rounded-lg bg-muted">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                    {activeSubTab === "kv" ? t("walther_equation") : t("linear_equation")}
                  </p>
                  <p className="text-sm font-mono break-all">{result.equation}</p>
                </div>

                {activeSubTab === "density" && linearResult?.beta !== undefined && (
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">{t("beta_label")}</p>
                    <p className="text-sm font-mono">{linearResult.beta.toExponential(4)} 1/°C</p>
                  </div>
                )}

                {/* Data Table */}
                <div className="max-h-48 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-card">
                      <tr>
                        <th className="text-left p-2 text-xs uppercase tracking-wide text-muted-foreground border-b">
                          °C
                        </th>
                        <th className="text-right p-2 text-xs uppercase tracking-wide text-muted-foreground border-b">
                          {currentSubTab.unit}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.table.map((row) => (
                        <tr key={row.temp} className="border-b border-border/50">
                          <td className="p-2 font-mono">{row.temp}</td>
                          <td className="p-2 text-right font-mono">{row.value.toFixed(4)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <Thermometer className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-sm">{t("enter_data_calculate")}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      {result && (
        <Card className="border-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold uppercase tracking-wide">{valueLabel}</CardTitle>
          </CardHeader>
          <CardContent>
            <ViscosityChart
              data={result.chartData}
              experimentalPoints={result.experimental}
              xLabel={t("table_temp")}
              yLabel={valueLabel}
            />
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
              <p className="text-muted-foreground">{t("tip_temp")}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
