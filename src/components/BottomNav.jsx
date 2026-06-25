import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

// Icônes en trait (style maquette), héritent de currentColor.
const HomeIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V21h14V9.5" />
  </svg>
)
const ChatIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M21 11.5a8.38 8.38 0 0 1-9 8.4 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-4.2A8.38 8.38 0 0 1 12 3a8.5 8.5 0 0 1 9 8.5z" />
  </svg>
)
const MapIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
)
const UserIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </svg>
)

const items = [
  { to: '/', key: 'home', Icon: HomeIcon },
  { to: '/messages', key: 'messages', Icon: ChatIcon },
  { to: '/map', key: 'map', Icon: MapIcon },
  { to: '/profile', key: 'profile', Icon: UserIcon },
]

export default function BottomNav() {
  const { t } = useTranslation()
  return (
    <div className="fixed inset-x-0 bottom-0 z-10 mx-auto flex max-w-md justify-center px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <nav className="flex w-full items-center justify-around rounded-full bg-brand-600 px-4 py-3 shadow-lg shadow-brand-600/30">
        {items.map(({ to, key, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            aria-label={t(`nav.${key}`)}
            className={({ isActive }) =>
              `grid h-10 w-10 place-items-center rounded-full transition ${
                isActive ? 'bg-white text-brand-700' : 'text-white/90'
              }`
            }
          >
            <Icon className="h-6 w-6" />
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
