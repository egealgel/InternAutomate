const BASE = "/api"

export interface Job {
  id: number
  title: string
  company: string
  location: string | null
  source: string
  url: string
  description: string | null
  date_posted: string | null
  deadline: string | null
  company_size: string | null
  keywords: string | null
  status: string
  notes: string | null
  date_found: string
  date_updated: string
}

export interface JobsResponse {
  jobs: Job[]
  total: number
  page: number
  pages: number
  per_page: number
  status_counts: Record<string, number>
  statuses: string[]
}

export interface ScrapeResult {
  added: number
  skipped: number
  total_found: number
  errors: string[]
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(BASE + path, init)
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json()
}

export const api = {
  getJobs: (params: Record<string, string | number>) => {
    const qs = new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== "" && v !== undefined)
        .map(([k, v]) => [k, String(v)])
    ).toString()
    return req<JobsResponse>(`/jobs${qs ? "?" + qs : ""}`)
  },

  getJob: (id: number) => req<Job>(`/jobs/${id}`),

  updateStatus: (id: number, status: string) =>
    req<{ ok: boolean }>(`/jobs/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }),

  updateNotes: (id: number, notes: string) =>
    req<{ ok: boolean }>(`/jobs/${id}/notes`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    }),

  deleteJob: (id: number) =>
    req<{ ok: boolean }>(`/jobs/${id}`, { method: "DELETE" }),

  scrape: (payload: {
    keywords: string
    location: string
    sources: string[]
    max_pages: number
  }) =>
    req<ScrapeResult>("/scrape/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  exportUrl: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : ""
    return BASE + "/export" + qs
  },
}
