/**
 * Fetcher — collecte des rapports depuis plusieurs sources publiques africaines.
 * Sources : World Bank, WHO GHO, ReliefWeb, African Development Bank Open Data.
 * Toutes ces APIs sont publiques et ne nécessitent pas d'authentification.
 */
import { AFRICAN_COUNTRIES, WB_CODE_MAP, COUNTRY_MAP } from './countries.js'
import { logger } from '../../lib/logger.js'

const TIMEOUT_MS = 15_000

async function fetchJSON(url, options = {}) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, { signal: ctrl.signal, ...options })
    if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`)
    return res.json()
  } finally {
    clearTimeout(timer)
  }
}

// ─── World Bank ──────────────────────────────────────────────────────────────
// Indicateurs santé/économie/éducation pour les 54 pays africains.
const WB_INDICATORS = [
  { id: 'SP.DYN.LE00.IN', label: 'Espérance de vie',         category: 'health'    },
  { id: 'SH.DYN.MORT',    label: 'Mortalité infantile',       category: 'health'    },
  { id: 'SH.MED.BEDS.ZS', label: "Lits d'hôpital (pour 1000)", category: 'health' },
  { id: 'NY.GDP.MKTP.CD', label: 'PIB (USD courant)',         category: 'economy'   },
  { id: 'NY.GDP.PCAP.CD', label: 'PIB par habitant',          category: 'economy'   },
  { id: 'SI.POV.DDAY',    label: 'Taux de pauvreté (<2,15$/j)', category: 'economy' },
  { id: 'SE.ADT.LITR.ZS', label: 'Taux d\'alphabétisation',   category: 'education' },
  { id: 'SE.PRM.ENRR',    label: 'Taux de scolarisation primaire', category: 'education' },
  { id: 'EN.ATM.CO2E.PC', label: 'Émissions CO2 par habitant', category: 'environment' },
]

export async function fetchWorldBank() {
  const reports = []
  const countryCodes = AFRICAN_COUNTRIES.map(c => c.wbCode).join(';')

  for (const indicator of WB_INDICATORS) {
    try {
      const url = `https://api.worldbank.org/v2/country/${countryCodes}/indicator/${indicator.id}?format=json&mrv=1&per_page=100`
      const data = await fetchJSON(url)
      if (!Array.isArray(data) || !data[1]) continue

      for (const entry of data[1]) {
        if (entry.value === null || !entry.country) continue
        const countryMeta = WB_CODE_MAP[entry.countryiso3code] || WB_CODE_MAP[entry.country.id]
        if (!countryMeta) continue

        reports.push({
          title:       `${indicator.label} — ${countryMeta.name} (${entry.date})`,
          description: `Valeur : ${entry.value?.toLocaleString('fr-FR') ?? 'N/A'} | Indicateur World Bank ${indicator.id}`,
          source:      'worldbank',
          sourceUrl:   `https://data.worldbank.org/indicator/${indicator.id}?locations=${countryMeta.code}`,
          country:     countryMeta.code,
          countryName: countryMeta.name,
          category:    indicator.category,
          reportedAt:  new Date(`${entry.date}-01-01`),
          language:    'fr',
          tags:        ['worldbank', indicator.id, indicator.category],
          rawData:     entry,
        })
      }
    } catch (err) {
      logger.warn({ err, indicator: indicator.id }, 'World Bank fetch error')
    }
  }
  return reports
}

// ─── WHO GHO ─────────────────────────────────────────────────────────────────
// Indicateurs de santé de l'OMS pour les pays africains.
const WHO_INDICATORS = [
  { code: 'WHOSIS_000001', label: 'Espérance de vie à la naissance', category: 'health' },
  { code: 'WHOSIS_000015', label: 'Mortalité maternelle',            category: 'health' },
  { code: 'MDG_0000000026', label: 'Couverture vaccinale DTP3',      category: 'health' },
  { code: 'MALARIA_EST_DEATHS', label: 'Décès dus au paludisme',    category: 'health' },
  { code: 'HIV_0000000026', label: 'Prévalence du VIH',             category: 'health' },
]

const WHO_COUNTRY_CODES = new Set(AFRICAN_COUNTRIES.map(c => c.code))

export async function fetchWHO() {
  const reports = []

  for (const ind of WHO_INDICATORS) {
    try {
      const url = `https://ghoapi.azureedge.net/api/${ind.code}?$filter=SpatialDim ne null&$top=200&$orderby=TimeDim desc`
      const data = await fetchJSON(url)
      if (!data?.value) continue

      for (const entry of data.value) {
        const countryCode = entry.SpatialDim
        if (!WHO_COUNTRY_CODES.has(countryCode)) continue
        const meta = COUNTRY_MAP[countryCode]
        if (!meta) continue

        reports.push({
          title:       `${ind.label} — ${meta.name} (${entry.TimeDim})`,
          description: `Valeur : ${entry.NumericValue ?? entry.Value ?? 'N/A'} | OMS/GHO ${ind.code}`,
          source:      'who',
          sourceUrl:   `https://www.who.int/data/gho/data/indicators/indicator-details/GHO/${ind.code}`,
          country:     meta.code,
          countryName: meta.name,
          category:    ind.category,
          reportedAt:  new Date(`${entry.TimeDim}-01-01`),
          language:    'fr',
          tags:        ['who', 'gho', ind.code, ind.category],
          rawData:     entry,
        })
      }
    } catch (err) {
      logger.warn({ err, indicator: ind.code }, 'WHO GHO fetch error')
    }
  }
  return reports
}

// ─── ReliefWeb ───────────────────────────────────────────────────────────────
// Rapports humanitaires pour l'Afrique (OCHA, UNICEF, PAM, etc.)
const RELIEFWEB_COUNTRIES = AFRICAN_COUNTRIES.map(c => c.name)

export async function fetchReliefWeb() {
  const reports = []
  const body = {
    query: { value: 'africa', operator: 'AND' },
    filter: {
      operator: 'AND',
      conditions: [
        { field: 'primary_country.region.name', value: 'Africa' },
      ],
    },
    fields: { include: ['title', 'body-html', 'date', 'url', 'primary_country', 'theme', 'source'] },
    sort:   ['date.created:desc'],
    limit:  200,
  }

  try {
    const data = await fetchJSON('https://api.reliefweb.int/v1/reports?appname=loktore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    for (const item of (data?.data ?? [])) {
      const f = item.fields
      const countryName = f.primary_country?.name ?? 'ALL'
      const meta = AFRICAN_COUNTRIES.find(c =>
        c.name.toLowerCase() === countryName.toLowerCase()
      )

      const sourceOrg = f.source?.[0]?.name ?? 'ReliefWeb'
      const themes = (f.theme ?? []).map(t => t.name)

      reports.push({
        title:       f.title ?? 'Sans titre',
        description: (f['body-html'] ?? '').replace(/<[^>]+>/g, '').slice(0, 500),
        source:      'reliefweb',
        sourceUrl:   f.url ?? `https://reliefweb.int/node/${item.id}`,
        country:     meta?.code ?? 'ALL',
        countryName: meta?.name ?? countryName,
        category:    'humanitarian',
        reportedAt:  new Date(f.date?.created ?? Date.now()),
        language:    'fr',
        tags:        ['reliefweb', 'humanitaire', sourceOrg, ...themes].filter(Boolean),
        rawData:     { id: item.id, source: sourceOrg, themes },
      })
    }
  } catch (err) {
    logger.warn({ err }, 'ReliefWeb fetch error')
  }
  return reports
}

// ─── African Development Bank Open Data ──────────────────────────────────────
// Indicateurs économiques via le portail open data de la BAD.
export async function fetchAfDB() {
  const reports = []
  const datasets = [
    { id: 'african-economic-outlook',    category: 'economy', label: 'Perspectives économiques africaines' },
    { id: 'african-development-report',  category: 'economy', label: 'Rapport sur le développement en Afrique' },
  ]

  for (const ds of datasets) {
    try {
      const url = `https://dataportal.opendatasoft.com/api/explore/v2.1/catalog/datasets?where=publisher:"African+Development+Bank"&limit=50&offset=0`
      const data = await fetchJSON(url)

      for (const record of (data?.results ?? [])) {
        const title = record.metas?.default?.title ?? ds.label
        const published = record.metas?.default?.modified ?? record.metas?.default?.created

        reports.push({
          title:       title,
          description: record.metas?.default?.description?.slice(0, 500) ?? '',
          source:      'afdb',
          sourceUrl:   `https://dataportal.opendatasoft.com/explore/dataset/${record.dataset_id}`,
          country:     'ALL',
          countryName: 'Afrique',
          category:    ds.category,
          reportedAt:  published ? new Date(published) : new Date(),
          language:    'fr',
          tags:        ['afdb', 'bad', ds.category],
          rawData:     { dataset_id: record.dataset_id },
        })
      }
    } catch (err) {
      logger.warn({ err, dataset: ds.id }, 'AfDB fetch error')
    }
  }
  return reports
}

// ─── Export principal ─────────────────────────────────────────────────────────
export const SOURCES = {
  worldbank: fetchWorldBank,
  who:       fetchWHO,
  reliefweb: fetchReliefWeb,
  afdb:      fetchAfDB,
}

export async function fetchAll(sources = Object.keys(SOURCES)) {
  const results = await Promise.allSettled(
    sources.map(s => SOURCES[s]?.())
  )
  return results.flatMap((r, i) => {
    if (r.status === 'rejected') {
      logger.error({ err: r.reason, source: sources[i] }, 'Source fetch failed')
      return []
    }
    return r.value ?? []
  })
}
