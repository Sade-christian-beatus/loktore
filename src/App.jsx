import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './components/AppLayout.jsx'
import { useAuth } from './hooks/useAuth.js'

// Lazy-loading des pages (cf. plan §2 : navigation avec lazy-loading)
const Login = lazy(() => import('./pages/Login.jsx'))
const Register = lazy(() => import('./pages/Register.jsx'))
const RoleHome = lazy(() => import('./pages/RoleHome.jsx'))
const Doctors = lazy(() => import('./pages/Doctors.jsx'))
const Patients = lazy(() => import('./pages/Patients.jsx'))
const PatientRecord = lazy(() => import('./pages/PatientRecord.jsx'))
const Consents = lazy(() => import('./pages/Consents.jsx'))
const Appointments = lazy(() => import('./pages/Appointments.jsx'))
const MedicalRecord = lazy(() => import('./pages/MedicalRecord.jsx'))
const Messages = lazy(() => import('./pages/Messages.jsx'))
const ConversationThread = lazy(() => import('./pages/ConversationThread.jsx'))
const MapPage = lazy(() => import('./pages/MapPage.jsx'))
const Profile = lazy(() => import('./pages/Profile.jsx'))
const Admin = lazy(() => import('./pages/Admin.jsx'))

function Protected({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-brand-700">
          Chargement…
        </div>
      }
    >
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          element={
            <Protected>
              <AppLayout />
            </Protected>
          }
        >
          <Route path="/" element={<RoleHome />} />
          <Route path="/doctors" element={<Doctors />} />
          <Route path="/patients" element={<Patients />} />
          <Route path="/patients/:id/record" element={<PatientRecord />} />
          <Route path="/consents" element={<Consents />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/medical-record" element={<MedicalRecord />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/:id" element={<ConversationThread />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<Admin />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
