import { useEffect, useRef } from 'react'
import Sigma from 'sigma'
import { EdgeCurvedArrowProgram } from '@sigma/edge-curve'
import { useStore } from '../state/store'
import { getActiveSigma, setActiveSigma } from './camera'
import { makeEdgeReducer, makeNodeReducer, type ReducerState } from './reducers'

export default function GraphView() {
  const containerRef = useRef<HTMLDivElement>(null)
  const graph = useStore((s) => s.graph)
  const graphVersion = useStore((s) => s.graphVersion)

  useEffect(() => {
    if (!graph || !containerRef.current) return

    const sigma = new Sigma(graph, containerRef.current, {
      defaultEdgeType: 'arrow',
      edgeProgramClasses: { curvedArrow: EdgeCurvedArrowProgram },
      labelRenderedSizeThreshold: 7,
      labelColor: { color: '#d7d7dc' },
      labelFont: 'system-ui, sans-serif',
      labelSize: 12,
      defaultEdgeColor: '#3a3a40',
      zIndex: true,
      minCameraRatio: 0.01,
      maxCameraRatio: 5,
    })
    setActiveSigma(sigma)

    sigma.on('clickNode', ({ node }) => useStore.getState().selectNode(node))
    sigma.on('clickStage', () => useStore.getState().selectNode(null))
    sigma.on('enterNode', ({ node }) => {
      useStore.getState().setHover(node)
      if (containerRef.current) containerRef.current.style.cursor = 'pointer'
    })
    sigma.on('leaveNode', () => {
      useStore.getState().setHover(null)
      if (containerRef.current) containerRef.current.style.cursor = 'default'
    })

    const applyReducers = () => {
      const s = useStore.getState()
      const state: ReducerState = {
        selected: s.selectedNode,
        neighbors: s.selectedNeighbors,
        hovered: s.hoveredNode,
        enabledApps: s.enabledApps,
        allAppsEnabled: s.enabledApps.size >= s.apps.length,
      }
      sigma.setSetting('nodeReducer', makeNodeReducer(state))
      sigma.setSetting('edgeReducer', makeEdgeReducer(state, graph))
      sigma.refresh({ skipIndexation: true })
    }
    applyReducers()

    const unsubscribe = useStore.subscribe((s, prev) => {
      if (
        s.selectedNode !== prev.selectedNode ||
        s.hoveredNode !== prev.hoveredNode ||
        s.enabledApps !== prev.enabledApps
      ) {
        applyReducers()
      }
    })

    return () => {
      unsubscribe()
      if (getActiveSigma() === sigma) setActiveSigma(null)
      sigma.kill()
    }
  }, [graph, graphVersion])

  return <div ref={containerRef} className="graph-view" />
}
