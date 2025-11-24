import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { z } from 'zod'
import { useReportStore, reportDataUtils } from '../stores/reportStore'
import { Search, Eye, CheckCircle, Upload, X } from 'lucide-react'

const TemplateSchema = z.object({
  id: z.union([z.number(), z.string()]).optional(),
  unit_name: z.string().nullable().optional(),
  unit_code: z.string().nullable().optional(),
  practical_title: z.string().nullable().optional(),
  practical_number: z.string().nullable().optional(),
  year: z.string().nullable().optional(),
  subject: z.string().nullable().optional(),
  practical_content: z.string().nullable().optional()
})

type TemplateItem = z.infer<typeof TemplateSchema>

export default function Templates() {
  const navigate = useNavigate()
  const { setReportData } = useReportStore()

  const [items, setItems] = useState<TemplateItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [year, setYear] = useState<string>('')
  const [page, setPage] = useState(1)
  const pageSize = 12
  const [total, setTotal] = useState(0)
  const [previewItem, setPreviewItem] = useState<TemplateItem | null>(null)

  const debouncedQuery = useDebounced(query, 300)

  useEffect(() => {
    let cancelled = false
    async function fetchTemplates() {
      setLoading(true)
      setError('')
      try {
        const params = new URLSearchParams({
          q: debouncedQuery || '',
          year: year || '',
          page: String(page),
          pageSize: String(pageSize)
        })
        const resp = await fetch(`/api/templates?${params.toString()}`)
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}))
          throw new Error(err.error || 'Failed to load templates')
        }
        const payload = await resp.json()
        const validated = (payload.data || []).map((d: any) => TemplateSchema.parse(d))
        if (!cancelled) {
          setItems(validated)
          setTotal(payload.total || validated.length)
        }
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Failed to load templates')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchTemplates()
    return () => { cancelled = true }
  }, [debouncedQuery, year, page])

  const pages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total])

  const onPreview = (item: TemplateItem) => {
    setPreviewItem(item)
  }

  const onSelect = (item: TemplateItem) => {
    const content = normalizeContent(item)
    const prepared = reportDataUtils.prepareDataForStorage({
      manualText: content,
      parsedContent: content,
      userInputs: {
        unitName: item.unit_name || undefined,
        practicalTitle: item.practical_title || undefined,
        practicalNumber: item.practical_number || undefined,
        additionalNotes: item.subject || undefined
      },
      sessionInfo: reportDataUtils.createSessionInfo()
    })
    if (!prepared) {
      alert('Template content is too short or invalid')
      return
    }
    setReportData(prepared)
    navigate('/new-report', { state: { goToResults: true, selectedTemplateId: item.id } })
  }

  const onUploadManual = () => {
    navigate('/new-report')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Available Manual Templates</h1>
          <button onClick={onUploadManual} className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700 transition">
            <Upload className="h-5 w-5" />
            <span>Upload Manual</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-white/60" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by title, unit, code" className="w-full pl-10 pr-3 py-2 rounded-lg bg-white/10 text-white placeholder-white/60 border border-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
          </div>
          <select value={year} onChange={e => setYear(e.target.value)} className="w-full sm:w-40 px-3 py-2 rounded-lg bg-white/10 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-500">
            <option value="">Year</option>
            {getDistinctYears(items).map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {loading && (
          <div className="text-center py-16 text-white/80">Loading templates...</div>
        )}
        {!loading && error && (
          <div className="text-center py-8 text-red-300">{error}</div>
        )}
        {!loading && !error && items.length === 0 && (
          <div className="text-center py-16">
            <div className="text-white/80 mb-3">No templates available</div>
            <button onClick={onUploadManual} className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700 transition">
              <Upload className="h-5 w-5" />
              <span>Upload Manual</span>
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map(it => (
            <motion.div key={String(it.id)} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5 text-white shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-semibold text-white/80">{it.unit_name || it.unit_code || 'Unknown Unit'}</div>
                <div className="text-xs font-bold text-white/70">{it.year ?? ''}</div>
              </div>
              <div className="text-lg font-bold mb-1">{it.practical_title || 'Untitled Practical'}</div>
              <div className="text-sm text-white/70 mb-4">{it.unit_code || ''} • Practical {it.practical_number ?? ''}</div>
              <div className="flex gap-2">
                <button onClick={() => onPreview(it)} className="flex-1 inline-flex items-center justify-center space-x-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20">
                  <Eye className="h-4 w-4" />
                  <span>Preview</span>
                </button>
                <button onClick={() => onSelect(it)} className="flex-1 inline-flex items-center justify-center space-x-2 px-3 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700">
                  <CheckCircle className="h-4 w-4" />
                  <span>Select</span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {pages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-8 text-white">
            <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 disabled:opacity-50">Prev</button>
            <div className="text-white/80">Page {page} / {pages}</div>
            <button disabled={page >= pages} onClick={() => setPage(p => Math.min(pages, p + 1))} className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 disabled:opacity-50">Next</button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {!!previewItem && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setPreviewItem(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white/10 border border-white/20 rounded-xl max-w-3xl w-full max-h-[70vh] overflow-auto p-6 text-white" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <div className="font-bold">{previewItem?.practical_title || 'Preview'}</div>
                <button onClick={() => setPreviewItem(null)} className="p-2 rounded bg-white/10 hover:bg-white/20"><X className="h-4 w-4" /></button>
              </div>
              <pre className="whitespace-pre-wrap text-white/90">
                {normalizeContent(previewItem)}
              </pre>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function normalizeContent(item: TemplateItem | null): string {
  if (!item) return ''
  if (typeof item.practical_content === 'string' && item.practical_content.trim()) return item.practical_content
  return ''
}

function getDistinctYears(items: TemplateItem[]): string[] {
  const set = new Set<string>()
  for (const it of items) {
    if (typeof it.year === 'string' && it.year) set.add(it.year)
  }
  return Array.from(set).sort((a, b) => (a > b ? -1 : a < b ? 1 : 0))
}

function useDebounced<T>(value: T, delay: number): T {
  const [state, setState] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setState(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return state
}
