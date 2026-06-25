import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav.jsx'

// Conteneur mobile-first : contenu défilant + barre de navigation basse.
export default function AppLayout() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-slate-50">
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
