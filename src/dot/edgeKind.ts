import type { RelationKind } from '../types'

/**
 * Classify a graph_models edge by its arrow attributes (fingerprints from
 * django-extensions modelviz.py / relation.dot):
 *   OneToOne:    arrowhead=none,   arrowtail=none, dir=both
 *   ForeignKey:  arrowhead=none,   arrowtail=<arrow-shape, default dot>
 *   ManyToMany:  arrowhead=dot,    arrowtail=dot
 *   Generic:     style=dotted, arrowhead=normal, arrowtail=normal
 *   Inheritance: arrowhead=empty,  arrowtail=none
 */
export function classifyEdge(attrs: Record<string, string>): RelationKind {
  const head = attrs.arrowhead ?? ''
  const tail = attrs.arrowtail ?? ''
  const style = attrs.style ?? ''

  if (head === 'empty') return 'inheritance'
  if (style.includes('dotted') && head === 'normal' && tail === 'normal') return 'generic'
  if (head === 'dot' && tail === 'dot') return 'm2m'
  if (head === 'none' && tail === 'none') return 'o2o'
  if (head === 'none' && tail !== '' && tail !== 'none') return 'fk' // any --arrow-shape
  return 'unknown'
}

/** "abstract\ninheritance" → "abstract"; non-inheritance labels pass through trimmed. */
export function inheritanceTypeFromLabel(label: string): string | undefined {
  const m = label.match(/(abstract|multi-table|proxy)\s*\n?\s*inheritance/)
  return m?.[1]
}
