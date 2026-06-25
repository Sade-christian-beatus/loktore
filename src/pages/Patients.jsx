import { useTranslation } from 'react-i18next'
import { fetchAppointments } from '../services/resources.js'
import { useFetch } from '../hooks/useFetch.js'

export default function Patients() {
  const { t } = useTranslation()
  const { data, loading } = useFetch(fetchAppointments)
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
          {patients.map((p) => (
            <div key={p.id} className="card flex items-center gap-3">
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
          ))}
        </div>
      )}

      <p className="mt-6 rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-700">
        {t('doctor.recordConsentNotice')}
      </p>
    </div>
  )
}
