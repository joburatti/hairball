import { useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from '../state/store'
import { flyToNode } from '../sigma/camera'

interface SearchEntry {
  id: string
  model: string
  modelLower: string
  app: string
  appLower: string
}

interface Match extends SearchEntry {
  rank: number
}

const MAX_RESULTS = 20

export default function SearchBar() {
  const graph = useStore((s) => s.graph)
  const graphVersion = useStore((s) => s.graphVersion)
  const selectNode = useStore((s) => s.selectNode)
  const setHover = useStore((s) => s.setHover)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const index = useMemo<SearchEntry[]>(() => {
    if (!graph) return []
    return graph.mapNodes((id, attrs) => ({
      id,
      model: attrs.label,
      modelLower: attrs.label.toLowerCase(),
      app: attrs.appLabel,
      appLower: attrs.appLabel.toLowerCase(),
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph, graphVersion])

  const matches = useMemo<Match[]>(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    const out: Match[] = []
    for (const entry of index) {
      let rank: number
      if (entry.modelLower.startsWith(q)) rank = 0
      else if (entry.modelLower.includes(q)) rank = 1
      else if (`${entry.appLower}/${entry.modelLower}`.includes(q)) rank = 2
      else continue
      out.push({ ...entry, rank })
    }
    out.sort((a, b) => a.rank - b.rank || a.model.localeCompare(b.model))
    return out.slice(0, MAX_RESULTS)
  }, [index, query])

  // Global shortcuts: "/" or Ctrl/Cmd+K focus the search box
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const inField = document.activeElement instanceof HTMLInputElement
      if (((e.ctrlKey || e.metaKey) && e.key === 'k') || (e.key === '/' && !inField)) {
        e.preventDefault()
        inputRef.current?.focus()
        inputRef.current?.select()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const pick = (entry: SearchEntry) => {
    selectNode(entry.id)
    flyToNode(entry.id)
    setOpen(false)
    setHover(null)
    inputRef.current?.blur()
  }

  return (
    <div className="search">
      <input
        ref={inputRef}
        value={query}
        placeholder="Search models…  ( / )"
        onChange={(e) => {
          setQuery(e.target.value)
          setActive(0)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            setActive((a) => Math.min(a + 1, matches.length - 1))
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setActive((a) => Math.max(a - 1, 0))
          } else if (e.key === 'Enter' && matches[active]) {
            pick(matches[active])
          } else if (e.key === 'Escape') {
            setQuery('')
            setOpen(false)
            inputRef.current?.blur()
          }
        }}
      />
      {open && matches.length > 0 && (
        <ul className="search__results" role="listbox">
          {matches.map((m, i) => (
            <li
              key={m.id}
              role="option"
              aria-selected={i === active}
              className={i === active ? 'active' : ''}
              onMouseDown={(e) => {
                e.preventDefault()
                pick(m)
              }}
              onMouseEnter={() => {
                setActive(i)
                setHover(m.id)
              }}
              onMouseLeave={() => setHover(null)}
            >
              <span className="search__model">{m.model}</span>
              <span className="search__app">{m.app}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
