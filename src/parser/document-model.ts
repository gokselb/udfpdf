// SPDX-License-Identifier: Apache-2.0
import type {
  DocumentModel, PageFormat, Paragraph, TextRun, Table, TableRow, TableCell, Block, StyleDef,
} from './types.js'
import { buildStyleMap, resolveStyle } from '../utils/style-resolver.js'
import { argbToCSS, alignmentToCSS, ptsToMm } from '../utils/color.js'

// A4 dimensions in mm
const PAPER_SIZES: Record<number, [number, number]> = {
  1: [210, 297],   // A4
  5: [215.9, 279.4], // Letter
  6: [215.9, 355.6], // Legal
  11: [148, 210],  // A5
}

export function buildDocumentModel(
  rawText: string,
  pageFormat: Record<string, unknown>,
  elementsNode: Record<string, unknown>,
  stylesNode: unknown,
  metadata: { verificationCode: string; serial: string }
): DocumentModel {
  const styleMap = buildStyleMap(stylesNode)

  const sizeCode = parseInt(String(pageFormat['mediaSizeName'] ?? '1'), 10) || 1
  const orientation = String(pageFormat['paperOrientation'] ?? '1') === '0' ? 'landscape' : 'portrait'
  const [baseW, baseH] = PAPER_SIZES[sizeCode] ?? PAPER_SIZES[1]
  const [width, height] = orientation === 'landscape' ? [baseH, baseW] : [baseW, baseH]

  const pf: PageFormat = {
    mediaSizeName: sizeCode,
    width,
    height,
    margins: {
      top: ptsToMm(parseFloat(String(pageFormat['topMargin'] ?? '70.866'))),
      bottom: ptsToMm(parseFloat(String(pageFormat['bottomMargin'] ?? '70.866'))),
      left: ptsToMm(parseFloat(String(pageFormat['leftMargin'] ?? '70.866'))),
      right: ptsToMm(parseFloat(String(pageFormat['rightMargin'] ?? '70.866'))),
    },
    orientation,
    headerOffset: ptsToMm(parseFloat(String(pageFormat['headerFOffset'] ?? '14.996'))),
    footerOffset: ptsToMm(parseFloat(String(pageFormat['footerFOffset'] ?? '28.346'))),
  }

  const header: Paragraph[] = []
  const footer: Paragraph[] = []
  const body: Block[] = []

  // Process top-level element children
  const entries = Object.entries(elementsNode)

  for (const [tag, value] of entries) {
    const items = Array.isArray(value) ? value : [value]
    for (const item of items) {
      if (!item || typeof item !== 'object') continue
      if (tag === 'header') {
        const paras = extractParagraphsFromContainer(item as Record<string, unknown>, rawText, styleMap)
        header.push(...paras)
      } else if (tag === 'footer') {
        const paras = extractParagraphsFromContainer(item as Record<string, unknown>, rawText, styleMap)
        footer.push(...paras)
      } else if (tag === 'paragraph') {
        const para = buildParagraph(item as Record<string, unknown>, rawText, styleMap)
        body.push(para)
      } else if (tag === 'table') {
        const table = buildTable(item as Record<string, unknown>, rawText, styleMap)
        body.push(table)
      }
    }
  }

  return { pageFormat: pf, metadata, header, footer, body, rawText }
}

function extractParagraphsFromContainer(
  container: Record<string, unknown>,
  rawText: string,
  styleMap: Map<string, StyleDef>
): Paragraph[] {
  const paras: Paragraph[] = []
  const paragraphNodes = container['paragraph']
  if (!paragraphNodes) return paras
  const items = Array.isArray(paragraphNodes) ? paragraphNodes : [paragraphNodes]
  for (const p of items) {
    paras.push(buildParagraph(p as Record<string, unknown>, rawText, styleMap))
  }
  return paras
}

function buildParagraph(
  node: Record<string, unknown>,
  rawText: string,
  styleMap: Map<string, StyleDef>
): Paragraph {
  const style = resolveStyle(node, styleMap)

  const runs: TextRun[] = []

  // Collect leaf nodes: content, field, space
  const leafTypes = ['content', 'field', 'space']
  for (const leafType of leafTypes) {
    const leafNodes = node[leafType]
    if (!leafNodes) continue
    const items = Array.isArray(leafNodes) ? leafNodes : [leafNodes]
    for (const leaf of items) {
      const run = buildTextRun(leaf as Record<string, unknown>, rawText, styleMap)
      if (run) runs.push(run)
    }
  }

  // Sort runs by startOffset so text is in document order
  runs.sort((a, b) => {
    const aOff = (a as unknown as { _offset: number })['_offset'] ?? 0
    const bOff = (b as unknown as { _offset: number })['_offset'] ?? 0
    return aOff - bOff
  })

  return {
    type: 'paragraph',
    runs,
    alignment: style.alignment ?? 'left',
    spaceAbove: style.spaceAbove ?? 0,
    spaceBelow: style.spaceBelow ?? 0,
    lineSpacing: style.lineSpacing ?? 0,
    leftIndent: style.leftIndent ?? 0,
    rightIndent: style.rightIndent ?? 0,
    tabSet: node['TabSet'] ? String(node['TabSet']) : undefined,
  }
}

function buildTextRun(
  node: Record<string, unknown>,
  rawText: string,
  styleMap: Map<string, StyleDef>
): (TextRun & { _offset: number }) | null {
  const startOffset = parseInt(String(node['startOffset'] ?? '0'), 10)
  const length = parseInt(String(node['length'] ?? '0'), 10)
  if (isNaN(startOffset) || isNaN(length) || length === 0) return null

  // UDF offsets are Unicode rune-based (codepoint indices, not char indices)
  const text = runeSubstring(rawText, startOffset, length)
  if (!text) return null

  const style = resolveStyle(node, styleMap)

  return {
    text,
    bold: style.bold,
    italic: style.italic,
    underline: style.underline,
    size: style.size,
    family: style.family,
    color: style.foreground,
    background: style.background,
    _offset: startOffset,
  } as TextRun & { _offset: number }
}

// Extract a substring by Unicode codepoint offset and length
function runeSubstring(str: string, start: number, length: number): string {
  const codePoints = [...str]
  return codePoints.slice(start, start + length).join('')
}

function buildTable(
  node: Record<string, unknown>,
  rawText: string,
  styleMap: Map<string, StyleDef>
): Table {
  const rows: TableRow[] = []
  const rowNodes = node['row']
  if (rowNodes) {
    const items = Array.isArray(rowNodes) ? rowNodes : [rowNodes]
    for (const row of items) {
      rows.push(buildTableRow(row as Record<string, unknown>, rawText, styleMap))
    }
  }

  return {
    type: 'table',
    rows,
    width: node['width'] ? Number(node['width']) : undefined,
  }
}

function buildTableRow(
  node: Record<string, unknown>,
  rawText: string,
  styleMap: Map<string, StyleDef>
): TableRow {
  const cells: TableCell[] = []
  const cellNodes = node['cell']
  if (cellNodes) {
    const items = Array.isArray(cellNodes) ? cellNodes : [cellNodes]
    for (const cell of items) {
      cells.push(buildTableCell(cell as Record<string, unknown>, rawText, styleMap))
    }
  }
  return { cells, height: node['height'] ? Number(node['height']) : undefined }
}

function buildTableCell(
  node: Record<string, unknown>,
  rawText: string,
  styleMap: Map<string, StyleDef>
): TableCell {
  const paragraphs = extractParagraphsFromContainer(node, rawText, styleMap)

  return {
    paragraphs,
    borders: node['borders'] !== undefined ? Number(node['borders']) : 15,
    colSpan: node['colSpan'] ? Number(node['colSpan']) : undefined,
    rowSpan: node['rowSpan'] ? Number(node['rowSpan']) : undefined,
    width: node['width'] ? Number(node['width']) : undefined,
    foreground: argbToCSS(node['foreground'] as number | string | undefined),
    background: argbToCSS(node['background'] as number | string | undefined),
  }
}
