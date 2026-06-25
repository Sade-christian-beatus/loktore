import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { fetchAppointments, fetchConsents, requestConsent } from '../services/resources.js'
import { useFetch } from '../hooks/useFetch.js'

export default function Patients() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [tick, setTick] = useState(0)
  const { data, loading } = useFetch(fetchAppointments)
  const consents = useFetch(fetchConsents, [tick]).data || []
  const appts = data || []

  // Patients distincts issus des rendez-vous du médecin.
  const map = new Map()
  for (const a of appts) {
    if (!map.has(a.patientId)) {
      map.set(a.patientId, { id: a.patientId, name: a.patient?.fullName || '—', count: 0 })
    }
    map.get(a.patientId).count += 1
  }
  const patients = [...map.values()]

  const consentByPatient = Object.fromEntries(consents.map((c) => [c.patientId, c.status]))

  async function ask(patientId) {
    await requestConsent(patientId)
    setTick((n) => n + 1)
  }

  return (
    <div className="px-4 pt-6">
      <h1 className="text-xl font-bold text-slate-800">{t('doctor.myPatients')}</h1>

      {loading ? (
        <div className="mt-10 flex justify-center">
          <span className="spinner" />
        </div>
      ) : patients.length === 0 ? (
        <p className="mt-10 text-center text-sm text-slate-400">{t('doctor.noPatients')}</p>
      ) : (
        <div className="mt-4 space-y-2">
          {patients.map((p) => {
            const status = consentByPatient[p.id]
            return (
              <div key={p.id} className="card">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-brand-100 font-semibold text-brand-700">
                    {p.name[0]}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-800">{p.name}</p>
                    <p className="text-xs text-slate-400">
                      {p.count} {t('doctor.appointmentsCount')}
                    </p>
                  </div>
                </div>
                <div className="mt-3">
                  {status === 'granted' ? (
                    <button
                      onClick={() => navigate(`/patients/${p.id}/record`)}
                      className="w-full rounded-lg bg-brand-600 py-1.5 text-sm font-medium text-white"
                    >
                      {t('consent.viewRecord')}
                    </button>
                  ) : status === 'pending' ? (
                    <p className="text-center text-xs text-amber-600">{t('consent.waiting')}</p>
                  ) : (
                    <button
                      onClick={() => ask(p.id)}
                      className="w-full rounded-lg border border-brand-200 py-1.5 text-sm font-medium text-brand-700"
                    >
                      {t('consent.request')}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
