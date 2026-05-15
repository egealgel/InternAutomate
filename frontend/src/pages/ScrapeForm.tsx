import { useState } from "react"
import { Link } from "react-router-dom"
import { Play, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { api, type ScrapeResult } from "../lib/api"

const SOURCES = [
  { id: "linkedin",   label: "LinkedIn",  color: "bg-blue-600"   },
  { id: "youthall",  label: "Youthall",  color: "bg-orange-500" },
  { id: "pythiango", label: "PythianGo", color: "bg-violet-600" },
]

export default function ScrapeForm() {
  const [keywords, setKeywords] = useState("stajyer")
  const [location, setLocation] = useState("İstanbul")
  const [sources, setSources] = useState<string[]>(["linkedin", "youthall", "pythiango"])
  const [maxPages, setMaxPages] = useState(3)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ScrapeResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const toggleSource = (id: string) =>
    setSources(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sources.length) { setError("En az bir kaynak seçmelisin."); return }
    setLoading(true)
    setResult(null)
    setError(null)
    try {
      const res = await api.scrape({ keywords, location, sources, max_pages: maxPages })
      setResult(res)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Bilinmeyen hata")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <h1 className="text-xl font-semibold text-gray-900">İlan Tarama</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Anahtar Kelime</label>
          <input
            type="text"
            value={keywords}
            onChange={e => setKeywords(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="stajyer, yazılım staj, data science intern..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Şehir / Konum</label>
          <input
            type="text"
            value={location}
            onChange={e => setLocation(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="İstanbul, Ankara, Uzaktan..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Kaynaklar</label>
          <div className="flex gap-2 flex-wrap">
            {SOURCES.map(({ id, label, color }) => (
              <button
                key={id}
                type="button"
                onClick={() => toggleSource(id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border-2 ${
                  sources.includes(id)
                    ? `${color} text-white border-transparent`
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sayfa Limiti <span className="text-gray-400 font-normal">(kaynak başına)</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={maxPages}
              onChange={e => setMaxPages(Math.max(1, Math.min(10, Number(e.target.value))))}
              min={1} max={10}
              className="w-20 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <span className="text-xs text-gray-400">LinkedIn ~25/sayfa, Youthall ~20/sayfa</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium rounded-lg transition-colors"
        >
          {loading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Taranıyor...</>
          ) : (
            <><Play className="h-4 w-4" /> Taramayı Başlat</>
          )}
        </button>
      </form>

      {loading && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700 text-center">
          İlanlar taranıyor, lütfen bekleyin... LinkedIn varsa bu birkaç dakika sürebilir.
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {result && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-green-700 font-medium">
            <CheckCircle2 className="h-5 w-5" /> Tarama tamamlandı!
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-white rounded-lg p-3 border border-green-100">
              <div className="text-2xl font-bold text-gray-800">{result.total_found}</div>
              <div className="text-xs text-gray-500">Bulunan</div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-green-100">
              <div className="text-2xl font-bold text-green-600">{result.added}</div>
              <div className="text-xs text-gray-500">Yeni eklenen</div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-green-100">
              <div className="text-2xl font-bold text-gray-400">{result.skipped}</div>
              <div className="text-xs text-gray-500">Zaten mevcut</div>
            </div>
          </div>
          {result.errors.length > 0 && (
            <div className="text-xs text-red-600 bg-red-50 rounded p-2">
              Hatalar: {result.errors.join(", ")}
            </div>
          )}
          <Link
            to="/"
            className="block text-center py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            İlanları Gör →
          </Link>
        </div>
      )}
    </div>
  )
}
