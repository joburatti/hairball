import { useState } from 'react'
import { useStore } from '../state/store'
import type { Theme } from '../theme'

const OPTIONS: { value: Theme; label: string }[] = [
  { value: 'dark', label: '☾ Dark' },
  { value: 'light', label: '☀ Light' },
]

export default function ThemeMenu() {
  const theme = useStore((s) => s.theme)
  const setTheme = useStore((s) => s.setTheme)
  const [open, setOpen] = useState(false)

  return (
    <div className="theme-menu">
      <button
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false)
        }}
        title="Choose color theme"
      >
        Theme: {theme === 'dark' ? 'Dark' : 'Light'} ▾
      </button>
      {open && (
        <ul className="theme-menu__list" role="listbox">
          {OPTIONS.map((o) => (
            <li
              key={o.value}
              role="option"
              aria-selected={o.value === theme}
              className={o.value === theme ? 'active' : ''}
              onMouseDown={(e) => {
                e.preventDefault()
                setTheme(o.value)
                setOpen(false)
              }}
            >
              {o.label}
              {o.value === theme && <span className="theme-menu__check">✓</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
