import type { ModelGraph } from '../dot/buildGraph'

/**
 * Seed positions before ForceAtlas2: each app gets a contiguous angular sector
 * on a circle so the layout starts loosely pre-clustered, with radial jitter to
 * break the symmetric degeneracy of a pure circle.
 */
export function seedPositions(graph: ModelGraph): void {
  const byApp = new Map<string | null, string[]>()
  graph.forEachNode((node, attrs) => {
    const list = byApp.get(attrs.app)
    if (list) list.push(node)
    else byApp.set(attrs.app, [node])
  })

  const order = graph.order
  const radius = Math.sqrt(order) * 10
  let placed = 0
  // deterministic jitter
  let s = 1234567
  const rand = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }

  for (const nodes of byApp.values()) {
    for (const node of nodes) {
      const angle = (placed / order) * 2 * Math.PI
      const r = radius * (0.6 + 0.4 * rand())
      graph.mergeNodeAttributes(node, {
        x: Math.cos(angle) * r,
        y: Math.sin(angle) * r,
      })
      placed++
    }
  }
}
