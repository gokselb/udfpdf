// SPDX-License-Identifier: Apache-2.0
import { createRequire } from 'module'
import { join, dirname } from 'path'
import type { DocumentModel, Paragraph, TextRun, Block, Table, TableCell } from '../parser/types.js'
import type { TDocumentDefinitions, Content, TableCell as PdfCell, Style } from 'pdfmake/interfaces.js'

const require = createRequire(import.meta.url)

function mmToPt(mm: number): number {
  return mm / 0.352778
}

function alignMap(a: Paragraph['alignment']): Style['alignment'] {
  if (a === 'justify') return 'justify'
  if (a === 'center') return 'center'
  if (a === 'right') return 'right'
  return 'left'
}

function buildRuns(runs: TextRun[]): Content {
  if (runs.length === 0) return { text: ' ', fontSize: 12 }
  if (runs.length === 1) {
    const r = runs[0]
    return {
      text: r.text || ' ',
      bold: r.bold ?? false,
      italics: r.italic ?? false,
      decoration: r.underline ? 'underline' : undefined,
      fontSize: r.size ?? 12,
      color: r.color ?? '#000000',
    }
  }
  return {
    text: runs.map((r) => ({
      text: r.text || '',
      bold: r.bold ?? false,
      italics: r.italic ?? false,
      decoration: r.underline ? 'underline' : undefined,
      fontSize: r.size ?? 12,
      color: r.color ?? '#000000',
    })) as never,
  }
}

function buildParagraph(p: Paragraph): Content {
  return {
    ...(buildRuns(p.runs) as object),
    alignment: alignMap(p.alignment),
    marginTop: p.spaceAbove > 0 ? p.spaceAbove / 2 : 0,
    marginBottom: p.spaceBelow > 0 ? p.spaceBelow / 2 : 1,
    lineHeight: p.lineSpacing > 0 ? 1 + p.lineSpacing / 12 : 1,
  } as Content
}

function buildCell(cell: TableCell): PdfCell {
  const content: Content[] = cell.paragraphs.length > 0
    ? cell.paragraphs.map(buildParagraph)
    : [{ text: ' ' }]

  return {
    stack: content,
    margin: [4, 3, 4, 3] as [number, number, number, number],
    border: [
      !!(cell.borders & 8),
      !!(cell.borders & 1),
      !!(cell.borders & 2),
      !!(cell.borders & 4),
    ] as [boolean, boolean, boolean, boolean],
    fillColor: cell.background ?? undefined,
    colSpan: cell.colSpan,
    rowSpan: cell.rowSpan,
  }
}

function buildTable(t: Table): Content {
  if (t.rows.length === 0) return { text: '' }
  const colCount = Math.max(...t.rows.map((r) => r.cells.length))

  const body: PdfCell[][] = t.rows.map((row) => {
    const cells = row.cells.map(buildCell)
    while (cells.length < colCount) cells.push({ text: '' })
    return cells
  })

  return {
    table: {
      body,
      widths: Array<'*'>(colCount).fill('*'),
    },
    marginBottom: 4,
  }
}

function buildBlock(block: Block): Content {
  if (block.type === 'paragraph') return buildParagraph(block)
  if (block.type === 'table') return buildTable(block)
  return { text: '' }
}

export async function renderPDF(model: DocumentModel): Promise<Buffer> {
  // Resolve pdfmake's bundled Roboto fonts (covers all Turkish characters)
  const pdfmakePkg = dirname(require.resolve('pdfmake/package.json'))
  const roboto = join(pdfmakePkg, 'fonts', 'Roboto')

  interface PdfMakeServer {
    addFonts(f: Record<string, unknown>): void
    setLocalAccessPolicy(cb: (path: string) => boolean): void
    createPdf(def: TDocumentDefinitions): { getBuffer(): Promise<Buffer> }
  }

  // pdfmake exports a pre-constructed singleton instance
  const pdfm = require('pdfmake') as PdfMakeServer
  // Allow reading the bundled Roboto font files from node_modules
  pdfm.setLocalAccessPolicy(() => true)
  pdfm.addFonts({
    Roboto: {
      normal: join(roboto, 'Roboto-Regular.ttf'),
      bold: join(roboto, 'Roboto-Medium.ttf'),
      italics: join(roboto, 'Roboto-Italic.ttf'),
      bolditalics: join(roboto, 'Roboto-MediumItalic.ttf'),
    },
  })

  const { pageFormat, header, footer, body, metadata } = model
  const { margins } = pageFormat

  const content: Content[] = body.map(buildBlock)

  if (metadata.verificationCode) {
    content.push({
      text: `UYAP Doğrulama Kodu: ${metadata.verificationCode}`,
      fontSize: 8,
      color: '#666666',
      marginTop: 20,
    })
  }

  const docDef: TDocumentDefinitions = {
    pageSize: {
      width: mmToPt(pageFormat.width),
      height: mmToPt(pageFormat.height),
    },
    pageOrientation: pageFormat.orientation === 'landscape' ? 'landscape' : 'portrait',
    pageMargins: [
      mmToPt(margins.left),
      mmToPt(margins.top),
      mmToPt(margins.right),
      mmToPt(margins.bottom),
    ],
    defaultStyle: { font: 'Roboto', fontSize: 12 },
    header: header.length > 0 ? (header.map(buildParagraph) as never) : undefined,
    footer: footer.length > 0 ? (footer.map(buildParagraph) as never) : undefined,
    content,
  }

  return pdfm.createPdf(docDef).getBuffer()
}
