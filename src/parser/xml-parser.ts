import { XMLParser } from 'fast-xml-parser'

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  cdataPropName: '__cdata',
  allowBooleanAttributes: true,
  parseAttributeValue: false,
  trimValues: false,
  isArray: (name) =>
    ['style', 'paragraph', 'table', 'row', 'cell', 'content', 'field', 'space', 'header', 'footer'].includes(name),
})

export interface ParsedContent {
  rawText: string
  pageFormat: Record<string, unknown>
  elementsNode: Record<string, unknown>
  stylesNode: unknown
}

export function parseContentXml(xml: string): ParsedContent {
  const doc = parser.parse(xml) as Record<string, unknown>
  const template = doc['template'] as Record<string, unknown>

  if (!template) {
    throw new Error('Invalid content.xml: missing <template> root element')
  }

  // Extract raw text from CDATA
  const contentNode = template['content']
  let rawText = ''
  if (Array.isArray(contentNode)) {
    rawText = String((contentNode[0] as Record<string, unknown>)['__cdata'] ?? '')
  } else if (contentNode && typeof contentNode === 'object') {
    rawText = String((contentNode as Record<string, unknown>)['__cdata'] ?? '')
  } else if (typeof contentNode === 'string') {
    rawText = contentNode
  }

  // Page format
  const properties = template['properties'] as Record<string, unknown> | undefined
  const pageFormat = (properties?.['pageFormat'] as Record<string, unknown>) ?? {}

  // Elements tree
  const elementsNode = (template['elements'] as Record<string, unknown>) ?? {}

  // Styles
  const stylesNode = (template['styles'] as Record<string, unknown>)?.['style']

  return { rawText, pageFormat, elementsNode, stylesNode }
}

export function parsePropertiesXml(xml: string): Record<string, string> {
  if (!xml) return {}
  const doc = parser.parse(xml) as Record<string, unknown>
  const properties = doc['properties'] as Record<string, unknown> | undefined
  const entries = properties?.['entry']
  if (!entries) return {}

  const result: Record<string, string> = {}
  const arr = Array.isArray(entries) ? entries : [entries]
  for (const entry of arr) {
    const e = entry as Record<string, unknown>
    const key = String(e['key'] ?? '')
    const value = String(e['#text'] ?? e['__cdata'] ?? '')
    if (key) result[key] = value
  }
  return result
}
