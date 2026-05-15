import { cn } from "../lib/utils"

const statusColors: Record<string, string> = {
  New:       "bg-gray-700 text-gray-300 ring-gray-600",
  Applied:   "bg-blue-900 text-blue-300 ring-blue-700",
  Interview: "bg-yellow-900 text-yellow-300 ring-yellow-700",
  Rejected:  "bg-red-900 text-red-400 ring-red-800",
  Offer:     "bg-green-900 text-green-300 ring-green-700",
}

const sourceColors: Record<string, string> = {
  linkedin:  "bg-blue-600 text-white",
  youthall:  "bg-orange-500 text-white",
  pythiango: "bg-violet-600 text-white",
  indeed:    "bg-indigo-600 text-white",
  kariyer:   "bg-teal-600 text-white",
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
      statusColors[status] ?? statusColors.New
    )}>
      {status}
    </span>
  )
}

export function SourceBadge({ source }: { source: string }) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium capitalize",
      sourceColors[source] ?? "bg-gray-600 text-white"
    )}>
      {source}
    </span>
  )
}
