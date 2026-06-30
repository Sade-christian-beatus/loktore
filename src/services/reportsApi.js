// Service d'accès aux rapports africains — appels vers /api/v1/reports
import { api } from './api.js'

export async function fetchReports(params = {}) {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== ''))
  ).toString()
  return api.get(`/reports${qs ? `?${qs}` : ''}`)
}

export async function fetchReportStats() {
  return api.get('/reports/stats')
}

export async function fetchReportCountries() {
  return api.get('/reports/countries')
}

export async function fetchReportDetail(id) {
  return api.get(`/reports/${id}`)
}

export async function triggerPipeline(sources) {
  return api.post('/reports/pipeline/run', sources ? { sources } : {})
}

export async function fetchPipelineJobs() {
  return api.get('/reports/pipeline/jobs')
}
