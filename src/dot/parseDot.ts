import parse from 'dotparser'
import type { Attr, Graph, NodeId, Stmt, Subgraph } from 'dotparser'

export interface RawNode {
  id: string
  /** Label text; htmlLabel=true when it was an HTML-like label */
  label?: string
  htmlLabel?: boolean
  cluster?: string
}

export interface RawEdge {
  source: string
  target: string
  attrs: Record<string, string>
}

export interface ParsedDot {
  graphName: string
  nodes: RawNode[]
  edges: RawEdge[]
  /** cluster id → HTML label of the cluster (app name lives in there) */
  clusterLabels: Map<string, string>
}

interface AttrValue {
  value: string
  html: boolean
}

function attrValue(attr: Attr): AttrValue {
  if (typeof attr.eq === 'object' && attr.eq !== null) {
    return { value: String(attr.eq.value), html: attr.eq.html === true }
  }
  return { value: String(attr.eq), html: false }
}

function attrsToRecord(attrs: Attr[]): Record<string, string> {
  const out: Record<string, string> = {}
  for (const a of attrs) out[String(a.id)] = attrValue(a).value
  return out
}

export function parseDotSource(text: string): ParsedDot {
  const graphs: Graph[] = parse(text)
  if (graphs.length === 0) throw new Error('No graph found in file')
  const graph = graphs[0]

  const result: ParsedDot = {
    graphName: String(graph.id ?? ''),
    nodes: [],
    edges: [],
    clusterLabels: new Map(),
  }

  walkStatements(graph.children, undefined, result)
  return result
}

function walkStatements(stmts: Stmt[], cluster: string | undefined, result: ParsedDot): void {
  for (const stmt of stmts) {
    switch (stmt.type) {
      case 'node_stmt': {
        const attrs = stmt.attr_list
        const labelAttr = attrs.find((a) => String(a.id) === 'label')
        const node: RawNode = { id: String(stmt.node_id.id), cluster }
        if (labelAttr) {
          const { value, html } = attrValue(labelAttr)
          node.label = value
          node.htmlLabel = html
        }
        result.nodes.push(node)
        break
      }
      case 'edge_stmt': {
        const attrs = attrsToRecord(stmt.attr_list)
        // An edge statement is a chain (A -> B -> C); emit pairwise edges.
        const endpoints = stmt.edge_list.filter((e): e is NodeId => e.type === 'node_id')
        for (let i = 0; i + 1 < endpoints.length; i++) {
          result.edges.push({
            source: String(endpoints[i].id),
            target: String(endpoints[i + 1].id),
            attrs,
          })
        }
        break
      }
      case 'subgraph': {
        const sub = stmt as Subgraph
        const subId = sub.id !== undefined ? String(sub.id) : undefined
        const isCluster = subId?.startsWith('cluster') ?? false
        const nextCluster = isCluster ? subId : cluster
        if (isCluster && subId) {
          const label = findGraphLabel(sub.children)
          if (label) result.clusterLabels.set(subId, label)
        }
        walkStatements(sub.children, nextCluster, result)
        break
      }
      case 'attr_stmt':
        break
    }
  }
}

function findGraphLabel(stmts: Stmt[]): string | undefined {
  for (const stmt of stmts) {
    if (stmt.type !== 'attr_stmt' || stmt.target !== 'graph') continue
    const labelAttr = stmt.attr_list.find((a) => String(a.id) === 'label')
    if (labelAttr) return attrValue(labelAttr).value
  }
  return undefined
}
