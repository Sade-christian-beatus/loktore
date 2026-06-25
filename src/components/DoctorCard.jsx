import { useTranslation } from 'react-i18next'

export default function DoctorCard({ doctor, onBook, onMessage }) {
  const { t } = useTranslation()
  const initials = doctor.fullName
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')

  return (
    <div className="card flex items-center gap-3">
      <div className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand-100 font-semibold text-brand-700">
        {initials}
        {doctor.isOnline && (
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-brand-500" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-slate-800">
          {doctor.title} {doctor.fullName}
        </p>
        <p className="truncate text-sm text-slate-500">
          {t(`categories.${doctor.speciality}`)} · ⭐ {doctor.rating}
        </p>
        <p className="truncate text-xs text-slate-400">{doctor.facility}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-brand-700">
          {doctor.fee.toLocaleString('fr-FR')} {t('common.currency')}
        </p>
        <div className="mt-1 flex items-center justify-end gap-1">
          {onMessage && (
            <button
              onClick={() => onMessage(doctor)}
              aria-label="Message"
              className="rounded-lg border border-brand-200 px-2 py-1 text-xs text-brand-700"
            >
              💬
            </button>
          )}
          <button
            onClick={() => onBook?.(doctor)}
            className="rounded-lg bg-brand-600 px-3 py-1 text-xs font-medium text-white"
          >
            {t('home.bookNow')}
          </button>
        </div>
      </div>
    </div>
  )
}
