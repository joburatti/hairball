export type RelationKind = 'fk' | 'm2m' | 'o2o' | 'inheritance' | 'generic' | 'unknown'

export interface FieldInfo {
  name: string
  type: string
  /** Bold in graph_models output: primary key or relation field */
  isKeyOrRelation: boolean
  /** Italic in graph_models output: inherited from an abstract base */
  isAbstract: boolean
  /** Gray in graph_models output: blank=True */
  isBlank: boolean
}

export interface ModelNodeAttrs {
  label: string
  /** Cluster id the node was declared in (e.g. "cluster_myapp_models"), null if ungrouped */
  app: string | null
  /** Human-readable app label from the cluster's HTML label */
  appLabel: string
  fields: FieldInfo[]
  isAbstract: boolean
  color: string
  size: number
  x: number
  y: number
}

export interface RelationEdgeAttrs {
  kind: RelationKind
  /** Field name from the edge label, e.g. "user" */
  fieldLabel: string
  /** Extra qualifier for inheritance edges: abstract | multi-table | proxy */
  inheritanceType?: string
  type: 'arrow' | 'curvedArrow'
  curvature?: number
  color: string
  size: number
}

/** `color` is the canonical baked (dark-theme) value; `lightColor` is its light-theme twin. */
export const RELATION_KIND_META: Record<RelationKind, { label: string; color: string; lightColor: string }> = {
  fk: { label: 'FK', color: '#8a8a93', lightColor: '#6e6e78' },
  m2m: { label: 'M2M', color: '#a78bfa', lightColor: '#7c5ce0' },
  o2o: { label: '1:1', color: '#2dd4bf', lightColor: '#0d9488' },
  inheritance: { label: 'inherits', color: '#60a5fa', lightColor: '#2563eb' },
  generic: { label: 'generic', color: '#6b6b74', lightColor: '#9a9aa4' },
  unknown: { label: '?', color: '#55555e', lightColor: '#b0b0ba' },
}
