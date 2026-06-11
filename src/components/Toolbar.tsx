import { useRef } from 'react'
import { useStore } from '../state/store'
import { fitView } from '../sigma/camera'
import { useOpenFile } from './useOpenFile'
import SearchBar from './SearchBar'

interface Props {
  onToggleLayout: () => void
  onTidy: () => void
}

export default function Toolbar({ onToggleLayout, onTidy }: Props) {
  const fileName = useStore((s) => s.fileName)
  const layoutStatus = useStore((s) => s.layoutStatus)
  const linLog = useStore((s) => s.linLog)
  const setLinLog = useStore((s) => s.setLinLog)
  const graph = useStore((s) => s.graph)
  const openFile = useOpenFile()
  const inputRef = useRef<HTMLInputElement>(null)

  const running = layoutStatus === 'running'

  return (
    <div className="toolbar">
      <button onClick={() => inputRef.current?.click()} title="Open another .dot file">
        Open…
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".dot,.gv,text/vnd.graphviz"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void openFile(file)
          e.target.value = ''
        }}
      />
      <button
        onClick={onToggleLayout}
        className={running ? 'toolbar__layout--running' : ''}
        title="Start/stop the force layout"
      >
        {running ? '⏹ Stop layout' : '▶ Layout'}
      </button>
      <button onClick={onTidy} title="Resolve node overlaps">
        Tidy
      </button>
      <button onClick={fitView} title="Reset camera">
        Fit view
      </button>
      <label className="toolbar__check" title="LinLog mode: tighter clusters, slower convergence">
        <input type="checkbox" checked={linLog} onChange={(e) => setLinLog(e.target.checked)} />
        linLog
      </label>
      <SearchBar />
      <span className="toolbar__meta">
        {fileName} · {graph?.order ?? 0} nodes · {graph?.size ?? 0} edges
      </span>
    </div>
  )
}
