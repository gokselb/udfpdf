import { describe, it, expect } from 'vitest'
import type { DocumentModel } from '../src/parser/types.js'
import { renderText } from '../src/renderers/text.js'
import { renderHTML } from '../src/renderers/html.js'
import { renderMarkdown } from '../src/renderers/markdown.js'
import { renderDOCX } from '../src/renderers/docx.js'

function makeModel(overrides: Partial<DocumentModel> = {}): DocumentModel {
  return {
    pageFormat: {
      mediaSizeName: 1,
      width: 210,
      height: 297,
      margins: { top: 25, right: 25, bottom: 25, left: 25 },
      orientation: 'portrait',
      headerOffset: 5,
      footerOffset: 10,
    },
    metadata: { verificationCode: 'TESTCODE', serial: '99999' },
    rawText: 'Hello\nWorld',
    header: [],
    footer: [],
    body: [
      {
        type: 'paragraph',
        runs: [
          { text: 'Hello', bold: true, size: 12, family: 'Times New Roman' },
          { text: ' World', bold: false, size: 12, family: 'Times New Roman' },
        ],
        alignment: 'left',
        spaceAbove: 0,
        spaceBelow: 2,
        lineSpacing: 0,
        leftIndent: 0,
        rightIndent: 0,
      },
    ],
    ...overrides,
  }
}

describe('renderText', () => {
  it('returns raw text content', () => {
    const model = makeModel()
    const result = renderText(model)
    expect(result).toContain('Hello')
    expect(result).toContain('World')
  })

  it('normalizes excessive blank lines', () => {
    const model = makeModel({ rawText: 'A\n\n\n\n\nB' })
    const result = renderText(model)
    expect(result).not.toMatch(/\n{4,}/)
  })
})

describe('renderHTML', () => {
  it('produces valid HTML structure', () => {
    const model = makeModel()
    const html = renderHTML(model)
    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('<html lang="tr">')
    expect(html).toContain('</html>')
  })

  it('includes document content', () => {
    const model = makeModel()
    const html = renderHTML(model)
    expect(html).toContain('Hello')
    expect(html).toContain('World')
  })

  it('includes UYAP verification code', () => {
    const model = makeModel()
    const html = renderHTML(model)
    expect(html).toContain('TESTCODE')
  })

  it('applies bold styling', () => {
    const model = makeModel()
    const html = renderHTML(model)
    expect(html).toContain('font-weight: bold')
  })

  it('sets correct page size in @page CSS', () => {
    const model = makeModel()
    const html = renderHTML(model)
    expect(html).toContain('210mm 297mm')
  })
})

describe('renderMarkdown', () => {
  it('wraps bold text with **', () => {
    const model = makeModel()
    const md = renderMarkdown(model)
    expect(md).toContain('**Hello**')
  })

  it('includes plain text', () => {
    const model = makeModel()
    const md = renderMarkdown(model)
    expect(md).toContain('World')
  })

  it('includes UYAP code in footer', () => {
    const model = makeModel()
    const md = renderMarkdown(model)
    expect(md).toContain('TESTCODE')
  })

  it('renders table with GFM syntax', () => {
    const model = makeModel({
      body: [
        {
          type: 'table',
          rows: [
            {
              cells: [
                {
                  paragraphs: [{ type: 'paragraph', runs: [{ text: 'Col A' }], alignment: 'left', spaceAbove: 0, spaceBelow: 0, lineSpacing: 0, leftIndent: 0, rightIndent: 0 }],
                  borders: 15,
                },
                {
                  paragraphs: [{ type: 'paragraph', runs: [{ text: 'Col B' }], alignment: 'left', spaceAbove: 0, spaceBelow: 0, lineSpacing: 0, leftIndent: 0, rightIndent: 0 }],
                  borders: 15,
                },
              ],
            },
          ],
        },
      ],
    })
    const md = renderMarkdown(model)
    expect(md).toContain('| Col A | Col B |')
    expect(md).toContain('| --- | --- |')
  })
})

describe('renderDOCX', () => {
  it('produces a non-empty buffer', async () => {
    const model = makeModel()
    const buf = await renderDOCX(model)
    expect(buf).toBeInstanceOf(Buffer)
    expect(buf.length).toBeGreaterThan(1000)
  })

  it('buffer starts with PK (ZIP/DOCX magic bytes)', async () => {
    const model = makeModel()
    const buf = await renderDOCX(model)
    expect(buf[0]).toBe(0x50) // 'P'
    expect(buf[1]).toBe(0x4b) // 'K'
  })
})
