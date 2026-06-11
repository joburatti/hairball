import { useEffect, useState, type DragEvent } from 'react'
import { useStore } from './state/store'
import { useForceAtlas2 } from './layout/useForceAtlas2'
import GraphView from './sigma/GraphView'
import DropZone from './components/DropZone'
import { useOpenFile } from './components/useOpenFile'
import Toolbar from './components/Toolbar'
import Sidebar from './components/Sidebar'

function ErrorToast() {
  const parseError = useStore((s) => s.parseError)
  const clearError = useStore((s) => s.clearError)
  useEffect(() => {
    if (!parseError) return
    const t = setTimeout(clearError, 8000)
    return () => clearTimeout(t)
  }, [parseError, clearError])
  if (!parseError) return null
  return (
    <div className="toast" onClick={clearError}>
      <strong>Could not parse file:</strong> {parseError}
    </div>
  )
}

export default function App() {
  const graph = useStore((s) => s.graph)
  const openFile = useOpenFile()
  const { toggle, tidy } = useForceAtlas2()
  const [dragging, setDragging] = useState(false)

  // Allow dropping a replacement file onto the loaded view too
  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) void openFile(file)
  }

  if (!graph) {
    return (
      <>
        <DropZone />
        <ErrorToast />
      </>
    )
  }

  return (
    <div
      className="app"
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      <Toolbar onToggleLayout={toggle} onTidy={tidy} />
      <div className="app__main">
        <GraphView />
        <Sidebar />
      </div>
      {dragging && <div className="drop-overlay">Drop to load</div>}
      <ErrorToast />
    </div>
  )
}
