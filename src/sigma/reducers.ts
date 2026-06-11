import type { Attributes } from 'graphology-types'
import { appKey } from '../state/store'

const DIM_COLOR = '#2a2a2e'

export interface ReducerState {
  selected: string | null
  neighbors: Set<string>
  hovered: string | null
  enabledApps: Set<string>
  allAppsEnabled: boolean
}

export function makeNodeReducer(state: ReducerState) {
  const { selected, neighbors, hovered, enabledApps, allAppsEnabled } = state
  return (node: string, data: Attributes): Attributes => {
    if (!allAppsEnabled && !enabledApps.has(appKey(data.app ?? null))) {
      return { ...data, hidden: true }
    }
    if (node === hovered && node !== selected) {
      return { ...data, highlighted: true, zIndex: 2 }
    }
    if (selected) {
      if (node === selected) {
        return { ...data, highlighted: true, size: data.size * 1.4, zIndex: 3 }
      }
      if (neighbors.has(node)) {
        return { ...data, forceLabel: true, zIndex: 2 }
      }
      return { ...data, color: DIM_COLOR, label: null, zIndex: 0 }
    }
    return data
  }
}

export function makeEdgeReducer(state: ReducerState, graph: { hasExtremity: (edge: string, node: string) => boolean }) {
  const { selected } = state
  return (edge: string, data: Attributes): Attributes => {
    if (selected) {
      if (graph.hasExtremity(edge, selected)) {
        return { ...data, zIndex: 1, size: (data.size ?? 1) + 0.6 }
      }
      return { ...data, hidden: true }
    }
    return data
  }
}
