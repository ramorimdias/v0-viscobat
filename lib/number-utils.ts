export const parseNumericInput = (value: string): number => {
  const normalized = value.replace(/,/g, ".").trim()
  const parsed = Number.parseFloat(normalized)
  return Number.isNaN(parsed) ? Number.NaN : parsed
}
