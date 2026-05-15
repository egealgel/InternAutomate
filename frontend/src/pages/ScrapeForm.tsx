import { useState } from "react"
import { Link } from "react-router-dom"
import { Play, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { api, type ScrapeResult } from "../lib/api"

const SURFACE = { background: "#161b22", border: "1px solid #30363d" }
const INPUT_CLS = "w-full bg-gray-800 border border-gray-700 text-gray-200 placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
const LABEL_CLS = "block text-sm font-medium text-gray-400 mb-1.5"

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
    setLoading(true); setResult(null); setError(null)
    try {
      setResult(await api.scrape({ keywords, location, sources, max_pages: maxPages }))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Bilinmeyen hata")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <h1 className="text-xl font-semibold text-gray-100">İlan Tarama</h1>

      <form onSubmit={handleSubmit} className="rounded-xl p-5 space-y-4" style={SURFACE}>
        <div>
          <label className={LABEL_CLS}>Anahtar Kelime</label>
          <input
            type="text"
            value={keywords}
            onChange={e => setKeywords(e.target.value)}
            className={INPUT_CLS}
            placeholder="stajyer, yazılım staj, data science intern..."
          />
        </div>

        <div>
          <label className={LABEL_CLS}>Şehir / Konum</label>
          <input
            type="text"
            value={location}
            onChange={e => setLocation(e.target.value)}
            className={INPUT_CLS}
            placeholder="İstanbul, Ankara, Uzaktan..."
          />
        </div>

        <div>
          <label className={LABEL_CLS}>Kaynaklar</label>
          <div className="flex gap-2">
            {SOURCES.map(({ id, label, color }) => (
              <button
                key={id}
                type="button"
                onClick={() => toggleSource(id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  sources.includes(id)
                    ? `${color} text-white`
                    : "text-gray-500 hover:text-gray-300"
                }`}
                style={sources.includes(id) ? {} : { background: "#21262d", border: "1px solid #30363d" }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={LABEL_CLS}>
            Sayfa Limiti <span className="text-gray-600 font-normal">(kaynak başına)</span>
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={maxPages}
              onChange={e => setMaxPages(Math.max(1, Math.min(10, Number(e.target.value))))}
              min={1} max={10}
              className={`${INPUT_CLS} w-20`}
            />
            <span className="text-xs text-gray-600">LinkedIn ~25/sayfa · Youthall ~20/sayfa</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
        >
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Taranıyor...</> : <><Play className="h-4 w-4" /> Taramayı Başlat</>}
        </button>
      </form>

      {loading && (
        <div className="rounded-xl p-4 text-sm text-blue-300 text-center" style={{ background: "#1c2d3f", border: "1px solid #1f6feb" }}>
          İlanlar taranıyor... LinkedIn varsa bu birkaç dakika sürebilir.
        </div>
      )}

      {error && (
        <div className="rounded-xl p-4 flex items-start gap-2" style={{ background: "#2d1414", border: "1px solid #6e1a1a" }}>
          <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {result && (
        <div className="rounded-xl p-5 space-y-4" style={{ background: "#122d1a", border: "1px solid #196c2e" }}>
          <div className="flex items-center gap-2 text-green-400 font-medium">
            <CheckCircle2 className="h-5 w-5" /> Tarama tamamlandı!
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: "Bulunan", value: result.total_found, color: "text-gray-200" },
              { label: "Yeni eklenen", value: result.added, color: "text-green-400" },
              { label: "Zaten mevcut", value: result.skipped, color: "text-gray-500" },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-lg p-3" style={{ background: "#0d1117" }}>
                <div className={`text-2xl font-bold ${color}`}>{value}</div>
                <div className="text-xs text-gray-500">{label}</div>
              </div>
            ))}
          </div>
          {result.errors.length > 0 && (
            <div className="text-xs text-red-400 rounded p-2" style={{ background: "#2d1414" }}>
              Hatalar: {result.errors.join(", ")}
            </div>
          )}
          <Link
            to="/"
            className="block text-center py-2 bg-green-700 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            İlanları Gör →
          </Link>
        </div>
      )}
    </div>
  )
}
