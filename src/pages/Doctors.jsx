import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { doctors as demoDoctors } from '../data/demo.js'
import { fetchDoctors, createConversation } from '../services/resources.js'
import { useFetch } from '../hooks/useFetch.js'
import DoctorCard from '../components/DoctorCard.jsx'
import BookingModal from '../components/BookingModal.jsx'

// Spécialités proposées en filtres (catalogue statique).
const specialities = [...new Set(demoDoctors.map((d) => d.speciality))]

export default function Doctors() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')
  const [booking, setBooking] = useState(null)
  const [confirmed, setConfirmed] = useState(false)

  // Ouvre (ou retrouve) une conversation avec le médecin, puis y navigue.
  async function startConversation(doctor) {
    try {
      const conv = await createConversation(doctor.id)
      navigate(`/messages/${conv.id}`)
    } catch {
      navigate('/messages')
    }
  }

  const { data, loading } = useFetch(
    () => fetchDoctors(filter === 'all' ? {} : { speciality: filter }),
    [filter],
  )
  const list = data || []

  return (
    <div className="px-4 pt-6">
      <h1 className="text-xl font-bold text-slate-800">{t('doctors.title')}</h1>

      {confirmed && (
        <div className="mt-3 rounded-xl bg-brand-50 px-4 py-2 text-sm text-brand-700">
          {t('booking.success')}
        </div>
      )}

      <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
        <Chip active={filter === 'all'} onClick={() => setFilter('all')}>
          {t('doctors.all')}
        </Chip>
        {specialities.map((s) => (
          <Chip key={s} active={filter === s} onClick={() => setFilter(s)}>
            {t(`categories.${s}`)}
          </Chip>
        ))}
      </div>

      {loading ? (
        <div className="mt-10 flex justify-center">
          <span className="spinner" />
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          {list.map((d) => (
            <DoctorCard key={d.id} doctor={d} onBook={setBooking} onMessage={startConversation} />
          ))}
        </div>
      )}

      {booking && (
        <BookingModal
          doctor={booking}
          onClose={() => setBooking(null)}
          onBooked={() => {
            setBooking(null)
            setConfirmed(true)
          }}
        />
      )}
    </div>
  )
}

function Chip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-sm ${
        active
          ? 'border-brand-600 bg-brand-600 text-white'
          : 'border-slate-200 bg-white text-slate-600'
      }`}
    >
      {children}
    </button>
  )
}
