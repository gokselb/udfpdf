import { describe, it, expect } from 'vitest'
import { parseContentXml, parsePropertiesXml } from '../src/parser/xml-parser.js'
import { buildDocumentModel } from '../src/parser/document-model.js'

const TABLE_XML = `<?xml version="1.0" encoding="UTF-8" ?>
<template format_id="1.8">
<content><![CDATA[NameAge ]]></content>
<properties>
  <pageFormat mediaSizeName="1" leftMargin="70.866" rightMargin="70.866" topMargin="70.866" bottomMargin="70.866" paperOrientation="1" headerFOffset="14.996" footerFOffset="28.346"/>
</properties>
<elements>
  <table>
    <row>
      <cell borders="15">
        <paragraph family="Times New Roman" size="12" Alignment="0" SpaceAbove="0.0" SpaceBelow="0.0" LineSpacing="0.0" LeftIndent="0.0" RightIndent="0.0" resolver="default">
          <content family="Times New Roman" size="12" startOffset="0" length="4" resolver="default"/>
        </paragraph>
      </cell>
      <cell borders="15">
        <paragraph family="Times New Roman" size="12" Alignment="0" SpaceAbove="0.0" SpaceBelow="0.0" LineSpacing="0.0" LeftIndent="0.0" RightIndent="0.0" resolver="default">
          <content family="Times New Roman" size="12" startOffset="4" length="3" resolver="default"/>
        </paragraph>
      </cell>
    </row>
  </table>
</elements>
<styles>
  <style name="default" family="Times New Roman" size="12" Alignment="0" LineSpacing="0.0" SpaceBelow="0.0" SpaceAbove="0.0" RightIndent="0.0" LeftIndent="0.0"/>
</styles>
</template>`

const PARAGRAPH_XML = `<?xml version="1.0" encoding="UTF-8" ?>
<template format_id="1.8">
<content><![CDATA[Bold text normal]]></content>
<properties>
  <pageFormat mediaSizeName="1" leftMargin="70.866" rightMargin="70.866" topMargin="70.866" bottomMargin="70.866" paperOrientation="1" headerFOffset="14.996" footerFOffset="28.346"/>
</properties>
<elements>
  <paragraph family="Times New Roman" size="12" Alignment="1" SpaceAbove="4.0" SpaceBelow="2.0" LineSpacing="0.0" LeftIndent="0.0" RightIndent="0.0" resolver="default">
    <content family="Times New Roman" size="12" bold="true" startOffset="0" length="9" resolver="default"/>
    <content family="Times New Roman" size="12" bold="false" startOffset="9" length="7" resolver="default"/>
  </paragraph>
</elements>
<styles>
  <style name="default" family="Times New Roman" size="12" Alignment="0" LineSpacing="0.0" SpaceBelow="2.0" SpaceAbove="0.0" RightIndent="0.0" LeftIndent="0.0"/>
</styles>
</template>`

describe('buildDocumentModel', () => {
  it('builds page format with A4 dimensions', () => {
    const { rawText, pageFormat, elementsNode, stylesNode } = parseContentXml(PARAGRAPH_XML)
    const model = buildDocumentModel(rawText, pageFormat, elementsNode, stylesNode, { verificationCode: '', serial: '' })
    expect(model.pageFormat.width).toBe(210)
    expect(model.pageFormat.height).toBe(297)
    expect(model.pageFormat.orientation).toBe('portrait')
    expect(model.pageFormat.margins.left).toBeCloseTo(25, 0)
  })

  it('extracts paragraph with runs in order', () => {
    const { rawText, pageFormat, elementsNode, stylesNode } = parseContentXml(PARAGRAPH_XML)
    const model = buildDocumentModel(rawText, pageFormat, elementsNode, stylesNode, { verificationCode: '', serial: '' })
    expect(model.body).toHaveLength(1)
    const para = model.body[0]
    expect(para.type).toBe('paragraph')
    if (para.type !== 'paragraph') return
    expect(para.alignment).toBe('center')
    expect(para.runs).toHaveLength(2)
    // "Bold text normal": offset=0, length=9 → "Bold text"
    expect(para.runs[0].text).toBe('Bold text')
    expect(para.runs[0].bold).toBe(true)
    // offset=9, length=7 → " normal"
    expect(para.runs[1].text).toBe(' normal')
    expect(para.runs[1].bold).toBe(false)
  })

  it('extracts table with cells', () => {
    const { rawText, pageFormat, elementsNode, stylesNode } = parseContentXml(TABLE_XML)
    const model = buildDocumentModel(rawText, pageFormat, elementsNode, stylesNode, { verificationCode: '', serial: '' })
    expect(model.body).toHaveLength(1)
    const table = model.body[0]
    expect(table.type).toBe('table')
    if (table.type !== 'table') return
    expect(table.rows).toHaveLength(1)
    expect(table.rows[0].cells).toHaveLength(2)
    // "NameAge ": offset=0,length=4 → "Name"; offset=4,length=3 → "Age"
    expect(table.rows[0].cells[0].paragraphs[0].runs[0].text).toBe('Name')
    expect(table.rows[0].cells[1].paragraphs[0].runs[0].text).toBe('Age')
  })

  it('includes rawText in model', () => {
    const { rawText, pageFormat, elementsNode, stylesNode } = parseContentXml(PARAGRAPH_XML)
    const model = buildDocumentModel(rawText, pageFormat, elementsNode, stylesNode, { verificationCode: '', serial: '' })
    expect(model.rawText).toBe('Bold text normal')
  })
})
