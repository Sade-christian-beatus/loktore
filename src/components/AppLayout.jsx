import { Outlet, useLocation } from 'react-router-dom'
import BottomNav from './BottomNav.jsx'

// Conteneur mobile-first : contenu défilant + barre de navigation basse.
export default function AppLayout() {
  const location = useLocation()
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-slate-50">
      <main className="flex-1 overflow-y-auto pb-28">
        {/* La clé relance l'animation d'apparition à chaque changement de page. */}
        <div key={location.pathname} className="fade-in">
          <Outlet />
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
