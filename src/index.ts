export { extractUdf } from './parser/unzip.js'
export { parseContentXml, parsePropertiesXml } from './parser/xml-parser.js'
export { buildDocumentModel } from './parser/document-model.js'
export type { DocumentModel, PageFormat, Paragraph, TextRun, Table, Block } from './parser/types.js'
export { renderText } from './renderers/text.js'
export { renderHTML } from './renderers/html.js'
export { renderMarkdown } from './renderers/markdown.js'
export { renderPDF } from './renderers/pdf.js'
export { renderDOCX } from './renderers/docx.js'

import { extractUdf } from './parser/unzip.js'
import { parseContentXml, parsePropertiesXml } from './parser/xml-parser.js'
import { buildDocumentModel } from './parser/document-model.js'
import type { DocumentModel } from './parser/types.js'

export type OutputFormat = 'pdf' | 'docx' | 'html' | 'txt' | 'md'

export async function parseUdf(input: string | Buffer): Promise<DocumentModel> {
  const { contentXml, propertiesXml } = await extractUdf(input)
  const { rawText, pageFormat, elementsNode, stylesNode } = parseContentXml(contentXml)
  const props = parsePropertiesXml(propertiesXml)

  return buildDocumentModel(rawText, pageFormat, elementsNode, stylesNode, {
    verificationCode: props['uyapdogrulamakodu'] ?? '',
    serial: props['uyapsicil'] ?? '',
  })
}

export async function convertUdf(input: string | Buffer, format: OutputFormat): Promise<Buffer | string> {
  const model = await parseUdf(input)

  switch (format) {
    case 'txt': {
      const { renderText } = await import('./renderers/text.js')
      return renderText(model)
    }
    case 'html': {
      const { renderHTML } = await import('./renderers/html.js')
      return renderHTML(model)
    }
    case 'md': {
      const { renderMarkdown } = await import('./renderers/markdown.js')
      return renderMarkdown(model)
    }
    case 'pdf': {
      const { renderPDF } = await import('./renderers/pdf.js')
      return renderPDF(model)
    }
    case 'docx': {
      const { renderDOCX } = await import('./renderers/docx.js')
      return renderDOCX(model)
    }
    default:
      throw new Error(`Unsupported format: ${format}`)
  }
}
