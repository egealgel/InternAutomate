import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { ArrowLeft, ExternalLink, MapPin, Calendar, Building2, Tag } from "lucide-react"
import { api, type Job } from "../lib/api"
import { StatusBadge, SourceBadge } from "../components/Badge"
import { STATUSES } from "../lib/utils"

export default function JobDetail() {
  const { id } = useParams<{ id: string }>()
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [notesValue, setNotesValue] = useState("")
  const [notesSaving, setNotesSaving] = useState(false)
  const [statusSaving, setStatusSaving] = useState(false)

  useEffect(() => {
    api.getJob(Number(id)).then(j => {
      setJob(j)
      setNotesValue(j.notes ?? "")
      setLoading(false)
    })
  }, [id])

  const handleStatus = async (newStatus: string) => {
    if (!job) return
    setStatusSaving(true)
    await api.updateStatus(job.id, newStatus)
    setJob({ ...job, status: newStatus })
    setStatusSaving(false)
  }

  const handleNotes = async () => {
    if (!job) return
    setNotesSaving(true)
    await api.updateNotes(job.id, notesValue)
    setJob({ ...job, notes: notesValue })
    setNotesSaving(false)
  }

  if (loading) return <div className="flex justify-center py-16 text-gray-400">Yükleniyor...</div>
  if (!job) return <div className="text-center py-16 text-red-500">İlan bulunamadı.</div>

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Geri butonu */}
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" /> İlanlara dön
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sol kolon: başlık + açıklama */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{job.title}</h1>
                <p className="text-gray-500 mt-0.5">{job.company}</p>
              </div>
              <StatusBadge status={job.status} />
            </div>
            <div className="flex flex-wrap gap-3 mt-3 text-sm text-gray-500">
              {job.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />{job.location}
                </span>
              )}
              <SourceBadge source={job.source} />
              {job.date_posted && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />İlan: {job.date_posted}
                </span>
              )}
              {job.company_size && (
                <span className="flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" />{job.company_size}
                </span>
              )}
              {job.keywords && (
                <span className="flex items-center gap-1">
                  <Tag className="h-3.5 w-3.5" />"{job.keywords}"
                </span>
              )}
            </div>
            <div className="mt-4">
              <a
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
              >
                <ExternalLink className="h-4 w-4" /> İlana Git
              </a>
            </div>
          </div>

          {job.description && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">İlan Açıklaması</h2>
              <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto">
                {job.description}
              </div>
            </div>
          )}
        </div>

        {/* Sağ kolon: durum + notlar */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Başvuru Durumu</h2>
            <div className="grid grid-cols-1 gap-1.5">
              {STATUSES.map(s => (
                <button
                  key={s}
                  disabled={statusSaving}
                  onClick={() => handleStatus(s)}
                  className={`text-left px-3 py-2 rounded-lg text-sm border transition-all ${
                    job.status === s
                      ? "bg-blue-600 text-white border-blue-600"
                      : "border-gray-200 hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Notlar</h2>
            <textarea
              value={notesValue}
              onChange={e => setNotesValue(e.target.value)}
              placeholder="Mülakat notu, iletişim bilgisi..."
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
              rows={5}
            />
            <button
              onClick={handleNotes}
              disabled={notesSaving}
              className="mt-2 w-full py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-60 transition-colors"
            >
              {notesSaving ? "Kaydediliyor..." : "Notu Kaydet"}
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 text-xs text-gray-400 space-y-1">
            <div><span className="font-medium">Bulundu:</span> {job.date_found?.slice(0, 16).replace("T", " ")}</div>
            <div><span className="font-medium">Güncellendi:</span> {job.date_updated?.slice(0, 16).replace("T", " ")}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
