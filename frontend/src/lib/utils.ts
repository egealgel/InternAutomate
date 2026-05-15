export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ")
}

export const STATUSES = ["New", "Applied", "Interview", "Rejected", "Offer"]
