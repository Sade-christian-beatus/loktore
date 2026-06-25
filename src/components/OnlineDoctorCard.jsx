import { useTranslation } from 'react-i18next'

const specialityIcon = {
  general: '🩺',
  pediatrics: '👶',
  gynecology: '🌸',
  cardiology: '❤️',
  dentistry: '🦷',
  dermatology: '🧴',
  surgery: '🔬',
}

// Carte "Médecin en ligne" du carrousel d'accueil (cf. maquette).
export default function OnlineDoctorCard({ doctor }) {
  const { t } = useTranslation()
  const initials = doctor.fullName
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')

  return (
    <div className="w-40 shrink-0 overflow-hidden rounded-2xl border-2 border-brand-500 bg-white">
      <div className="relative">
        <div className="grid h-24 place-items-center bg-brand-50 text-2xl font-bold text-brand-600">
          {initials}
        </div>
        <span className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-white text-sm shadow ring-1 ring-brand-200">
          {specialityIcon[doctor.speciality] || '🩺'}
        </span>
        {doctor.isOnline && (
          <span className="absolute left-2 top-2 h-3 w-3 rounded-full border-2 border-white bg-brand-500" />
        )}
      </div>
      <div className="px-2 py-2 text-center">
        <p className="truncate text-sm font-semibold text-slate-800">
          {doctor.title} {doctor.fullName}
        </p>
        <p className="truncate text-xs font-medium italic text-brand-600">
          {t(`categories.${doctor.speciality}`)}
        </p>
      </div>
    </div>
  )
}
