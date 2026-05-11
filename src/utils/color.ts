// Converts signed 32-bit ARGB integer (Java/UYAP color format) to CSS hex string.
// e.g. -16777216 → "#000000", -1 → "#ffffff", -8355712 → "#808080"
export function argbToCSS(value: number | string | undefined): string | undefined {
  if (value === undefined || value === null) return undefined
  const n = typeof value === 'string' ? parseInt(value, 10) : value
  if (isNaN(n)) return undefined
  // Treat as unsigned 32-bit
  const unsigned = n >>> 0
  const r = (unsigned >> 16) & 0xff
  const g = (unsigned >> 8) & 0xff
  const b = unsigned & 0xff
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

export function alignmentToCSS(code: number | string | undefined): 'left' | 'center' | 'right' | 'justify' {
  const n = typeof code === 'string' ? parseInt(code, 10) : (code ?? 0)
  switch (n) {
    case 1: return 'center'
    case 2: return 'right'
    case 3: return 'justify'
    default: return 'left'
  }
}

// Convert points to mm (1 pt = 0.352778 mm)
export function ptsToMm(pts: number): number {
  return Math.round(pts * 0.352778 * 10) / 10
}
