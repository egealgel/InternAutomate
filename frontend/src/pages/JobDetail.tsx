import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { ArrowLeft, ExternalLink, MapPin, Calendar, Tag, Check } from "lucide-react"
import { api, type Job } from "../lib/api"
import { SourceBadge } from "../components/Badge"
import { STATUSES } from "../lib/utils"

const SURFACE = { background: "#161b22", border: "1px solid #30363d" }
const INPUT_CLS = "w-full bg-gray-800 border border-gray-700 text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"

const STATUS_STYLE: Record<string, { bg: string; text: string; ring: string }> = {
  New:       { bg: "#21262d", text: "#8b949e", ring: "#30363d" },
  Applied:   { bg: "#1c3048", text: "#58a6ff", ring: "#1f6feb" },
  Interview: { bg: "#2d2208", text: "#e3b341", ring: "#9e6a03" },
  Rejected:  { bg: "#2d1414", text: "#f85149", ring: "#6e1a1a" },
  Offer:     { bg: "#122d1a", text: "#3fb950", ring: "#196c2e" },
}

export default function JobDetail() {
  const { id } = useParams<{ id: string }>()
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [notesValue, setNotesValue] = useState("")
  const [notesSaved, setNotesSaved] = useState(false)
  const [notesSaving, setNotesSaving] = useState(false)

  useEffect(() => {
    api.getJob(Number(id)).then(j => {
      setJob(j)
      setNotesValue(j.notes ?? "")
      setLoading(false)
    })
  }, [id])

  const handleStatus = async (newStatus: string) => {
    if (!job || job.status === newStatus) return
    await api.updateStatus(job.id, newStatus)
    setJob({ ...job, status: newStatus })
  }

  const handleNotes = async () => {
    if (!job) return
    setNotesSaving(true)
    await api.updateNotes(job.id, notesValue)
    setJob({ ...job, notes: notesValue })
    setNotesSaving(false)
    setNotesSaved(true)
    setTimeout(() => setNotesSaved(false), 2000)
  }

  if (loading) return <div className="flex justify-center py-16 text-gray-500">Yükleniyor...</div>
  if (!job) return <div className="text-center py-16 text-red-400">İlan bulunamadı.</div>

  const statusStyle = STATUS_STYLE[job.status] ?? STATUS_STYLE.New

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-300 transition-colors">
        <ArrowLeft className="h-4 w-4" /> İlanlara dön
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sol kolon */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl p-5 space-y-4" style={SURFACE}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-xl font-semibold text-gray-100">{job.title}</h1>
                <p className="text-gray-400 mt-0.5">{job.company}</p>
              </div>
              <span
                className="shrink-0 inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ring-1 ring-inset"
                style={{ background: statusStyle.bg, color: statusStyle.text, boxShadow: `0 0 0 1px ${statusStyle.ring}` }}
              >
                {job.status}
              </span>
            </div>

            <div className="flex flex-wrap gap-3 text-sm text-gray-400">
              {job.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{job.location}</span>}
              <SourceBadge source={job.source} />
              {job.date_posted && <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />İlan: {job.date_posted}</span>}
              {job.deadline && (
                <span className={`flex items-center gap-1 font-medium ${
                  job.deadline < new Date().toISOString().slice(0, 10) ? "text-red-400" : "text-orange-400"
                }`}>
                  <Calendar className="h-3.5 w-3.5" />
                  Son başvuru: {job.deadline}
                  {job.deadline < new Date().toISOString().slice(0, 10) && " (Süresi doldu)"}
                </span>
              )}
              {job.keywords && <span className="flex items-center gap-1"><Tag className="h-3.5 w-3.5" />"{job.keywords}"</span>}
            </div>

            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors"
            >
              <ExternalLink className="h-4 w-4" /> İlana Git
            </a>
          </div>

          {job.description && (
            <div className="rounded-xl p-5" style={SURFACE}>
              <h2 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">Açıklama</h2>
              <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto">
                {job.description}
              </div>
            </div>
          )}
        </div>

        {/* Sağ kolon */}
        <div className="space-y-4">
          {/* Durum */}
          <div className="rounded-xl p-5" style={SURFACE}>
            <h2 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">Başvuru Durumu</h2>
            <div className="grid grid-cols-1 gap-1.5">
              {STATUSES.map(s => {
                const st = STATUS_STYLE[s]
                const active = job.status === s
                return (
                  <button
                    key={s}
                    onClick={() => handleStatus(s)}
                    className="text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-between"
                    style={active
                      ? { background: st.bg, color: st.text, outline: `1px solid ${st.ring}` }
                      : { background: "#0d1117", color: "#6e7681", outline: "1px solid #21262d" }
                    }
                  >
                    {s}
                    {active && <Check className="h-3.5 w-3.5" />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Notlar */}
          <div className="rounded-xl p-5" style={SURFACE}>
            <h2 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">Notlar</h2>
            <textarea
              value={notesValue}
              onChange={e => setNotesValue(e.target.value)}
              placeholder="Mülakat notu, iletişim bilgisi, son tarih..."
              className={`${INPUT_CLS} resize-none`}
              rows={5}
            />
            <button
              onClick={handleNotes}
              disabled={notesSaving}
              className="mt-2 w-full py-2 text-sm rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ background: notesSaved ? "#122d1a" : "#21262d", color: notesSaved ? "#3fb950" : "#8b949e", border: "1px solid #30363d" }}
            >
              {notesSaved ? <><Check className="h-4 w-4" /> Kaydedildi</> : notesSaving ? "Kaydediliyor..." : "Notu Kaydet"}
            </button>
          </div>

          {/* Meta */}
          <div className="rounded-xl p-4 text-xs text-gray-600 space-y-1" style={SURFACE}>
            <div><span className="text-gray-500">Bulundu:</span> {job.date_found?.slice(0, 16).replace("T", " ")}</div>
            <div><span className="text-gray-500">Güncellendi:</span> {job.date_updated?.slice(0, 16).replace("T", " ")}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
