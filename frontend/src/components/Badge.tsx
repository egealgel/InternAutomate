import { cn } from "../lib/utils"

const statusColors: Record<string, string> = {
  New: "bg-gray-100 text-gray-700 ring-gray-200",
  Applied: "bg-blue-50 text-blue-700 ring-blue-200",
  Interview: "bg-yellow-50 text-yellow-700 ring-yellow-200",
  Rejected: "bg-red-50 text-red-700 ring-red-200",
  Offer: "bg-green-50 text-green-700 ring-green-200",
}

const sourceColors: Record<string, string> = {
  linkedin:  "bg-blue-600 text-white",
  indeed:    "bg-indigo-600 text-white",
  kariyer:   "bg-teal-600 text-white",
  youthall:  "bg-orange-500 text-white",
  pythiango: "bg-violet-600 text-white",
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        statusColors[status] ?? statusColors.New
      )}
    >
      {status}
    </span>
  )
}

export function SourceBadge({ source }: { source: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium capitalize",
        sourceColors[source] ?? "bg-gray-500 text-white"
      )}
    >
      {source}
    </span>
  )
}
