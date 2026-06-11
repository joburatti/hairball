import type { FieldInfo } from '../types'

export interface ParsedLabel {
  modelName: string
  fields: FieldInfo[]
  isAbstract: boolean
}

function cellText(el: Element): string {
  return (el.textContent ?? '').trim()
}

/**
 * Parse a graph_models HTML-like node label into model name + fields.
 *
 * Expected shape (django-extensions label.dot template):
 *   <TABLE><TR><TD COLSPAN="2"><B>ModelName</B></TD></TR>      header
 *          <TR><TD>field</TD><TD>FieldType</TD></TR>...        one row per field
 * Field markup: <B> = PK/relation, <I> = abstract-inherited, FONT COLOR="#7B7B7B" = blank.
 */
export function parseModelLabel(html: string): ParsedLabel {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const rows = Array.from(doc.querySelectorAll('tr'))
  if (rows.length === 0) {
    return { modelName: html.trim(), fields: [], isAbstract: false }
  }

  const headerText = cellText(rows[0])
  // Header may carry a "<abstract>" / "<proxy>" suffix after a <BR/>
  const isAbstract = /<abstract>/i.test(headerText)
  const modelName = headerText.replace(/<[a-z-]+>/gi, '').trim()

  const fields: FieldInfo[] = []
  for (const row of rows.slice(1)) {
    const cells = row.querySelectorAll('td')
    if (cells.length < 2) continue
    fields.push({
      name: cellText(cells[0]),
      type: cellText(cells[1]),
      isKeyOrRelation: cells[0].querySelector('b') !== null,
      isAbstract: cells[0].querySelector('i') !== null,
      isBlank: cells[0].querySelector('font[color="#7B7B7B"], font[color="#7b7b7b"]') !== null,
    })
  }
  return { modelName, fields, isAbstract }
}

/** Extract the app display name from a cluster's HTML label (text of its <B> tag). */
export function parseClusterLabel(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const bold = doc.querySelector('b')
  const text = (bold ?? doc.body)?.textContent?.trim() ?? ''
  return text
}

/** Fallback for non-graph_models files: plain or record labels. */
export function parsePlainLabel(label: string): ParsedLabel {
  // Record label: take the first segment, strip braces/ports
  const first = label.split('|')[0].replace(/[{}]/g, '').replace(/<[^>]*>/g, '').trim()
  return { modelName: first || label.trim(), fields: [], isAbstract: false }
}
