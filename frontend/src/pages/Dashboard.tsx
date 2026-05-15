import { useEffect, useState, useCallback, useRef } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Search, Download, Trash2, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react"
import { api, type Job, type JobsResponse } from "../lib/api"
import { SourceBadge } from "../components/Badge"
import { STATUSES } from "../lib/utils"

const SURFACE = { background: "#161b22", border: "1px solid #30363d" }
const INPUT_CLS = "bg-gray-800 border border-gray-700 text-gray-200 placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"

const STATUS_RING: Record<string, string> = {
  all:       "hover:border-blue-500",
  New:       "hover:border-gray-400",
  Applied:   "hover:border-blue-400",
  Interview: "hover:border-yellow-400",
  Rejected:  "hover:border-red-400",
  Offer:     "hover:border-green-400",
}

export default function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [data, setData] = useState<JobsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const q           = searchParams.get("q") ?? ""
  const status      = searchParams.get("status") ?? ""
  const source      = searchParams.get("source") ?? ""
  const dateFilter  = searchParams.get("date_filter") ?? ""
  const hideExpired = searchParams.get("hide_expired") !== "false"
  const page        = Number(searchParams.get("page") ?? 1)

  const [searchInput, setSearchInput] = useState(q)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchRef   = useRef<HTMLInputElement>(null)

  const setParam = (key: string, value: string) =>
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (value) next.set(key, value); else next.delete(key)
      if (key !== "page") next.delete("page")
      return next
    })

  const handleSearchChange = (value: string) => {
    setSearchInput(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setParam("q", value), 350)
  }

  // Cmd/Ctrl+K → focus search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setData(await api.getJobs({ q, status, source, date_filter: dateFilter, hide_expired: hideExpired ? "true" : "false", page }))
    } finally {
      setLoading(false)
    }
  }, [q, status, source, dateFilter, page])

  useEffect(() => { load() }, [load])
  useEffect(() => { setSearchInput(q) }, [q])

  const toggleHideExpired = () =>
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      next.set("hide_expired", hideExpired ? "false" : "true")
      next.delete("page")
      return next
    })

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    if (!confirm("Bu ilanı silmek istediğine emin misin?")) return
    await api.deleteJob(id)
    load()
  }

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>, job: Job) => {
    e.stopPropagation()
    await api.updateStatus(job.id, e.target.value)
    load()
  }

  const totalCount = data ? Object.values(data.status_counts).reduce((a, b) => a + b, 0) : 0

  return (
    <div className="space-y-4">
      {/* Stat kartları */}
      <div className="flex flex-wrap gap-2">
        {[{ label: "Toplam", key: "all", count: totalCount }, ...STATUSES.map(s => ({ label: s, key: s, count: data?.status_counts[s] ?? 0 }))].map(({ label, key, count }) => (
          <button
            key={key}
            onClick={() => setParam("status", key === "all" ? "" : key)}
            className={`rounded-lg border-2 px-3 py-2 text-left transition-all ${STATUS_RING[key]} ${(key === "all" && !status) || status === key ? "border-blue-500" : "border-gray-700"}`}
            style={{ background: "#161b22" }}
          >
            <div className="text-xl font-bold text-gray-100">{count}</div>
            <div className="text-xs text-gray-500">{label}</div>
          </button>
        ))}
      </div>

      {/* Filtre satırı */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Başlık, şirket, konum... (⌘K)"
            value={searchInput}
            onChange={e => handleSearchChange(e.target.value)}
            className={`${INPUT_CLS} pl-8 w-60`}
          />
        </div>

        <select value={source} onChange={e => setParam("source", e.target.value)} className={INPUT_CLS}>
          <option value="">Tüm kaynaklar</option>
          <option value="linkedin">LinkedIn</option>
          <option value="youthall">Youthall</option>
          <option value="pythiango">PythianGo</option>
        </select>

        <select value={status} onChange={e => setParam("status", e.target.value)} className={INPUT_CLS}>
          <option value="">Tüm durumlar</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <select value={dateFilter} onChange={e => setParam("date_filter", e.target.value)} className={INPUT_CLS}>
          <option value="">Tüm zamanlar</option>
          <option value="1d">Son 1 gün</option>
          <option value="3d">Son 3 gün</option>
          <option value="7d">Son 7 gün</option>
          <option value="30d">Son 30 gün</option>
        </select>

        <button
          onClick={toggleHideExpired}
          className={`flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border transition-colors ${
            hideExpired
              ? "border-orange-700 text-orange-400 bg-orange-950"
              : "border-gray-700 text-gray-500 hover:text-gray-300"
          }`}
          style={hideExpired ? {} : { background: "#161b22" }}
          title="Son başvuru tarihi geçmiş ilanları gizle/göster"
        >
          {hideExpired ? "⏳ Süresi dolmuşlar gizli" : "⏳ Tümünü göster"}
        </button>

        {(q || status || source || dateFilter) && (
          <button onClick={() => setSearchParams({})} className="text-sm text-gray-500 hover:text-gray-300 underline">
            Temizle
          </button>
        )}

        <div className="ml-auto">
          <a
            href={api.exportUrl({ ...(status ? { status } : {}), ...(source ? { source } : {}) })}
            className="inline-flex items-center gap-1.5 text-sm border border-gray-700 rounded-lg px-3 py-2 text-gray-400 hover:text-gray-200 hover:border-gray-500 transition-colors"
            style={{ background: "#161b22" }}
          >
            <Download className="h-4 w-4" /> CSV İndir
          </a>
        </div>
      </div>

      {/* Tablo */}
      <div className="rounded-xl overflow-hidden" style={SURFACE}>
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-500">Yükleniyor...</div>
        ) : !data?.jobs.length ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500 gap-3">
            <span className="text-5xl">📭</span>
            <p className="text-gray-400">İlan bulunamadı.</p>
            <a href="/scrape" className="text-blue-400 hover:underline text-sm">İlan taramaya başla →</a>
          </div>
        ) : (
          <>
            <div className="px-4 py-2.5 border-b text-sm text-gray-500" style={{ borderColor: "#30363d" }}>
              {data.total} ilan
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide" style={{ borderBottom: "1px solid #30363d", background: "#0d1117" }}>
                  <th className="px-4 py-3">Başlık</th>
                  <th className="px-4 py-3">Şirket</th>
                  <th className="px-4 py-3">Konum</th>
                  <th className="px-4 py-3">Kaynak</th>
                  <th className="px-4 py-3">Son Başvuru</th>
                  <th className="px-4 py-3">Durum</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {data.jobs.map((job: Job) => (
                  <tr
                    key={job.id}
                    onClick={() => navigate(`/jobs/${job.id}`)}
                    className="cursor-pointer transition-colors"
                    style={{ borderBottom: "1px solid #21262d" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#1c2128")}
                    onMouseLeave={e => (e.currentTarget.style.background = "")}
                  >
                    <td className="px-4 py-3 font-medium text-gray-200 max-w-[220px]">
                      <span className="line-clamp-1">{job.title}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 max-w-[150px] truncate">{job.company}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-[130px] truncate">{job.location ?? "—"}</td>
                    <td className="px-4 py-3"><SourceBadge source={job.source} /></td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {job.deadline ? (
                        <span className={`text-xs font-medium ${
                          job.deadline < new Date().toISOString().slice(0, 10)
                            ? "text-red-500 line-through"
                            : new Date(job.deadline) <= new Date(Date.now() + 3 * 86400000)
                            ? "text-orange-400"
                            : "text-gray-400"
                        }`}>
                          {job.deadline}
                        </span>
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <select
                        value={job.status}
                        onChange={e => handleStatusChange(e, job)}
                        className="text-xs rounded-full px-2.5 py-1 border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        style={{ background: "transparent" }}
                      >
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <a
                          href={job.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded text-gray-500 hover:text-blue-400 hover:bg-gray-800 transition-colors"
                          title="İlana git"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                        <button
                          onClick={e => handleDelete(e, job.id)}
                          className="p-1.5 rounded text-gray-500 hover:text-red-400 hover:bg-gray-800 transition-colors"
                          title="Sil"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {data.pages > 1 && (
              <div className="flex items-center justify-center gap-1 py-3 border-t" style={{ borderColor: "#30363d" }}>
                <button
                  disabled={page <= 1}
                  onClick={() => setParam("page", String(page - 1))}
                  className="p-1.5 rounded text-gray-400 hover:bg-gray-800 disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: data.pages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setParam("page", String(p))}
                    className={`w-8 h-8 rounded text-sm transition-colors ${p === page ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-800"}`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  disabled={page >= data.pages}
                  onClick={() => setParam("page", String(page + 1))}
                  className="p-1.5 rounded text-gray-400 hover:bg-gray-800 disabled:opacity-30"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
