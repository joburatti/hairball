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

export const RELATION_KIND_META: Record<RelationKind, { label: string; color: string }> = {
  fk: { label: 'FK', color: '#8a8a93' },
  m2m: { label: 'M2M', color: '#a78bfa' },
  o2o: { label: '1:1', color: '#2dd4bf' },
  inheritance: { label: 'inherits', color: '#60a5fa' },
  generic: { label: 'generic', color: '#6b6b74' },
  unknown: { label: '?', color: '#55555e' },
}
