import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { categories, doctors } from '../data/demo.js'
import DoctorCard from '../components/DoctorCard.jsx'

export default function Doctors() {
  const { t } = useTranslation()
  const [filter, setFilter] = useState('all')

  const list = filter === 'all' ? doctors : doctors.filter((d) => d.speciality === filter)

  return (
    <div className="px-4 pt-6">
      <h1 className="text-xl font-bold text-slate-800">{t('doctors.title')}</h1>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
        <Chip active={filter === 'all'} onClick={() => setFilter('all')}>
          {t('home.seeAll')}
        </Chip>
        {categories.map((c) => (
          <Chip key={c.key} active={filter === c.key} onClick={() => setFilter(c.key)}>
            {c.icon} {t(`categories.${c.key}`)}
          </Chip>
        ))}
      </div>

      <div className="mt-3 space-y-3">
        {list.map((d) => (
          <DoctorCard key={d.id} doctor={d} />
        ))}
      </div>
    </div>
  )
}

function Chip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-sm ${
        active
          ? 'border-brand-700 bg-brand-700 text-white'
          : 'border-slate-200 bg-white text-slate-600'
      }`}
    >
      {children}
    </button>
  )
}
