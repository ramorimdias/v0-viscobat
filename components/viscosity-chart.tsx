"use client"

import { useEffect, useRef } from "react"

interface ChartProps {
  data: { x: number; y: number }[]
  experimentalPoints?: { x: number; y: number }[]
  xLabel?: string
  yLabel?: string
}

export function ViscosityChart({
  data,
  experimentalPoints = [],
  xLabel = "Temperature (°C)",
  yLabel = "Value",
}: ChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height

    ctx.clearRect(0, 0, width, height)

    const allPoints = [...data, ...experimentalPoints].filter(
      (pt) => pt && Number.isFinite(pt.x) && Number.isFinite(pt.y),
    )

    if (allPoints.length === 0) return

    let xMin = Math.min(...allPoints.map((p) => p.x))
    let xMax = Math.max(...allPoints.map((p) => p.x))
    let yMin = Math.min(...allPoints.map((p) => p.y))
    let yMax = Math.max(...allPoints.map((p) => p.y))

    const yRange = yMax - yMin
    const xRange = xMax - xMin

    if (yRange === 0) {
      yMax += 1
    } else {
      yMax += yRange * 0.1
      yMin -= yRange * 0.05
    }

    if (xRange === 0) {
      xMin -= 1
      xMax += 1
    } else {
      xMin -= xRange * 0.05
      xMax += xRange * 0.05
    }

    const marginLeft = 70
    const marginBottom = 50
    const marginTop = 20
    const marginRight = 20
    const plotWidth = width - marginLeft - marginRight
    const plotHeight = height - marginTop - marginBottom

    const xToCanvas = (x: number) => marginLeft + ((x - xMin) / (xMax - xMin || 1)) * plotWidth
    const yToCanvas = (y: number) => marginTop + plotHeight - ((y - yMin) / (yMax - yMin || 1)) * plotHeight

    // Draw axes
    ctx.strokeStyle = "#666"
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(marginLeft, marginTop + plotHeight)
    ctx.lineTo(marginLeft + plotWidth, marginTop + plotHeight)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(marginLeft, marginTop)
    ctx.lineTo(marginLeft, marginTop + plotHeight)
    ctx.stroke()

    // Draw axis labels
    ctx.font = "12px sans-serif"
    ctx.fillStyle = "#666"
    ctx.textAlign = "center"
    ctx.fillText(xLabel, marginLeft + plotWidth / 2, marginTop + plotHeight + 40)

    ctx.save()
    ctx.translate(marginLeft - 55, marginTop + plotHeight / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.textAlign = "center"
    ctx.fillText(yLabel, 0, 0)
    ctx.restore()

    // Draw Y ticks
    const yTicks = getNiceTicks(yMin, yMax, 5)
    yTicks.forEach((tick) => {
      const yC = yToCanvas(tick)
      ctx.strokeStyle = "#e0e0e0"
      ctx.beginPath()
      ctx.moveTo(marginLeft, yC)
      ctx.lineTo(marginLeft + plotWidth, yC)
      ctx.stroke()
      ctx.strokeStyle = "#666"
      ctx.beginPath()
      ctx.moveTo(marginLeft - 5, yC)
      ctx.lineTo(marginLeft, yC)
      ctx.stroke()
      ctx.fillStyle = "#666"
      ctx.textAlign = "right"
      ctx.fillText(tick.toFixed(2), marginLeft - 8, yC + 4)
    })

    // Draw X ticks
    const xTicks = getNiceTicks(xMin, xMax, 6)
    xTicks.forEach((tick) => {
      const xC = xToCanvas(tick)
      ctx.strokeStyle = "#666"
      ctx.beginPath()
      ctx.moveTo(xC, marginTop + plotHeight)
      ctx.lineTo(xC, marginTop + plotHeight + 5)
      ctx.stroke()
      ctx.fillStyle = "#666"
      ctx.textAlign = "center"
      ctx.fillText(tick.toFixed(0), xC, marginTop + plotHeight + 18)
    })

    // Draw line
    ctx.strokeStyle = "#dc2626"
    ctx.lineWidth = 2
    ctx.beginPath()
    data.forEach((pt, idx) => {
      const xC = xToCanvas(pt.x)
      const yC = yToCanvas(pt.y)
      if (idx === 0) {
        ctx.moveTo(xC, yC)
      } else {
        ctx.lineTo(xC, yC)
      }
    })
    ctx.stroke()

    // Draw experimental points
    if (experimentalPoints.length > 0) {
      ctx.strokeStyle = "#dc2626"
      ctx.lineWidth = 2
      experimentalPoints.forEach((pt) => {
        const xC = xToCanvas(pt.x)
        const yC = yToCanvas(pt.y)
        const size = 5
        ctx.beginPath()
        ctx.moveTo(xC - size, yC - size)
        ctx.lineTo(xC + size, yC + size)
        ctx.moveTo(xC - size, yC + size)
        ctx.lineTo(xC + size, yC - size)
        ctx.stroke()
      })
    }
  }, [data, experimentalPoints, xLabel, yLabel])

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={300}
      className="w-full max-w-[600px] mx-auto border border-border rounded"
    />
  )
}

function getNiceTicks(min: number, max: number, numTicks: number): number[] {
  const range = niceNumber(max - min, false)
  const tickSpacing = niceNumber(range / (numTicks - 1), true)
  const niceMin = Math.floor(min / tickSpacing) * tickSpacing
  const niceMax = Math.ceil(max / tickSpacing) * tickSpacing
  const ticks: number[] = []
  for (let x = niceMin; x <= niceMax + 0.5 * tickSpacing; x += tickSpacing) {
    ticks.push(x)
  }
  return ticks
}

function niceNumber(range: number, round: boolean): number {
  const exponent = Math.floor(Math.log10(range))
  const fraction = range / Math.pow(10, exponent)
  let niceFraction: number
  if (round) {
    if (fraction < 1.5) niceFraction = 1
    else if (fraction < 3) niceFraction = 2
    else if (fraction < 7) niceFraction = 5
    else niceFraction = 10
  } else {
    if (fraction <= 1) niceFraction = 1
    else if (fraction <= 2) niceFraction = 2
    else if (fraction <= 5) niceFraction = 5
    else niceFraction = 10
  }
  return niceFraction * Math.pow(10, exponent)
}
