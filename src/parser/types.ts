export interface TextRun {
  text: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
  size?: number
  family?: string
  color?: string
  background?: string
}

export interface Paragraph {
  type: 'paragraph'
  runs: TextRun[]
  alignment: 'left' | 'center' | 'right' | 'justify'
  spaceAbove: number
  spaceBelow: number
  lineSpacing: number
  leftIndent: number
  rightIndent: number
  tabSet?: string
}

export interface TableCell {
  paragraphs: Paragraph[]
  borders: number
  colSpan?: number
  rowSpan?: number
  width?: number
  foreground?: string
  background?: string
}

export interface TableRow {
  cells: TableCell[]
  height?: number
}

export interface Table {
  type: 'table'
  rows: TableRow[]
  width?: number
}

export type Block = Paragraph | Table

export interface PageFormat {
  mediaSizeName: number
  width: number
  height: number
  margins: {
    top: number
    right: number
    bottom: number
    left: number
  }
  orientation: 'portrait' | 'landscape'
  headerOffset: number
  footerOffset: number
}

export interface DocumentMetadata {
  verificationCode: string
  serial: string
}

export interface DocumentModel {
  pageFormat: PageFormat
  metadata: DocumentMetadata
  header: Paragraph[]
  footer: Paragraph[]
  body: Block[]
  rawText: string
}

export interface StyleDef {
  name: string
  resolver?: string
  family?: string
  size?: number
  bold?: boolean
  italic?: boolean
  underline?: boolean
  foreground?: string
  background?: string
  alignment?: 'left' | 'center' | 'right' | 'justify'
  lineSpacing?: number
  spaceAbove?: number
  spaceBelow?: number
  leftIndent?: number
  rightIndent?: number
}

export interface RawUdfFiles {
  contentXml: string
  propertiesXml: string
  signBuffer: Buffer | null
}
