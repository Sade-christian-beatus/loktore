import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { quickAccess, healthTopics } from '../data/demo.js'
import { fetchDoctors, fetchOnDutyPharmacies } from '../services/resources.js'
import { useFetch } from '../hooks/useFetch.js'
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

// Carousel auto-scroll avec défilement fluide et actualisation périodique
function PharmaciesCarousel({ pharmacies, loading }) {
  const scrollRef = useRef(null)
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (!pharmacies.length || !scrollRef.current) return
    const el = scrollRef.current
    const cardWidth = 168 // w-40 + gap-3

    const timer = setInterval(() => {
      setActive((prev) => {
        const next = (prev + 1) % pharmacies.length
        el.scrollTo({ left: next * cardWidth, behavior: 'smooth' })
        return next
      })
    }, 3000)

    return () => clearInterval(timer)
  }, [pharmacies.length])

  if (loading) {
    return (
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="w-40 shrink-0 animate-pulse rounded-xl bg-slate-100 h-14" />
        ))}
      </div>
    )
  }

  if (!pharmacies.length) {
    return <p className="text-sm text-slate-400 py-2">Aucune pharmacie de garde en ce moment.</p>
  }

  return (
    <>
      <div ref={scrollRef} className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 scroll-smooth">
        {pharmacies.map((p, i) => (
          <Link
            key={p.id}
            to="/map"
            className={`w-40 shrink-0 rounded-xl border px-3 py-2 text-center transition ${
              i === active ? 'border-brand-500 bg-brand-50' : 'border-brand-200 bg-white'
            }`}
          >
            <p className="truncate text-sm font-semibold text-slate-800">{p.name}</p>
            <p className="text-xs text-brand-600 font-medium">De garde</p>
            {p.phone && <p className="text-xs text-slate-400 truncate">{p.phone}</p>}
          </Link>
        ))}
      </div>
      {/* Indicateurs de position */}
      <div className="mt-2 flex justify-center gap-1.5">
        {pharmacies.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i === active ? 'w-4 bg-brand-600' : 'w-1.5 bg-brand-200'
            }`}
          />
        ))}
      </div>
    </>
  )
}

// Accès rapides enrichis avec les nouvelles fonctionnalités
const QUICK_ACCESS_EXTENDED = [
  { key: 'pharmacy', icon: '💊', to: '/pharmacies', label: 'Pharmacie' },
  { key: 'search', icon: '🔍', to: '/search-products', label: 'Rechercher' },
  { key: 'analyze', icon: '🩻', to: '/analyze', label: 'Analyser' },
  { key: 'map', icon: '📍', to: '/map', label: 'Carte' },
]

export default function Home() {
  const { t } = useTranslation()
  const { user } = useAuth()

  const onlineDoctors = useFetch(() => fetchDoctors({ online: true })).data || []
  const { data: onDuty, loading: pharmacyLoading, refetch } = useFetch(fetchOnDutyPharmacies)
  const pharmacies = onDuty || []

  const firstName = (user?.fullName || 'Patient').split(' ')[0]

  // Actualise les pharmacies de garde toutes les 5 minutes
  useEffect(() => {
    const timer = setInterval(() => refetch?.(), 5 * 60 * 1000)
    return () => clearInterval(timer)
  }, [refetch])

  return (
    <div className="px-4 pt-4">
      {/* En-tête */}
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
      <Link
        to="/search-products"
        className="mt-4 flex items-center gap-2 rounded-full border border-brand-200 bg-white px-4 py-2.5 shadow-sm"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-brand-500" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <span className="flex-1 text-sm text-slate-400">{t('home.searchPlaceholder')}</span>
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M4 6h16M7 12h10M10 18h4" />
          </svg>
        </span>
      </Link>

      {/* Bannière */}
      <div className="mt-5 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-200 to-brand-100 p-5">
        <h2 className="max-w-[60%] text-lg font-extrabold leading-tight text-slate-800">
          {t('home.priority')}
        </h2>
        <Link to="/doctors" className="mt-3 inline-block rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
          {t('home.talkToDoctor')}
        </Link>
      </div>

      {/* Accès rapides */}
      <div className="mt-5 grid grid-cols-4 gap-2">
        {QUICK_ACCESS_EXTENDED.map((q) => (
          <Link key={q.key} to={q.to} className="flex flex-col items-center gap-1">
            <span className="grid h-14 w-14 place-items-center rounded-full border border-slate-200 bg-white text-2xl shadow-sm">
              {q.icon}
            </span>
            <span className="text-xs text-slate-600 text-center">{q.label}</span>
          </Link>
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

      {/* Pharmacies de garde — auto-scroll */}
      <SectionHeader title={t('home.onDutyPharmacies')} to="/map" />
      <PharmaciesCarousel pharmacies={pharmacies} loading={pharmacyLoading} />

      {/* Analyser un document médical */}
      <div className="mt-6 mb-4">
        <Link
          to="/analyze"
          className="flex items-center gap-4 rounded-2xl bg-gradient-to-r from-slate-700 to-slate-800 p-4 text-white shadow"
        >
          <span className="text-3xl">🩻</span>
          <div>
            <p className="font-bold">Analyser un document médical</p>
            <p className="text-xs text-slate-300 mt-0.5">Ordonnance ou résultat d'examen — explication simple par IA</p>
          </div>
          <svg viewBox="0 0 24 24" className="ml-auto h-5 w-5 shrink-0 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </Link>
      </div>
    </div>
  )
}
