import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../hooks/useAuth.js'
import { updateProfile } from '../services/resources.js'

const languages = [
  { code: 'fr', label: 'Français' },
  { code: 'moore', label: 'Mooré' },
]

export default function Profile() {
  const { t, i18n } = useTranslation()
  const { user, logout, updateUser } = useAuth()
  const [name, setName] = useState(user?.fullName || '')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function saveName(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const updated = await updateProfile({ fullName: name })
      updateUser(updated)
      setEditing(false)
    } catch (err) {
      // En mode démo, on met simplement à jour localement.
      if (user?.demo) {
        updateUser({ fullName: name })
        setEditing(false)
      } else {
        setError(err.message)
      }
    } finally {
      setSaving(false)
    }
  }

  async function changeLanguage(code) {
    i18n.changeLanguage(code)
    try {
      await updateProfile({ preferredLanguage: code })
    } catch {
      // ignoré en mode démo
    }
  }

  return (
    <div className="px-4 pt-6">
      <h1 className="text-xl font-bold text-slate-800">{t('profile.title')}</h1>

      <div className="card mt-4 flex items-center gap-3">
        <div className="grid h-14 w-14 place-items-center rounded-full bg-brand-100 text-xl font-semibold text-brand-700">
          {(user?.fullName || 'P')[0].toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          {editing ? (
            <form onSubmit={saveName} className="flex gap-2">
              <input
                className="input py-2"
                value={name}
                onChange={(e) => setName(e.target.value)}
                minLength={2}
                required
              />
              <button type="submit" className="btn-primary px-3 py-2" disabled={saving}>
                {saving ? '…' : t('record.save')}
              </button>
            </form>
          ) : (
            <>
              <p className="truncate font-medium text-slate-800">{user?.fullName}</p>
              <p className="truncate text-sm text-slate-500">{user?.email}</p>
            </>
          )}
        </div>
        {!editing && (
          <button
            onClick={() => {
              setName(user?.fullName || '')
              setEditing(true)
            }}
            className="text-sm font-medium text-brand-700"
          >
            {t('profile.edit')}
          </button>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <nav className="card mt-4 divide-y divide-slate-100 p-0">
        <MenuLink to="/appointments" icon="📅" label={t('profile.myAppointments')} />
        <MenuLink to="/medical-record" icon="🩺" label={t('profile.medicalRecord')} />
      </nav>

      <div className="card mt-4">
        <p className="mb-2 text-sm font-medium text-slate-600">{t('profile.language')}</p>
        <div className="flex gap-2">
          {languages.map((lng) => (
            <button
              key={lng.code}
              onClick={() => changeLanguage(lng.code)}
              className={`flex-1 rounded-xl border px-3 py-2 text-sm ${
                i18n.resolvedLanguage === lng.code
                  ? 'border-brand-600 bg-brand-600 text-white'
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

function MenuLink({ to, icon, label }) {
  return (
    <Link to={to} className="flex items-center justify-between px-4 py-3">
      <span className="flex items-center gap-3 text-slate-700">
        <span className="text-xl">{icon}</span>
        {label}
      </span>
      <span className="text-slate-300">›</span>
    </Link>
  )
}
