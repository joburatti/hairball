import { useStore, appKey } from '../state/store'
import { themedColor } from '../theme'

export default function AppFilter() {
  const apps = useStore((s) => s.apps)
  const theme = useStore((s) => s.theme)
  const enabledApps = useStore((s) => s.enabledApps)
  const toggleApp = useStore((s) => s.toggleApp)
  const soloApp = useStore((s) => s.soloApp)
  const setAllApps = useStore((s) => s.setAllApps)

  if (apps.length <= 1) return null

  return (
    <div className="app-filter">
      <h3>
        Apps ({apps.length})
        <span className="app-filter__bulk">
          <button className="linkish" onClick={() => setAllApps(true)}>
            all
          </button>
          ·
          <button className="linkish" onClick={() => setAllApps(false)}>
            none
          </button>
        </span>
      </h3>
      <ul>
        {apps.map((a) => (
          <li key={appKey(a.app)}>
            <label>
              <input
                type="checkbox"
                checked={enabledApps.has(appKey(a.app))}
                onChange={() => toggleApp(a.app)}
              />
              <span className="swatch" style={{ background: themedColor(a.color, theme) }} />
              <span className="app-filter__name">{a.label}</span>
              <span className="app-filter__count">{a.count}</span>
            </label>
            <button className="linkish app-filter__only" onClick={() => soloApp(a.app)}>
              only
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
