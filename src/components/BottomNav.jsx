import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const items = [
  { to: '/', key: 'home', icon: '🏠' },
  { to: '/doctors', key: 'doctors', icon: '👨‍⚕️' },
  { to: '/map', key: 'map', icon: '🗺️' },
  { to: '/profile', key: 'profile', icon: '👤' },
]

export default function BottomNav() {
  const { t } = useTranslation()
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 mx-auto flex max-w-md justify-around border-t border-slate-200 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-0.5 py-2 text-xs ${
              isActive ? 'text-brand-700' : 'text-slate-400'
            }`
          }
        >
          <span className="text-xl">{item.icon}</span>
          {t(`nav.${item.key}`)}
        </NavLink>
      ))}
    </nav>
  )
}
