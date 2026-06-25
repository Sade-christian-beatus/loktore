import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { fetchConversations } from '../services/resources.js'
import { useFetch } from '../hooks/useFetch.js'

export default function Messages() {
  const { t, i18n } = useTranslation()
  const { data, loading } = useFetch(fetchConversations)
  const list = data || []

  const fmt = (d) =>
    new Date(d).toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : undefined, {
      day: '2-digit',
      month: 'short',
    })

  return (
    <div className="px-4 pt-6">
      <h1 className="text-xl font-bold text-slate-800">{t('messages.title')}</h1>

      {loading ? (
        <div className="mt-10 flex justify-center">
          <span className="spinner" />
        </div>
      ) : list.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-2 text-center text-slate-400">
          <span className="text-5xl">💬</span>
          <p>{t('messages.empty')}</p>
          <Link to="/doctors" className="mt-2 text-sm font-medium text-brand-700">
            {t('messages.startHint')}
          </Link>
        </div>
      ) : (
        <div className="mt-4 divide-y divide-slate-100">
          {list.map((c) => (
            <Link
              key={c.id}
              to={`/messages/${c.id}`}
              className="flex items-center gap-3 rounded-lg px-1 py-3 transition active:bg-slate-50"
            >
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-100 font-semibold text-brand-700">
                {(c.other?.fullName || '?')[0]}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-slate-800">{c.other?.fullName}</p>
                <p className="truncate text-sm text-slate-400">
                  {c.lastMessage?.content || '—'}
                </p>
              </div>
              {c.lastMessage && (
                <span className="text-xs text-slate-300">{fmt(c.lastMessage.createdAt)}</span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
