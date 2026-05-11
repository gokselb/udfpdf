// SPDX-License-Identifier: Apache-2.0
import type { DocumentModel, Paragraph, TextRun, Block, Table } from '../parser/types.js'

function renderRun(run: TextRun): string {
  let text = run.text
  if (run.underline) text = `<u>${text}</u>`
  if (run.bold && run.italic) text = `***${text}***`
  else if (run.bold) text = `**${text}**`
  else if (run.italic) text = `*${text}*`
  return text
}

function renderParagraph(p: Paragraph, inTable = false): string {
  const text = p.runs.map(renderRun).join('').replace(/\n/g, ' ').trim()
  if (!text) return inTable ? '' : ''

  // Detect heading: centered, bold, short, likely at document start
  const isHeading = p.alignment === 'center' && p.runs.some((r) => r.bold) && text.length < 80
  if (isHeading && !inTable) return `## ${text.replace(/\*\*/g, '')}`

  return text
}

function renderTable(t: Table): string {
  if (t.rows.length === 0) return ''

  const rows = t.rows.map((row) =>
    '| ' + row.cells.map((cell) => {
      const text = cell.paragraphs.map((p) => renderParagraph(p, true)).filter(Boolean).join(' ')
      return text.replace(/\|/g, '\\|').replace(/\n/g, ' ')
    }).join(' | ') + ' |'
  )

  // Insert separator after first row
  const cols = t.rows[0].cells.length
  const separator = '| ' + Array(cols).fill('---').join(' | ') + ' |'

  return [rows[0], separator, ...rows.slice(1)].join('\n')
}

function renderBlock(block: Block): string {
  if (block.type === 'paragraph') return renderParagraph(block)
  if (block.type === 'table') return renderTable(block)
  return ''
}

export function renderMarkdown(model: DocumentModel): string {
  const { header, footer, body, metadata } = model

  const sections: string[] = []

  if (header.length > 0) {
    const headerText = header.map((p) => renderParagraph(p)).filter(Boolean).join('\n')
    if (headerText) sections.push(headerText)
  }

  const bodyLines: string[] = []
  for (const block of body) {
    const rendered = renderBlock(block)
    if (rendered) bodyLines.push(rendered)
  }
  sections.push(bodyLines.join('\n\n'))

  if (footer.length > 0) {
    const footerText = footer.map((p) => renderParagraph(p)).filter(Boolean).join('\n')
    if (footerText) sections.push(`---\n${footerText}`)
  }

  if (metadata.verificationCode) {
    sections.push(`---\n_UYAP Doğrulama Kodu: ${metadata.verificationCode}_`)
  }

  return sections.filter(Boolean).join('\n\n').replace(/\n{4,}/g, '\n\n\n').trim()
}
