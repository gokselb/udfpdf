import type { StyleDef } from '../parser/types.js'
import { argbToCSS, alignmentToCSS } from './color.js'

export function buildStyleMap(stylesNode: unknown): Map<string, StyleDef> {
  const map = new Map<string, StyleDef>()
  if (!stylesNode) return map

  const styleArray = Array.isArray(stylesNode)
    ? stylesNode
    : [stylesNode]

  for (const s of styleArray) {
    if (!s || typeof s !== 'object') continue
    const attrs = (s as Record<string, unknown>)['@_'] ?? s
    const name = String((attrs as Record<string, unknown>)['name'] ?? '')
    if (!name) continue

    map.set(name, parseStyleAttrs(attrs as Record<string, unknown>))
  }
  return map
}

export function parseStyleAttrs(attrs: Record<string, unknown>): StyleDef {
  return {
    name: String(attrs['name'] ?? ''),
    resolver: attrs['resolver'] ? String(attrs['resolver']) : undefined,
    family: attrs['family'] ? String(attrs['family']) : undefined,
    size: attrs['size'] !== undefined ? Number(attrs['size']) : undefined,
    bold: attrs['bold'] !== undefined ? String(attrs['bold']) === 'true' : undefined,
    italic: attrs['italic'] !== undefined ? String(attrs['italic']) === 'true' : undefined,
    underline: attrs['underline'] !== undefined ? String(attrs['underline']) === 'true' : undefined,
    foreground: argbToCSS(attrs['foreground'] as number | string | undefined),
    background: argbToCSS(attrs['background'] as number | string | undefined),
    alignment: attrs['Alignment'] !== undefined ? alignmentToCSS(attrs['Alignment'] as number | string) : undefined,
    lineSpacing: attrs['LineSpacing'] !== undefined ? Number(attrs['LineSpacing']) : undefined,
    spaceAbove: attrs['SpaceAbove'] !== undefined ? Number(attrs['SpaceAbove']) : undefined,
    spaceBelow: attrs['SpaceBelow'] !== undefined ? Number(attrs['SpaceBelow']) : undefined,
    leftIndent: attrs['LeftIndent'] !== undefined ? Number(attrs['LeftIndent']) : undefined,
    rightIndent: attrs['RightIndent'] !== undefined ? Number(attrs['RightIndent']) : undefined,
  }
}

export function resolveStyle(
  elementAttrs: Record<string, unknown>,
  styleMap: Map<string, StyleDef>
): StyleDef {
  const resolverName = elementAttrs['resolver'] ? String(elementAttrs['resolver']) : undefined
  const base: StyleDef = resolverName ? (styleMap.get(resolverName) ?? { name: '' }) : { name: '' }
  const element = parseStyleAttrs(elementAttrs)

  return {
    name: element.name || base.name,
    resolver: element.resolver ?? base.resolver,
    family: element.family ?? base.family,
    size: element.size ?? base.size,
    bold: element.bold ?? base.bold,
    italic: element.italic ?? base.italic,
    underline: element.underline ?? base.underline,
    foreground: element.foreground ?? base.foreground,
    background: element.background ?? base.background,
    alignment: element.alignment ?? base.alignment,
    lineSpacing: element.lineSpacing ?? base.lineSpacing,
    spaceAbove: element.spaceAbove ?? base.spaceAbove,
    spaceBelow: element.spaceBelow ?? base.spaceBelow,
    leftIndent: element.leftIndent ?? base.leftIndent,
    rightIndent: element.rightIndent ?? base.rightIndent,
  }
}
