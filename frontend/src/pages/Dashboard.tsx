import { useEffect, useState, useCallback } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { Search, Download, Trash2, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react"
import { api, type Job, type JobsResponse } from "../lib/api"
import { StatusBadge, SourceBadge } from "../components/Badge"
import { STATUSES } from "../lib/utils"

const STATUS_TOTAL_COLORS: Record<string, string> = {
  all: "border-gray-200 hover:border-blue-400",
  New: "border-gray-200 hover:border-gray-400",
  Applied: "border-blue-200 hover:border-blue-400",
  Interview: "border-yellow-200 hover:border-yellow-400",
  Rejected: "border-red-200 hover:border-red-400",
  Offer: "border-green-200 hover:border-green-400",
}

export default function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [data, setData] = useState<JobsResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const q = searchParams.get("q") ?? ""
  const status = searchParams.get("status") ?? ""
  const source = searchParams.get("source") ?? ""
  const dateFilter = searchParams.get("date_filter") ?? ""
  const page = Number(searchParams.get("page") ?? 1)

  const setParam = (key: string, value: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (value) next.set(key, value)
      else next.delete(key)
      if (key !== "page") next.delete("page")
      return next
    })
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.getJobs({ q, status, source, date_filter: dateFilter, page })
      setData(res)
    } finally {
      setLoading(false)
    }
  }, [q, status, source, dateFilter, page])

  useEffect(() => { load() }, [load])

  const handleDelete = async (id: number) => {
    if (!confirm("Bu ilanı silmek istediğine emin misin?")) return
    await api.deleteJob(id)
    load()
  }

  const totalCount = data
    ? Object.values(data.status_counts).reduce((a, b) => a + b, 0)
    : 0

  return (
    <div className="space-y-4">
      {/* Stat kartları */}
      <div className="flex flex-wrap gap-2">
        {[{ label: "Toplam", key: "all", count: totalCount }, ...STATUSES.map(s => ({ label: s, key: s, count: data?.status_counts[s] ?? 0 }))].map(({ label, key, count }) => (
          <button
            key={key}
            onClick={() => setParam("status", key === "all" ? "" : key)}
            className={`rounded-lg border-2 bg-white px-3 py-2 text-left transition-all ${STATUS_TOTAL_COLORS[key]} ${(key === "all" && !status) || status === key ? "ring-2 ring-blue-400" : ""}`}
          >
            <div className="text-xl font-bold text-gray-800">{count}</div>
            <div className="text-xs text-gray-500">{label}</div>
          </button>
        ))}
      </div>

      {/* Filtre satırı */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Başlık, şirket, konum..."
            value={q}
            onChange={e => setParam("q", e.target.value)}
            className="pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 w-56"
          />
        </div>
        <select
          value={source}
          onChange={e => setParam("source", e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">Tüm kaynaklar</option>
          <option value="linkedin">LinkedIn</option>
          <option value="youthall">Youthall</option>
          <option value="pythiango">PythianGo</option>
          <option value="kariyer">Kariyer.net</option>
          <option value="indeed">Indeed</option>
        </select>
        <select
          value={status}
          onChange={e => setParam("status", e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">Tüm durumlar</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={dateFilter}
          onChange={e => setParam("date_filter", e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">Tüm zamanlar</option>
          <option value="1d">Son 1 gün</option>
          <option value="3d">Son 3 gün</option>
          <option value="7d">Son 7 gün</option>
          <option value="30d">Son 30 gün</option>
        </select>
        {(q || status || source || dateFilter) && (
          <button onClick={() => setSearchParams({})} className="text-sm text-gray-500 hover:text-gray-700 underline">Temizle</button>
        )}
        <div className="ml-auto">
          <a
            href={api.exportUrl({ ...(status ? { status } : {}), ...(source ? { source } : {}) })}
            className="inline-flex items-center gap-1.5 text-sm bg-white border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50"
          >
            <Download className="h-4 w-4" /> CSV İndir
          </a>
        </div>
      </div>

      {/* Tablo */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">Yükleniyor...</div>
        ) : !data?.jobs.length ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
            <span className="text-4xl">📭</span>
            <p>İlan bulunamadı.</p>
            <Link to="/scrape" className="text-blue-500 hover:underline text-sm">İlan taramaya başla →</Link>
          </div>
        ) : (
          <>
            <div className="px-4 py-2 border-b border-gray-100 text-sm text-gray-500">
              {data.total} ilan bulundu
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                  <th className="px-4 py-3">Başlık</th>
                  <th className="px-4 py-3">Şirket</th>
                  <th className="px-4 py-3">Konum</th>
                  <th className="px-4 py-3">Kaynak</th>
                  <th className="px-4 py-3">Tarih</th>
                  <th className="px-4 py-3">Durum</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.jobs.map((job: Job) => (
                  <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium">
                      <Link to={`/jobs/${job.id}`} className="hover:text-blue-600 hover:underline line-clamp-1">
                        {job.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-[160px] truncate">{job.company}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-[140px] truncate">{job.location ?? "—"}</td>
                    <td className="px-4 py-3"><SourceBadge source={job.source} /></td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{job.date_found?.slice(0, 10)}</td>
                    <td className="px-4 py-3"><StatusBadge status={job.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <a href={job.url} target="_blank" rel="noopener noreferrer"
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-600" title="İlana git">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                        <button onClick={() => handleDelete(job.id)}
                          className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500" title="Sil">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Sayfalama */}
            {data.pages > 1 && (
              <div className="flex items-center justify-center gap-1 py-3 border-t border-gray-100">
                <button
                  disabled={page <= 1}
                  onClick={() => setParam("page", String(page - 1))}
                  className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: data.pages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setParam("page", String(p))}
                    className={`w-8 h-8 rounded text-sm ${p === page ? "bg-blue-600 text-white" : "hover:bg-gray-100"}`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  disabled={page >= data.pages}
                  onClick={() => setParam("page", String(page + 1))}
                  className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40"
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
