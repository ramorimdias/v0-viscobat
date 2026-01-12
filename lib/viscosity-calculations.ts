/**
 * Walther correlation for viscosity-temperature relationships.
 * x = log10(log10(v + 0.7))
 */

export function walther_x(viscosity: number): number {
  return Math.log10(Math.log10(viscosity + 0.7))
}

export function inverse_walther_x(x: number): number {
  return Math.pow(10, Math.pow(10, x)) - 0.7
}

export function walther_params(v1: number, t1: number, v2: number, t2: number) {
  const x1 = walther_x(v1)
  const x2 = walther_x(v2)
  const y1 = Math.log10(t1 + 273.15)
  const y2 = Math.log10(t2 + 273.15)

  if (Math.abs(y2 - y1) < 1e-12) {
    return { slope: 0, intercept: x1 }
  }

  const slope = (x1 - x2) / (y2 - y1)
  const intercept = x1 + slope * y1
  return { slope, intercept }
}

export function walther_viscosity_at_temp(slope: number, intercept: number, temp_c: number): number {
  const x = intercept - slope * Math.log10(temp_c + 273.15)
  return inverse_walther_x(x)
}

export function compute_vi_from_v40_v100(u: number, y: number): number {
  if (u <= 0 || y <= 0) return Number.NaN

  if (y < 2) {
    const logU = Math.log10(Math.log10(u + 0.7))
    const logY = Math.log10(Math.log10(y + 0.7))
    const AJ5 = Math.pow(10, Math.pow(10, logU + (logU - logY) * 0.04022)) - 0.7
    const AJ6 = Math.pow(10, Math.pow(10, logU + (logU - logY) * 0.98316)) - 0.7
    const numerator = 1.2665 * AJ6 * AJ6 + 1.655 * AJ6 - AJ5
    const denominator = 0.34984 * AJ6 * AJ6 + 0.1725 * AJ6
    if (denominator === 0) return Number.NaN
    return Math.round(((100 * numerator) / denominator) * 10) / 10
  }

  function compute_piece(a: number, b: number): number {
    const c = (100 * (a + b - u)) / b
    if (a <= 0 || u <= 0 || y <= 0) return Number.NaN
    const d = (Math.log(a) - Math.log(u)) / Math.log(y)
    const e = (Math.pow(10, d) - 1) / 0.00715 + 100
    const f = c > 100 ? e : c
    return Math.round(f * 10) / 10
  }

  let a: number, b: number

  if (y < 4) {
    a = 0.827 * y * y + 1.632 * y - 0.181
    b = 0.3094 * y * y + 0.182 * y
  } else if (y < 6.1) {
    a = -2.6758 * y * y + 96.671 * y - 269.664 * Math.pow(y, 0.5) + 215.025
    b = -7.1955 * y * y + 241.992 * y - 725.478 * Math.pow(y, 0.5) + 603.888
  } else if (y < 7.2) {
    a = 2.32 * Math.pow(y, 1.5626)
    b = 2.838 * y * y - 27.35 * y + 81.83
  } else if (y < 12.4) {
    a = 0.1922 * y * y + 8.25 * y - 18.728
    b = 0.5463 * y * y + 2.442 * y - 14.16
  } else if (y < 70) {
    a = 1795.2 / (y * y) + 0.1818 * y * y + 10.357 * y - 54.547
    b = 0.6995 * y * y - 1.19 * y + 7.6
  } else {
    const a0 = 0.835313 * y * y + 14.6731 * y - 216.246
    b = 0.666904 * y * y + 2.8238 * y - 119.298
    a = a0 - b
  }

  return compute_piece(a, b)
}

export function compute_mixture(viscosities: number[], fractions: number[]): number {
  if (viscosities.length !== fractions.length || viscosities.length === 0) {
    return Number.NaN
  }

  const x_values = viscosities.map((v) => {
    if (v <= 0) return Number.NaN
    return walther_x(v)
  })

  if (x_values.some((x) => Number.isNaN(x))) return Number.NaN

  let x_mix = 0
  for (let i = 0; i < fractions.length; i++) {
    x_mix += fractions[i] * x_values[i]
  }

  return inverse_walther_x(x_mix)
}

export function solve_two_bases(
  targetViscosity: number,
  baseAViscosity: number,
  baseBViscosity: number,
  knownComponents: { percent: number; viscosity: number }[],
): { percentA: number; percentB: number } | { error: string } {
  if (targetViscosity <= 0 || baseAViscosity <= 0 || baseBViscosity <= 0) {
    return { error: "Viscosities must be positive" }
  }

  let sum_known = 0
  let x_known_sum = 0

  for (const comp of knownComponents) {
    if (comp.viscosity <= 0) {
      return { error: "Viscosities must be positive" }
    }
    sum_known += comp.percent / 100
    x_known_sum += (comp.percent / 100) * walther_x(comp.viscosity)
  }

  if (sum_known >= 1) {
    return { error: "Sum of known percentages must be less than 100" }
  }

  const x_target = walther_x(targetViscosity)
  const x_A = walther_x(baseAViscosity)
  const x_B = walther_x(baseBViscosity)
  const p_remaining = 1 - sum_known

  const denominator = x_A - x_B
  if (Math.abs(denominator) < 1e-12) {
    return { error: "Base viscosities must be different" }
  }

  let p_A = (x_target - x_known_sum - p_remaining * x_B) / denominator
  let p_B = p_remaining - p_A

  if (p_A < -1e-6 || p_B < -1e-6) {
    return { error: "Impossible to obtain this viscosity with these two bases" }
  }

  if (p_A < 0) p_A = 0
  if (p_B < 0) p_B = 0

  if (p_A + p_B > p_remaining + 1e-6) {
    return { error: "Impossible to obtain this viscosity with these two bases" }
  }

  return {
    percentA: p_A * 100,
    percentB: p_B * 100,
  }
}

export function linear_regression(
  points: { temperature: number; value: number }[],
): { slope: number; intercept: number } | null {
  if (points.length < 2) return null

  const n = points.length
  let sumX = 0,
    sumY = 0,
    sumXY = 0,
    sumX2 = 0

  for (const pt of points) {
    sumX += pt.temperature
    sumY += pt.value
    sumXY += pt.temperature * pt.value
    sumX2 += pt.temperature * pt.temperature
  }

  const denom = n * sumX2 - sumX * sumX
  if (Math.abs(denom) < 1e-12) return null

  const slope = (n * sumXY - sumX * sumY) / denom
  const intercept = (sumY - slope * sumX) / n

  return { slope, intercept }
}

export function walther_regression(
  points: { temperature: number; viscosity: number }[],
): { slope: number; intercept: number } | null {
  if (points.length < 2) return null

  const walther_x_vals: number[] = []
  const walther_y_vals: number[] = []

  for (const pt of points) {
    if (pt.viscosity <= 0 || pt.temperature <= -273.15) continue
    walther_x_vals.push(walther_x(pt.viscosity))
    walther_y_vals.push(Math.log10(pt.temperature + 273.15))
  }

  if (walther_x_vals.length < 2) return null

  // Linear regression: x = intercept + slope_raw * y
  const n = walther_x_vals.length
  let sumX = 0,
    sumY = 0,
    sumXY = 0,
    sumY2 = 0

  for (let i = 0; i < n; i++) {
    sumX += walther_x_vals[i]
    sumY += walther_y_vals[i]
    sumXY += walther_x_vals[i] * walther_y_vals[i]
    sumY2 += walther_y_vals[i] * walther_y_vals[i]
  }

  const denom = n * sumY2 - sumY * sumY
  if (Math.abs(denom) < 1e-12) return null

  const slope_raw = (n * sumXY - sumX * sumY) / denom
  const intercept = (sumX - slope_raw * sumY) / n
  const slope = -slope_raw

  return { slope, intercept }
}

interface SolverComponent {
  viscosity: number
  type: "free" | "range" | "objectiveMin" | "objectiveMax" | "setValue"
  value?: number
  min?: number
  max?: number
  name?: string
}

interface SolverMixture {
  type: "free" | "range" | "objectiveMin" | "objectiveMax" | "setValue"
  value?: number
  min?: number
  max?: number
}

interface SolverResult {
  fractions: Record<number, number>
  viscosity: number
  diagnostics: {
    status: "unique" | "multiple"
    variableRanges: Record<string, { min: number; max: number }>
  }
  error?: string
}

export function solve_complex_blend(
  components: SolverComponent[],
  mixture: SolverMixture,
): SolverResult | { error: string } {
  const n = components.length
  if (n === 0) return { error: "No components supplied" }

  // Validate viscosities
  for (let i = 0; i < n; i++) {
    if (components[i].viscosity <= 0) {
      return { error: `Component ${i + 1} viscosity must be positive` }
    }
  }

  // Check for multiple objectives
  let objectiveCount = 0
  if (mixture.type === "objectiveMin" || mixture.type === "objectiveMax") {
    objectiveCount++
  }
  for (const comp of components) {
    if (comp.type === "objectiveMin" || comp.type === "objectiveMax") {
      objectiveCount++
    }
  }
  if (objectiveCount > 1) {
    return { error: "Multiple objectives not allowed" }
  }

  // Calculate x values for each component
  const x_values = components.map((c) => walther_x(c.viscosity))

  // Separate fixed and variable components
  const fixed: { index: number; fraction: number }[] = []
  const variable: { index: number; lb: number; ub: number; x: number }[] = []
  let fixed_sum = 0
  let fixed_x_contrib = 0

  for (let i = 0; i < n; i++) {
    const comp = components[i]
    if (comp.type === "setValue") {
      const frac = (comp.value ?? 0) / 100
      if (frac < 0 || frac > 1) {
        return { error: `Component ${i + 1} fixed value must be between 0 and 100` }
      }
      fixed.push({ index: i, fraction: frac })
      fixed_sum += frac
      fixed_x_contrib += frac * x_values[i]
    } else {
      let lb = 0,
        ub = 1
      if (comp.type === "range") {
        lb = (comp.min ?? 0) / 100
        ub = (comp.max ?? 100) / 100
        if (lb < 0 || ub > 1 || lb > ub) {
          return { error: `Component ${i + 1} range is invalid` }
        }
      }
      variable.push({ index: i, lb, ub, x: x_values[i] })
    }
  }

  if (fixed_sum > 1 + 1e-9) {
    return { error: "Sum of fixed component fractions exceeds 100%" }
  }

  // If all fixed
  if (variable.length === 0) {
    if (Math.abs(fixed_sum - 1) > 1e-6) {
      return { error: "Sum of fixed components must be exactly 100%" }
    }
    const v_mix = inverse_walther_x(fixed_x_contrib)

    if (mixture.type === "setValue" && mixture.value !== undefined) {
      if (Math.abs(v_mix - mixture.value) > 1e-6) {
        return { error: "Mixture viscosity does not match target value" }
      }
    }
    if (mixture.type === "range" && mixture.min !== undefined && mixture.max !== undefined) {
      if (v_mix < mixture.min - 1e-6 || v_mix > mixture.max + 1e-6) {
        return { error: "Mixture viscosity not within specified range" }
      }
    }

    const fractions: Record<number, number> = {}
    for (const f of fixed) {
      fractions[f.index] = f.fraction * 100
    }

    return {
      fractions,
      viscosity: v_mix,
      diagnostics: {
        status: "unique",
        variableRanges: {},
      },
    }
  }

  // Simple solver for 2-variable case or iterate for solution
  const remaining = 1 - fixed_sum

  // For simple cases, try to find a solution iteratively
  // This is a simplified solver - for complex cases, would need proper LP
  const m = variable.length

  // Check mixture constraint
  let targetX: number | null = null
  let minX: number | null = null
  let maxX: number | null = null

  if (mixture.type === "setValue" && mixture.value !== undefined) {
    targetX = walther_x(mixture.value)
  } else if (mixture.type === "range") {
    if (mixture.min !== undefined) minX = walther_x(mixture.min)
    if (mixture.max !== undefined) maxX = walther_x(mixture.max)
  }

  // Simple solution approach
  const fractions: number[] = new Array(n).fill(0)
  for (const f of fixed) {
    fractions[f.index] = f.fraction
  }

  // For 2 variable components with target viscosity
  if (m === 2 && targetX !== null) {
    const v0 = variable[0]
    const v1 = variable[1]

    // p0 * x0 + p1 * x1 + fixed_x = targetX
    // p0 + p1 = remaining
    // => p0 * x0 + (remaining - p0) * x1 + fixed_x = targetX
    // => p0 * (x0 - x1) = targetX - fixed_x - remaining * x1
    // => p0 = (targetX - fixed_x - remaining * x1) / (x0 - x1)

    const denom = v0.x - v1.x
    if (Math.abs(denom) > 1e-12) {
      let p0 = (targetX - fixed_x_contrib - remaining * v1.x) / denom
      let p1 = remaining - p0

      // Clamp to bounds
      p0 = Math.max(v0.lb, Math.min(v0.ub, p0))
      p1 = Math.max(v1.lb, Math.min(v1.ub, p1))

      // Normalize if needed
      const varSum = p0 + p1
      if (Math.abs(varSum - remaining) > 1e-6 && varSum > 0) {
        const scale = remaining / varSum
        p0 *= scale
        p1 *= scale
      }

      fractions[v0.index] = p0
      fractions[v1.index] = p1
    } else {
      // Equal x values, distribute equally
      const each = remaining / 2
      fractions[v0.index] = Math.max(v0.lb, Math.min(v0.ub, each))
      fractions[v1.index] = Math.max(v1.lb, Math.min(v1.ub, each))
    }
  } else if (m >= 1) {
    // Distribute remaining proportionally or equally
    let allocated = 0
    for (let i = 0; i < m - 1; i++) {
      const v = variable[i]
      const share = remaining / m
      const clamped = Math.max(v.lb, Math.min(v.ub, share))
      fractions[v.index] = clamped
      allocated += clamped
    }
    // Last variable gets the rest
    const last = variable[m - 1]
    const lastShare = Math.max(0, remaining - allocated)
    fractions[last.index] = Math.max(last.lb, Math.min(last.ub, lastShare))
  }

  // Calculate final mixture viscosity
  let x_total = 0
  for (let i = 0; i < n; i++) {
    x_total += fractions[i] * x_values[i]
  }
  const viscosity = inverse_walther_x(x_total)

  // Build result
  const result: Record<number, number> = {}
  for (let i = 0; i < n; i++) {
    result[i] = Math.round(fractions[i] * 10000) / 100
  }

  // Determine variable ranges
  const variableRanges: Record<string, { min: number; max: number }> = {}
  for (const v of variable) {
    variableRanges[String(v.index)] = {
      min: v.lb * 100,
      max: v.ub * 100,
    }
  }

  // Check if unique
  const isUnique = variable.length <= 1 || targetX !== null

  return {
    fractions: result,
    viscosity,
    diagnostics: {
      status: isUnique ? "unique" : "multiple",
      variableRanges,
    },
  }
}
