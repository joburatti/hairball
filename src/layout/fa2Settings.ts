import forceAtlas2 from 'graphology-layout-forceatlas2'
import type { ModelGraph } from '../dot/buildGraph'

export function makeFa2Settings(graph: ModelGraph, linLog: boolean) {
  const inferred = forceAtlas2.inferSettings(graph)
  return {
    ...inferred,
    barnesHutOptimize: graph.order > 1000,
    strongGravityMode: true,
    gravity: 0.05,
    scalingRatio: 10,
    outboundAttractionDistribution: true,
    slowDown: 1 + Math.log(Math.max(graph.order, 1)),
    edgeWeightInfluence: 0,
    adjustSizes: false,
    linLogMode: linLog,
  }
}

/** Auto-stop budget: small graphs settle in seconds, huge ones cap at 20s. */
export function layoutBudgetMs(order: number): number {
  return Math.min(20_000, Math.max(3_000, 50 * order))
}
