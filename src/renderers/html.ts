// SPDX-License-Identifier: Apache-2.0
import type { DocumentModel, Paragraph, TextRun, Block, Table, TableCell } from '../parser/types.js'

function ptsToPx(pts: number): number {
  return Math.round(pts * 1.3333)
}

function mmToPx(mm: number): number {
  return Math.round(mm * 3.7795)
}

function styleForParagraph(p: Paragraph): string {
  const parts: string[] = [
    `text-align: ${p.alignment}`,
    `margin-top: ${ptsToPx(p.spaceAbove)}px`,
    `margin-bottom: ${ptsToPx(p.spaceBelow)}px`,
  ]
  if (p.leftIndent > 0) parts.push(`padding-left: ${ptsToPx(p.leftIndent)}px`)
  if (p.rightIndent > 0) parts.push(`padding-right: ${ptsToPx(p.rightIndent)}px`)
  if (p.lineSpacing > 0) parts.push(`line-height: ${1 + p.lineSpacing / 12}`)
  return parts.join('; ')
}

function styleForRun(r: TextRun): string {
  const parts: string[] = []
  if (r.bold) parts.push('font-weight: bold')
  if (r.italic) parts.push('font-style: italic')
  if (r.underline) parts.push('text-decoration: underline')
  if (r.size) parts.push(`font-size: ${r.size}pt`)
  if (r.family) parts.push(`font-family: "${r.family}", "Noto Serif", serif`)
  if (r.color) parts.push(`color: ${r.color}`)
  if (r.background) parts.push(`background: ${r.background}`)
  return parts.join('; ')
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;')
}

function renderParagraph(p: Paragraph): string {
  if (p.runs.length === 0) return '<p>&nbsp;</p>'
  const runsHtml = p.runs.map((r) => {
    const s = styleForRun(r)
    const text = escapeHtml(r.text)
    return s ? `<span style="${s}">${text}</span>` : text
  }).join('')
  return `<p style="${styleForParagraph(p)}">${runsHtml}</p>`
}

function borderStyle(borders: number): string {
  // bitmask: top=1, right=2, bottom=4, left=8 (adjust if format differs)
  const top = borders & 1 ? '1px solid #000' : 'none'
  const right = borders & 2 ? '1px solid #000' : 'none'
  const bottom = borders & 4 ? '1px solid #000' : 'none'
  const left = borders & 8 ? '1px solid #000' : 'none'
  return `border-top:${top}; border-right:${right}; border-bottom:${bottom}; border-left:${left};`
}

function renderCell(cell: TableCell): string {
  const style = [
    borderStyle(cell.borders),
    'padding: 4px 6px',
    'vertical-align: top',
    cell.width ? `width: ${cell.width}pt` : '',
    cell.background ? `background: ${cell.background}` : '',
  ].filter(Boolean).join('; ')

  const colSpan = cell.colSpan ? ` colspan="${cell.colSpan}"` : ''
  const rowSpan = cell.rowSpan ? ` rowspan="${cell.rowSpan}"` : ''
  const content = cell.paragraphs.map(renderParagraph).join('')
  return `<td style="${style}"${colSpan}${rowSpan}>${content}</td>`
}

function renderTable(t: Table): string {
  const style = `border-collapse: collapse; width: ${t.width ? t.width + 'pt' : '100%'}`
  const rows = t.rows.map((row) => {
    const rowStyle = row.height ? `height: ${row.height}pt` : ''
    const cells = row.cells.map(renderCell).join('')
    return `<tr${rowStyle ? ` style="${rowStyle}"` : ''}>${cells}</tr>`
  }).join('\n')
  return `<table style="${style}">\n${rows}\n</table>`
}

function renderBlock(block: Block): string {
  if (block.type === 'paragraph') return renderParagraph(block)
  if (block.type === 'table') return renderTable(block)
  return ''
}

export function renderHTML(model: DocumentModel): string {
  const { pageFormat, header, footer, body } = model
  const { margins } = pageFormat

  const pageStyle = [
    `margin: ${mmToPx(margins.top)}px ${mmToPx(margins.right)}px ${mmToPx(margins.bottom)}px ${mmToPx(margins.left)}px`,
    'font-family: "Times New Roman", "Noto Serif", serif',
    'font-size: 12pt',
    'line-height: 1.4',
    'color: #000',
    'background: #fff',
  ].join('; ')

  const headerHtml = header.length > 0
    ? `<div class="doc-header">${header.map(renderParagraph).join('')}</div>`
    : ''

  const footerHtml = footer.length > 0
    ? `<div class="doc-footer">${footer.map(renderParagraph).join('')}</div>`
    : ''

  const bodyHtml = body.map(renderBlock).join('\n')

  const verCode = model.metadata.verificationCode
  const metaHtml = verCode
    ? `<div class="uyap-meta" style="font-size:9pt; color:#666; margin-top:24px; border-top:1px solid #ccc; padding-top:8px;">UYAP Doğrulama Kodu: ${escapeHtml(verCode)}</div>`
    : ''

  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>UYAP Belgesi</title>
<style>
  @page { size: ${pageFormat.width}mm ${pageFormat.height}mm; margin: ${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm; }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 0; background: #e0e0e0; }
  .page { background: #fff; max-width: ${pageFormat.width}mm; margin: 0 auto; padding: 0; box-shadow: 0 2px 8px rgba(0,0,0,.2); }
  .page-content { ${pageStyle}; }
  .doc-header { border-bottom: 1px solid #ccc; margin-bottom: 16px; padding-bottom: 8px; }
  .doc-footer { border-top: 1px solid #ccc; margin-top: 16px; padding-top: 8px; }
  p { margin: 0 0 4px; }
  table { page-break-inside: avoid; }
  @media print { body { background: #fff; } .page { box-shadow: none; } }
</style>
</head>
<body>
<div class="page">
<div class="page-content">
${headerHtml}
${bodyHtml}
${footerHtml}
${metaHtml}
</div>
</div>
</body>
</html>`
}
