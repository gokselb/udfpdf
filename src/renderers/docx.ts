import {
  Document, Packer, Paragraph as DocxParagraph, TextRun as DocxTextRun,
  AlignmentType, Table as DocxTable, TableRow as DocxTableRow, TableCell as DocxTableCell,
  WidthType, BorderStyle, ShadingType, HeightRule,
} from 'docx'
import type { DocumentModel, Paragraph, TextRun, Block, Table, TableCell } from '../parser/types.js'

const ALIGNMENT_MAP: Record<string, typeof AlignmentType[keyof typeof AlignmentType]> = {
  left: AlignmentType.LEFT,
  center: AlignmentType.CENTER,
  right: AlignmentType.RIGHT,
  justify: AlignmentType.JUSTIFIED,
}

function halfPoints(pt: number | undefined): number {
  return Math.round((pt ?? 12) * 2)
}

function twips(pt: number): number {
  return Math.round(pt * 20)
}

function hexColor(css: string | undefined): string | undefined {
  if (!css) return undefined
  return css.replace('#', '').toUpperCase()
}

function buildTextRun(run: TextRun): DocxTextRun {
  return new DocxTextRun({
    text: run.text,
    bold: run.bold,
    italics: run.italic,
    underline: run.underline ? {} : undefined,
    size: halfPoints(run.size),
    font: run.family,
    color: hexColor(run.color),
    highlight: undefined,
    shading: run.background
      ? { type: ShadingType.SOLID, color: hexColor(run.background)!, fill: hexColor(run.background)! }
      : undefined,
  })
}

function buildParagraph(p: Paragraph): DocxParagraph {
  return new DocxParagraph({
    alignment: ALIGNMENT_MAP[p.alignment] ?? AlignmentType.LEFT,
    spacing: {
      before: twips(p.spaceAbove),
      after: twips(p.spaceBelow),
      line: p.lineSpacing > 0 ? twips(12 + p.lineSpacing) * 10 : undefined,
    },
    indent: {
      left: p.leftIndent > 0 ? twips(p.leftIndent) : undefined,
      right: p.rightIndent > 0 ? twips(p.rightIndent) : undefined,
    },
    children: p.runs.map(buildTextRun),
  })
}

function noBorder() {
  return { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
}

function solidBorder() {
  return { style: BorderStyle.SINGLE, size: 4, color: '000000' }
}

function buildCell(cell: TableCell): DocxTableCell {
  const b = cell.borders
  return new DocxTableCell({
    children: cell.paragraphs.length > 0
      ? cell.paragraphs.map(buildParagraph)
      : [new DocxParagraph({ children: [] })],
    columnSpan: cell.colSpan,
    rowSpan: cell.rowSpan,
    width: cell.width ? { size: twips(cell.width), type: WidthType.DXA } : undefined,
    shading: cell.background
      ? { type: ShadingType.SOLID, color: hexColor(cell.background)!, fill: hexColor(cell.background)! }
      : undefined,
    borders: {
      top: b & 1 ? solidBorder() : noBorder(),
      right: b & 2 ? solidBorder() : noBorder(),
      bottom: b & 4 ? solidBorder() : noBorder(),
      left: b & 8 ? solidBorder() : noBorder(),
    },
  })
}

function buildTable(t: Table): DocxTable {
  return new DocxTable({
    width: t.width ? { size: twips(t.width), type: WidthType.DXA } : { size: 100, type: WidthType.PERCENTAGE },
    rows: t.rows.map((row) =>
      new DocxTableRow({
        children: row.cells.map(buildCell),
        height: row.height ? { value: twips(row.height), rule: HeightRule.ATLEAST } : undefined,
      })
    ),
  })
}

function buildBlock(block: Block): DocxParagraph | DocxTable {
  if (block.type === 'paragraph') return buildParagraph(block)
  return buildTable(block)
}

export async function renderDOCX(model: DocumentModel): Promise<Buffer> {
  const { header, footer, body, pageFormat } = model
  const { margins } = pageFormat

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              width: twips(pageFormat.width / 0.352778),
              height: twips(pageFormat.height / 0.352778),
              orientation: pageFormat.orientation === 'landscape' ? 'landscape' : 'portrait',
            },
            margin: {
              top: twips(margins.top / 0.352778),
              right: twips(margins.right / 0.352778),
              bottom: twips(margins.bottom / 0.352778),
              left: twips(margins.left / 0.352778),
            },
          },
        },
        headers: header.length > 0
          ? { default: { options: { children: header.map(buildParagraph) } } as never }
          : undefined,
        footers: footer.length > 0
          ? { default: { options: { children: footer.map(buildParagraph) } } as never }
          : undefined,
        children: body.map(buildBlock),
      },
    ],
  })

  return Packer.toBuffer(doc)
}
