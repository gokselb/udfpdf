import { describe, it, expect } from 'vitest'
import { resolve } from 'path'
import { existsSync } from 'fs'
import { parseUdf } from '../src/index.js'
import { renderText } from '../src/renderers/text.js'
import { renderHTML } from '../src/renderers/html.js'
import { renderMarkdown } from '../src/renderers/markdown.js'
import { renderDOCX } from '../src/renderers/docx.js'

const FIXTURE = resolve(import.meta.dirname, 'fixtures/evrak_13971521883.udf')
const HAS_FIXTURE = existsSync(FIXTURE)

describe.skipIf(!HAS_FIXTURE)('integration: real UDF file', () => {
  it('parses without throwing', async () => {
    const model = await parseUdf(FIXTURE)
    expect(model).toBeDefined()
    expect(model.rawText.length).toBeGreaterThan(100)
  })

  it('extracts correct page format (A4 portrait)', async () => {
    const model = await parseUdf(FIXTURE)
    expect(model.pageFormat.width).toBe(210)
    expect(model.pageFormat.height).toBe(297)
    expect(model.pageFormat.orientation).toBe('portrait')
  })

  it('extracts UYAP metadata', async () => {
    const model = await parseUdf(FIXTURE)
    expect(model.metadata.verificationCode).toBeTruthy()
    expect(model.metadata.serial).toBeTruthy()
  })

  it('extracts Turkish court content', async () => {
    const model = await parseUdf(FIXTURE)
    // The fixture is an Ankara 13th Criminal Court document
    expect(model.rawText).toMatch(/ANKARA/)
    expect(model.rawText).toMatch(/MAHKEMESİ/)
  })

  it('renders to plain text with Turkish characters', async () => {
    const model = await parseUdf(FIXTURE)
    const text = renderText(model)
    expect(text).toContain('ANKARA')
    expect(text.length).toBeGreaterThan(500)
    // Turkish characters must survive encoding
    expect(text).toMatch(/[ğüşıöçĞÜŞİÖÇ]/)
  })

  it('renders to HTML with proper structure', async () => {
    const model = await parseUdf(FIXTURE)
    const html = renderHTML(model)
    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('ANKARA')
    expect(html.length).toBeGreaterThan(2000)
  })

  it('renders to Markdown with Turkish content', async () => {
    const model = await parseUdf(FIXTURE)
    const md = renderMarkdown(model)
    expect(md).toContain('ANKARA')
    expect(md.length).toBeGreaterThan(200)
  })

  it('renders to DOCX buffer', async () => {
    const model = await parseUdf(FIXTURE)
    const buf = await renderDOCX(model)
    expect(buf).toBeInstanceOf(Buffer)
    expect(buf.length).toBeGreaterThan(5000)
    // ZIP magic bytes (DOCX is a ZIP)
    expect(buf[0]).toBe(0x50)
    expect(buf[1]).toBe(0x4b)
  })

  it('body contains paragraphs and/or tables', async () => {
    const model = await parseUdf(FIXTURE)
    expect(model.body.length).toBeGreaterThan(0)
    const types = new Set(model.body.map((b) => b.type))
    expect(types.size).toBeGreaterThan(0)
  })
})
