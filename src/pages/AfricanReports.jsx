import { useState, useCallback } from 'react'
import { useFetch } from '../hooks/useFetch.js'
import { useAuth } from '../hooks/useAuth.js'
import {
  fetchReports,
  fetchReportStats,
  fetchReportCountries,
  triggerPipeline,
  fetchPipelineJobs,
} from '../services/reportsApi.js'

const CATEGORIES = [
  { value: '',              label: 'Toutes catégories' },
  { value: 'health',        label: 'Santé' },
  { value: 'economy',       label: 'Économie' },
  { value: 'education',     label: 'Éducation' },
  { value: 'humanitarian',  label: 'Humanitaire' },
  { value: 'environment',   label: 'Environnement' },
  { value: 'other',         label: 'Autre' },
]

const SOURCES = [
  { value: '',           label: 'Toutes sources' },
  { value: 'worldbank',  label: 'Banque Mondiale' },
  { value: 'who',        label: 'OMS / GHO' },
  { value: 'reliefweb',  label: 'ReliefWeb' },
  { value: 'afdb',       label: 'BAD (Afr. Dev. Bank)' },
  { value: 'manual',     label: 'Manuel' },
]

const CATEGORY_COLORS = {
  health:       'bg-green-100 text-green-800',
  economy:      'bg-blue-100 text-blue-800',
  education:    'bg-purple-100 text-purple-800',
  humanitarian: 'bg-orange-100 text-orange-800',
  environment:  'bg-teal-100 text-teal-800',
  other:        'bg-slate-100 text-slate-600',
}

const CATEGORY_LABELS = {
  health: 'Santé', economy: 'Économie', education: 'Éducation',
  humanitarian: 'Humanitaire', environment: 'Environnement', other: 'Autre',
}

const SOURCE_LABELS = {
  worldbank: 'Banque Mondiale', who: 'OMS', reliefweb: 'ReliefWeb', afdb: 'BAD', manual: 'Manuel',
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short' })
}

// ─── Composants ──────────────────────────────────────────────────────────────

function StatCard({ label, value, sub }) {
  return (
    <div className="rounded-2xl bg-white shadow-sm border border-slate-100 p-4 flex flex-col gap-1">
      <span className="text-2xl font-bold text-brand-700">{value ?? '—'}</span>
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {sub && <span className="text-xs text-slate-400">{sub}</span>}
    </div>
  )
}

function ReportCard({ report, onSelect }) {
  const catColor = CATEGORY_COLORS[report.category] ?? CATEGORY_COLORS.other
  return (
    <button
      onClick={() => onSelect(report)}
      className="text-left w-full rounded-2xl bg-white shadow-sm border border-slate-100 p-4 hover:border-brand-300 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${catColor}`}>
          {CATEGORY_LABELS[report.category] ?? report.category}
        </span>
        <span className="text-xs text-slate-400 shrink-0">{formatDate(report.reportedAt)}</span>
      </div>
      <p className="text-sm font-semibold text-slate-800 line-clamp-2 mb-1">{report.title}</p>
      {report.description && (
        <p className="text-xs text-slate-500 line-clamp-2">{report.description}</p>
      )}
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        <span className="text-xs text-slate-500">🌍 {report.countryName}</span>
        <span className="text-xs text-slate-400">·</span>
        <span className="text-xs text-slate-500">{SOURCE_LABELS[report.source] ?? report.source}</span>
      </div>
    </button>
  )
}

function ReportDetail({ report, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="float-right text-slate-400 hover:text-slate-700 text-xl leading-none">✕</button>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[report.category] ?? CATEGORY_COLORS.other}`}>
          {CATEGORY_LABELS[report.category] ?? report.category}
        </span>
        <h2 className="text-base font-bold text-slate-800 mt-3 mb-1">{report.title}</h2>
        <div className="flex gap-3 text-xs text-slate-500 mb-3 flex-wrap">
          <span>🌍 {report.countryName}</span>
          <span>📅 {formatDate(report.reportedAt)}</span>
          <span>🔗 {SOURCE_LABELS[report.source] ?? report.source}</span>
        </div>
        {report.description && (
          <p className="text-sm text-slate-600 mb-4 whitespace-pre-wrap">{report.description}</p>
        )}
        {report.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {report.tags.map(tag => (
              <span key={tag} className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{tag}</span>
            ))}
          </div>
        )}
        <a
          href={report.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-brand-600 font-medium hover:underline"
        >
          Voir la source originale →
        </a>
      </div>
    </div>
  )
}

function PipelinePanel({ onRun }) {
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState(null)
  const { data: jobs } = useFetch(fetchPipelineJobs)

  async function handleRun() {
    setRunning(true)
    setResult(null)
    try {
      const r = await onRun()
      setResult({ ok: true, msg: r.message })
    } catch {
      setResult({ ok: false, msg: 'Erreur lors du déclenchement' })
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
      <h3 className="text-sm font-bold text-slate-700 mb-3">Pipeline de collecte</h3>
      <button
        onClick={handleRun}
        disabled={running}
        className="btn-primary text-sm py-2 px-4 rounded-xl disabled:opacity-50"
      >
        {running ? 'Démarrage…' : '▶ Lancer la collecte'}
      </button>
      {result && (
        <p className={`mt-2 text-xs ${result.ok ? 'text-green-600' : 'text-red-600'}`}>{result.msg}</p>
      )}
      {jobs?.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold text-slate-500 mb-2">Derniers jobs</p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {jobs.slice(0, 10).map(job => (
              <div key={job.id} className="text-xs bg-slate-50 rounded-xl px-3 py-2 flex justify-between">
                <span className={`font-medium ${job.status === 'done' ? 'text-green-600' : job.status === 'error' ? 'text-red-600' : 'text-amber-600'}`}>
                  {job.status === 'done' ? '✓' : job.status === 'error' ? '✗' : '⟳'} {job.source}
                </span>
                <span className="text-slate-400">{job.published ?? 0} publiés · {formatDate(job.startedAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function AfricanReports() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [filters, setFilters] = useState({ country: '', category: '', source: '', q: '', page: 1 })
  const [selected, setSelected] = useState(null)
  const [tab, setTab] = useState('reports') // 'reports' | 'stats' | 'pipeline'

  const fetchReportsMemo = useCallback(
    () => fetchReports({ ...filters, limit: 20 }),
    [filters]
  )
  const { data: reportsData, loading: reportsLoading } = useFetch(fetchReportsMemo, [filters])
  const { data: stats } = useFetch(fetchReportStats)
  const { data: countries } = useFetch(fetchReportCountries)

  const reports = reportsData?.reports ?? []
  const totalPages = reportsData?.pages ?? 1

  function setFilter(key, value) {
    setFilters(f => ({ ...f, [key]: value, page: 1 }))
  }

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">🌍</span>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Rapports africains</h1>
          <p className="text-xs text-slate-500">Données, études et rapports des 54 pays d'Afrique</p>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex gap-2 mb-4 border-b border-slate-100 pb-2">
        {[
          { id: 'reports', label: 'Rapports' },
          { id: 'stats', label: 'Statistiques' },
          ...(isAdmin ? [{ id: 'pipeline', label: 'Pipeline' }] : []),
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`text-sm px-3 py-1 rounded-full font-medium transition-colors ${tab === t.id ? 'bg-brand-600 text-white' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Onglet Rapports ── */}
      {tab === 'reports' && (
        <>
          {/* Filtres */}
          <div className="grid grid-cols-2 gap-2 mb-4 sm:grid-cols-4">
            <input
              type="search"
              placeholder="Rechercher…"
              value={filters.q}
              onChange={e => setFilter('q', e.target.value)}
              className="col-span-2 sm:col-span-1 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
            />
            <select
              value={filters.country}
              onChange={e => setFilter('country', e.target.value)}
              className="rounded-xl border border-slate-200 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
            >
              <option value="">Tous les pays</option>
              {(countries ?? []).map(c => (
                <option key={c.code} value={c.code}>{c.name} ({c.total})</option>
              ))}
            </select>
            <select
              value={filters.category}
              onChange={e => setFilter('category', e.target.value)}
              className="rounded-xl border border-slate-200 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
            >
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <select
              value={filters.source}
              onChange={e => setFilter('source', e.target.value)}
              className="rounded-xl border border-slate-200 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
            >
              {SOURCES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          {/* Résultats */}
          {reportsLoading ? (
            <div className="py-16 text-center text-slate-400">Chargement…</div>
          ) : reports.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <p className="text-4xl mb-2">📭</p>
              <p className="text-sm">Aucun rapport trouvé.</p>
              <p className="text-xs mt-1">Lancez le pipeline pour collecter les données.</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-slate-400 mb-3">{reportsData?.total ?? 0} résultats</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {reports.map(r => <ReportCard key={r.id} report={r} onSelect={setSelected} />)}
              </div>
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  <button
                    disabled={filters.page <= 1}
                    onClick={() => setFilter('page', filters.page - 1)}
                    className="px-3 py-1 rounded-xl border text-sm disabled:opacity-40"
                  >← Préc.</button>
                  <span className="px-3 py-1 text-sm text-slate-500">{filters.page} / {totalPages}</span>
                  <button
                    disabled={filters.page >= totalPages}
                    onClick={() => setFilter('page', filters.page + 1)}
                    className="px-3 py-1 rounded-xl border text-sm disabled:opacity-40"
                  >Suiv. →</button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ── Onglet Statistiques ── */}
      {tab === 'stats' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatCard label="Rapports publiés" value={stats?.total} />
            <StatCard label="Pays couverts" value={stats?.countries} sub="54 pays africains" />
            <StatCard label="Sources actives" value={stats ? Object.keys(stats.bySource ?? {}).length : null} />
          </div>

          {stats?.byCategory && (
            <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
              <h3 className="text-sm font-bold text-slate-700 mb-3">Par catégorie</h3>
              <div className="space-y-2">
                {Object.entries(stats.byCategory).map(([cat, count]) => (
                  <div key={cat} className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium w-28 text-center ${CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.other}`}>
                      {CATEGORY_LABELS[cat] ?? cat}
                    </span>
                    <div className="flex-1 bg-slate-100 rounded-full h-2">
                      <div
                        className="bg-brand-500 h-2 rounded-full"
                        style={{ width: `${Math.min(100, (count / (stats.total || 1)) * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500 w-8 text-right">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stats?.bySource && (
            <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
              <h3 className="text-sm font-bold text-slate-700 mb-3">Par source</h3>
              <div className="space-y-2">
                {Object.entries(stats.bySource).map(([src, count]) => (
                  <div key={src} className="flex justify-between text-sm">
                    <span className="text-slate-600">{SOURCE_LABELS[src] ?? src}</span>
                    <span className="font-semibold text-slate-800">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stats?.latestJob && (
            <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
              <h3 className="text-sm font-bold text-slate-700 mb-2">Dernière collecte</h3>
              <div className="text-xs text-slate-500 space-y-1">
                <p>Démarrée : {formatDate(stats.latestJob.startedAt)}</p>
                <p>Collectés : {stats.latestJob.fetched} · Vérifiés : {stats.latestJob.verified} · Publiés : {stats.latestJob.published}</p>
                <p>Statut : <span className={stats.latestJob.status === 'done' ? 'text-green-600' : stats.latestJob.status === 'error' ? 'text-red-600' : 'text-amber-600'}>
                  {stats.latestJob.status}
                </span></p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Onglet Pipeline (admin seulement) ── */}
      {tab === 'pipeline' && isAdmin && (
        <PipelinePanel onRun={triggerPipeline} />
      )}

      {/* Modal détail */}
      {selected && <ReportDetail report={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
