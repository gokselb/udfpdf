import { describe, it, expect } from 'vitest'
import { argbToCSS, alignmentToCSS, ptsToMm } from '../src/utils/color.js'

describe('argbToCSS', () => {
  it('converts black (-16777216) to #000000', () => {
    expect(argbToCSS(-16777216)).toBe('#000000')
  })

  it('converts white (-1) to #ffffff', () => {
    expect(argbToCSS(-1)).toBe('#ffffff')
  })

  it('converts gray (-8355712) to #808080', () => {
    expect(argbToCSS(-8355712)).toBe('#808080')
  })

  it('returns undefined for undefined input', () => {
    expect(argbToCSS(undefined)).toBeUndefined()
  })

  it('accepts string input', () => {
    expect(argbToCSS('-16777216')).toBe('#000000')
  })
})

describe('alignmentToCSS', () => {
  it('maps 0 to left', () => expect(alignmentToCSS(0)).toBe('left'))
  it('maps 1 to center', () => expect(alignmentToCSS(1)).toBe('center'))
  it('maps 2 to right', () => expect(alignmentToCSS(2)).toBe('right'))
  it('maps 3 to justify', () => expect(alignmentToCSS(3)).toBe('justify'))
  it('defaults unknown to left', () => expect(alignmentToCSS(99)).toBe('left'))
  it('accepts string input', () => expect(alignmentToCSS('2')).toBe('right'))
})

describe('ptsToMm', () => {
  it('converts 70.866 pts to ~25mm (A4 margin)', () => {
    expect(ptsToMm(70.866)).toBeCloseTo(25, 0)
  })

  it('converts 0 pts to 0mm', () => {
    expect(ptsToMm(0)).toBe(0)
  })
})
