import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { categories, doctors, pharmacies, healthTips } from '../data/demo.js'
import DoctorCard from '../components/DoctorCard.jsx'

function Section({ title, action, children }) {
  return (
    <section className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold text-slate-800">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

export default function Home() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const onlineDoctors = doctors.filter((d) => d.isOnline)
  const onDuty = pharmacies.filter((p) => p.onDuty)

  return (
    <div className="px-4 pt-6">
      <header>
        <p className="text-sm text-slate-500">{t('app.tagline')}</p>
        <h1 className="text-xl font-bold text-slate-800">
          {t('home.greeting', { name: user?.fullName || 'Patient' })}
        </h1>
      </header>

      <div className="mt-4">
        <input
          type="search"
          placeholder={t('home.searchPlaceholder')}
          className="input"
        />
      </div>

      <Section title={t('home.categories')}>
        <div className="grid grid-cols-3 gap-3">
          {categories.map((c) => (
            <div
              key={c.key}
              className="card flex flex-col items-center gap-1 py-3 text-center"
            >
              <span className="text-2xl">{c.icon}</span>
              <span className="text-xs text-slate-600">{t(`categories.${c.key}`)}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title={t('home.onlineDoctors')}
        action={
          <Link to="/doctors" className="text-sm font-medium text-brand-700">
            {t('home.seeAll')}
          </Link>
        }
      >
        <div className="space-y-3">
          {onlineDoctors.map((d) => (
            <DoctorCard key={d.id} doctor={d} />
          ))}
        </div>
      </Section>

      <Section
        title={t('home.onDutyPharmacies')}
        action={
          <Link to="/map" className="text-sm font-medium text-brand-700">
            {t('home.seeAll')}
          </Link>
        }
      >
        <div className="space-y-3">
          {onDuty.map((p) => (
            <div key={p.id} className="card flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-800">{p.name}</p>
                <p className="text-xs text-slate-400">{p.address}</p>
              </div>
              <div className="text-right">
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                  {t('map.onDuty')}
                </span>
                <p className="mt-1 text-xs text-slate-400">
                  {p.distanceKm} {t('common.km')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title={t('home.healthTips')}>
        <div className="space-y-3">
          {healthTips.map((tip) => (
            <div key={tip.id} className="card">
              <span className="text-xs font-medium uppercase text-brand-600">
                {tip.category}
              </span>
              <p className="mt-1 font-medium text-slate-800">{tip.title}</p>
              <p className="mt-1 text-sm text-slate-500">{tip.excerpt}</p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}
