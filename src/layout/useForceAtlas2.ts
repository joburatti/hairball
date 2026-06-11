import { useEffect, useRef } from 'react'
import FA2Layout from 'graphology-layout-forceatlas2/worker'
import noverlap from 'graphology-layout-noverlap'
import { useStore } from '../state/store'
import { makeFa2Settings, layoutBudgetMs } from './fa2Settings'

/**
 * Owns the FA2 worker supervisor for the current graph. Auto-starts on graph
 * load with a time budget, exposes start/stop/tidy; kills the worker whenever
 * the graph is replaced (the supervisor would otherwise keep an orphan worker).
 */
export function useForceAtlas2() {
  const graph = useStore((s) => s.graph)
  const graphVersion = useStore((s) => s.graphVersion)
  const linLog = useStore((s) => s.linLog)
  const layoutRef = useRef<FA2Layout | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!graph) return
    const setLayoutStatus = useStore.getState().setLayoutStatus

    const layout = new FA2Layout(graph, { settings: makeFa2Settings(graph, linLog) })
    layoutRef.current = layout

    layout.start()
    setLayoutStatus('running')
    timerRef.current = setTimeout(() => {
      layout.stop()
      setLayoutStatus('stopped')
    }, layoutBudgetMs(graph.order))

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      layout.kill()
      layoutRef.current = null
      setLayoutStatus('idle')
    }
    // linLog change rebuilds the supervisor with new settings
  }, [graph, graphVersion, linLog])

  const toggle = () => {
    const layout = layoutRef.current
    if (!layout) return
    if (timerRef.current) clearTimeout(timerRef.current)
    if (layout.isRunning()) {
      layout.stop()
      useStore.getState().setLayoutStatus('stopped')
    } else {
      layout.start()
      useStore.getState().setLayoutStatus('running')
      timerRef.current = setTimeout(() => {
        layout.stop()
        useStore.getState().setLayoutStatus('stopped')
      }, layoutBudgetMs(graph?.order ?? 0))
    }
  }

  const tidy = () => {
    if (!graph) return
    const layout = layoutRef.current
    if (layout?.isRunning()) {
      layout.stop()
      useStore.getState().setLayoutStatus('stopped')
    }
    noverlap.assign(graph, { maxIterations: 50, settings: { margin: 2, ratio: 1.2 } })
  }

  return { toggle, tidy }
}
