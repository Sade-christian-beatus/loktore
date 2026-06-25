import { useAuth } from '../hooks/useAuth.js'
import Home from './Home.jsx'
import DoctorDashboard from './DoctorDashboard.jsx'
import PharmacyDashboard from './PharmacyDashboard.jsx'

// Aiguille l'écran d'accueil selon le rôle de l'utilisateur.
export default function RoleHome() {
  const { user } = useAuth()
  if (user?.role === 'doctor') return <DoctorDashboard />
  if (user?.role === 'facility') return <PharmacyDashboard />
  return <Home />
}
