import { useTranslation } from 'react-i18next'
import { useAuth } from '../hooks/useAuth.js'

const languages = [
  { code: 'fr', label: 'Français' },
  { code: 'moore', label: 'Mooré' },
]

export default function Profile() {
  const { t, i18n } = useTranslation()
  const { user, logout } = useAuth()

  return (
    <div className="px-4 pt-6">
      <h1 className="text-xl font-bold text-slate-800">{t('profile.title')}</h1>

      <div className="card mt-4 flex items-center gap-3">
        <div className="grid h-14 w-14 place-items-center rounded-full bg-brand-100 text-xl font-semibold text-brand-700">
          {(user?.fullName || 'P')[0].toUpperCase()}
        </div>
        <div>
          <p className="font-medium text-slate-800">{user?.fullName}</p>
          <p className="text-sm text-slate-500">{user?.email}</p>
        </div>
      </div>

      <div className="card mt-4">
        <p className="mb-2 text-sm font-medium text-slate-600">{t('profile.language')}</p>
        <div className="flex gap-2">
          {languages.map((lng) => (
            <button
              key={lng.code}
              onClick={() => i18n.changeLanguage(lng.code)}
              className={`flex-1 rounded-xl border px-3 py-2 text-sm ${
                i18n.resolvedLanguage === lng.code
                  ? 'border-brand-700 bg-brand-700 text-white'
                  : 'border-slate-200 bg-white text-slate-600'
              }`}
            >
              {lng.label}
            </button>
          ))}
        </div>
      </div>

      <button onClick={logout} className="btn-primary mt-6 w-full bg-red-600">
        {t('profile.logout')}
      </button>
    </div>
  )
}
