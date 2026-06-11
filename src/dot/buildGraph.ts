import { MultiGraph } from 'graphology'
import type { ModelNodeAttrs, RelationEdgeAttrs } from '../types'
import { RELATION_KIND_META } from '../types'
import { makePalette } from '../sigma/palette'
import { classifyEdge, inheritanceTypeFromLabel } from './edgeKind'
import { parseClusterLabel, parseModelLabel, parsePlainLabel } from './htmlLabel'
import type { ParsedDot } from './parseDot'

export type ModelGraph = MultiGraph<ModelNodeAttrs, RelationEdgeAttrs>

/** Spread for parallel edges between the same node pair: 0.15, -0.15, 0.3, -0.3, ... */
function curvatureFor(index: number): number {
  const step = Math.ceil((index + 1) / 2) * 0.15
  return index % 2 === 0 ? step : -step
}

export function buildGraph(parsed: ParsedDot): ModelGraph {
  const graph: ModelGraph = new MultiGraph()
  const palette = makePalette()

  for (const raw of parsed.nodes) {
    const parsedLabel = raw.label
      ? raw.htmlLabel
        ? parseModelLabel(raw.label)
        : parsePlainLabel(raw.label)
      : { modelName: raw.id, fields: [], isAbstract: false }
    const app = raw.cluster ?? null
    const appLabel = app
      ? parseClusterLabel(parsed.clusterLabels.get(app) ?? '') || app.replace(/^cluster_/, '')
      : '(ungrouped)'

    const attrs: ModelNodeAttrs = {
      label: parsedLabel.modelName,
      app,
      appLabel,
      fields: parsedLabel.fields,
      isAbstract: parsedLabel.isAbstract,
      color: palette(app),
      size: 3,
      x: 0,
      y: 0,
    }

    if (!graph.hasNode(raw.id)) {
      graph.addNode(raw.id, attrs)
    } else {
      // graph_models re-declares edge targets as header-only stubs outside their
      // cluster; keep the declaration with fields and a real cluster.
      const existing = graph.getNodeAttributes(raw.id)
      if (attrs.fields.length > existing.fields.length) {
        graph.mergeNodeAttributes(raw.id, {
          label: attrs.label,
          fields: attrs.fields,
          isAbstract: attrs.isAbstract,
        })
      }
      if (existing.app === null && app !== null) {
        graph.mergeNodeAttributes(raw.id, { app, appLabel, color: attrs.color })
      }
    }
  }

  for (const raw of parsed.edges) {
    // Edges may reference nodes never declared (defensive for hand-written dot)
    for (const id of [raw.source, raw.target]) {
      if (!graph.hasNode(id)) {
        graph.addNode(id, {
          label: id, app: null, appLabel: '(ungrouped)', fields: [],
          isAbstract: false, color: palette(null), size: 3, x: 0, y: 0,
        })
      }
    }
    const kind = classifyEdge(raw.attrs)
    const fieldLabel = (raw.attrs.label ?? '').trim()
    const attrs: RelationEdgeAttrs = {
      kind,
      fieldLabel: kind === 'inheritance' ? '' : fieldLabel,
      inheritanceType: kind === 'inheritance' ? inheritanceTypeFromLabel(fieldLabel) : undefined,
      type: 'arrow',
      color: RELATION_KIND_META[kind].color,
      size: kind === 'm2m' ? 1.4 : 1,
    }
    graph.addEdge(raw.source, raw.target, attrs)
  }

  // Degree-based node sizes (hubs read larger) and curvature for parallel edges.
  graph.forEachNode((node) => {
    graph.setNodeAttribute(node, 'size', 3 + Math.sqrt(graph.degree(node)))
  })
  assignParallelCurvature(graph)

  return graph
}

function assignParallelCurvature(graph: ModelGraph): void {
  const seen = new Map<string, string[]>()
  graph.forEachEdge((edge, _attrs, source, target) => {
    const key = source < target ? `${source}|${target}` : `${target}|${source}`
    const list = seen.get(key)
    if (list) list.push(edge)
    else seen.set(key, [edge])
  })
  for (const edges of seen.values()) {
    if (edges.length < 2) continue
    edges.forEach((edge, i) => {
      graph.mergeEdgeAttributes(edge, { type: 'curvedArrow', curvature: curvatureFor(i) })
    })
  }
}
