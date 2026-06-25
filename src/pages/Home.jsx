import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { quickAccess, doctors, pharmacies, healthTopics } from '../data/demo.js'
import OnlineDoctorCard from '../components/OnlineDoctorCard.jsx'

function SectionHeader({ title, to }) {
  const { t } = useTranslation()
  return (
    <div className="mb-3 mt-6 flex items-center justify-between">
      <h2 className="text-lg font-bold text-slate-800">{title}</h2>
      {to && (
        <Link to={to} className="text-sm font-semibold italic text-brand-600">
          {t('home.seeMore')}
        </Link>
      )}
    </div>
  )
}

export default function Home() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const onlineDoctors = doctors.filter((d) => d.isOnline)
  const onDuty = pharmacies.filter((p) => p.onDuty)
  const firstName = (user?.fullName || 'Patient').split(' ')[0]

  return (
    <div className="px-4 pt-4">
      {/* En-tête : menu, notifications, avatar */}
      <header className="flex items-center justify-between">
        <button aria-label="Menu" className="grid h-9 w-9 place-items-center text-slate-700">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 6h18M3 12h12M3 18h18" />
          </svg>
        </button>
        <div className="flex items-center gap-3">
          <button aria-label="Notifications" className="relative grid h-10 w-10 place-items-center rounded-full ring-2 ring-brand-500 text-brand-600">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.7 21a2 2 0 0 1-3.4 0" />
            </svg>
          </button>
          <div className="grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-brand-100 font-semibold text-brand-700 ring-2 ring-brand-500">
            {firstName[0]?.toUpperCase()}
          </div>
        </div>
      </header>

      {/* Salutation */}
      <div className="mt-4">
        <h1 className="text-xl font-bold text-slate-800">
          {t('home.greeting', { name: user?.fullName || 'Patient' })}
        </h1>
        <p className="text-sm text-slate-400">{t('home.question')}</p>
      </div>

      {/* Recherche */}
      <div className="mt-4 flex items-center gap-2 rounded-full border border-brand-200 bg-white px-4 py-2.5 shadow-sm">
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-brand-500" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="search"
          placeholder={t('home.searchPlaceholder')}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
        />
        <button aria-label="Filtres" className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M4 6h16M7 12h10M10 18h4" />
          </svg>
        </button>
      </div>

      {/* Bannière */}
      <div className="mt-5 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-200 to-brand-100 p-5">
        <h2 className="max-w-[60%] text-lg font-extrabold leading-tight text-slate-800">
          {t('home.priority')}
        </h2>
        <button className="mt-3 rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
          {t('home.talkToDoctor')}
        </button>
        <div className="mt-3 flex justify-center gap-1.5">
          <span className="h-1.5 w-4 rounded-full bg-brand-600" />
          <span className="h-1.5 w-1.5 rounded-full bg-brand-300" />
          <span className="h-1.5 w-1.5 rounded-full bg-brand-300" />
          <span className="h-1.5 w-1.5 rounded-full bg-brand-300" />
        </div>
      </div>

      {/* Accès rapides */}
      <div className="mt-5 grid grid-cols-4 gap-2">
        {quickAccess.map((q) => (
          <button key={q.key} className="flex flex-col items-center gap-1">
            <span className="grid h-14 w-14 place-items-center rounded-full border border-slate-200 bg-white text-2xl shadow-sm">
              {q.icon}
            </span>
            <span className="text-xs text-slate-600">{t(`quickAccess.${q.key}`)}</span>
          </button>
        ))}
      </div>

      {/* Médecins en ligne */}
      <SectionHeader title={t('home.onlineDoctors')} to="/doctors" />
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
        {onlineDoctors.map((d) => (
          <OnlineDoctorCard key={d.id} doctor={d} />
        ))}
      </div>

      {/* Astuces & Conseils Santé */}
      <SectionHeader title={t('home.healthTips')} />
      <div className="grid grid-cols-2 gap-3">
        {healthTopics.map((topic) => (
          <button
            key={topic.key}
            className="flex flex-col items-center gap-3 rounded-2xl border-2 border-brand-500 bg-white py-6 text-center"
          >
            <span className="text-4xl text-brand-600">{topic.icon}</span>
            <span className="font-semibold text-slate-700">{t(`topics.${topic.key}`)}</span>
          </button>
        ))}
      </div>

      {/* Pharmacies de garde */}
      <SectionHeader title={t('home.onDutyPharmacies')} to="/map" />
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
        {onDuty.map((p) => (
          <div
            key={p.id}
            className="w-40 shrink-0 rounded-xl border border-brand-500 bg-white px-3 py-2 text-center"
          >
            <p className="truncate text-sm font-semibold text-slate-800">{p.name}</p>
            <p className="text-xs text-slate-500">{p.phone}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
