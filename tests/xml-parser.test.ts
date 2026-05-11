import { describe, it, expect } from 'vitest'
import { parseContentXml, parsePropertiesXml } from '../src/parser/xml-parser.js'

const MINIMAL_CONTENT_XML = `<?xml version="1.0" encoding="UTF-8" ?>
<template format_id="1.8">
<content><![CDATA[Hello World]]></content>
<properties>
  <pageFormat mediaSizeName="1" leftMargin="70.866" rightMargin="70.866" topMargin="70.866" bottomMargin="70.866" paperOrientation="1" headerFOffset="14.996" footerFOffset="28.346"/>
</properties>
<elements>
  <paragraph family="Times New Roman" size="12" Alignment="0" SpaceAbove="0.0" SpaceBelow="2.0" LineSpacing="0.0" LeftIndent="0.0" RightIndent="0.0" resolver="default">
    <content family="Times New Roman" size="12" bold="false" startOffset="0" length="11" resolver="default"/>
  </paragraph>
</elements>
<styles>
  <style name="default" family="Times New Roman" size="12" Alignment="0" LineSpacing="0.0" SpaceBelow="2.0" SpaceAbove="0.0" RightIndent="0.0" LeftIndent="0.0"/>
</styles>
</template>`

const MINIMAL_PROPERTIES_XML = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE properties SYSTEM "http://java.sun.com/dtd/properties.dtd">
<properties>
<entry key="uyapdogrulamakodu">TESTCODE</entry>
<entry key="uyapsicil">12345</entry>
</properties>`

describe('parseContentXml', () => {
  it('extracts raw text from CDATA', () => {
    const result = parseContentXml(MINIMAL_CONTENT_XML)
    expect(result.rawText).toBe('Hello World')
  })

  it('extracts page format', () => {
    const result = parseContentXml(MINIMAL_CONTENT_XML)
    expect(result.pageFormat['mediaSizeName']).toBe('1')
    expect(result.pageFormat['leftMargin']).toBe('70.866')
  })

  it('extracts elements node', () => {
    const result = parseContentXml(MINIMAL_CONTENT_XML)
    expect(result.elementsNode).toBeDefined()
    expect(result.elementsNode['paragraph']).toBeDefined()
  })

  it('throws on missing template', () => {
    expect(() => parseContentXml('<root></root>')).toThrow('missing <template>')
  })
})

describe('parsePropertiesXml', () => {
  it('extracts verification code', () => {
    const result = parsePropertiesXml(MINIMAL_PROPERTIES_XML)
    expect(result['uyapdogrulamakodu']).toBe('TESTCODE')
  })

  it('extracts serial number', () => {
    const result = parsePropertiesXml(MINIMAL_PROPERTIES_XML)
    expect(result['uyapsicil']).toBe('12345')
  })

  it('returns empty object for empty input', () => {
    expect(parsePropertiesXml('')).toEqual({})
  })
})
