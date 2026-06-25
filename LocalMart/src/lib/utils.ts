import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number | null, priceType: string): string {
  if (!price || priceType === "free") return "Free";
  if (price >= 100000) return `₹${(price / 100000).toFixed(1)}L`;
  if (price >= 1000) return `₹${(price / 1000).toFixed(1)}K`;
  return `₹${price.toLocaleString("en-IN")}`;
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export const STATUS_COLORS: Record<string, string> = {
  pending:  "bg-yellow-100 text-yellow-800",
  active:   "bg-green-100 text-green-800",
  sold:     "bg-gray-100 text-gray-600",
  rejected: "bg-red-100 text-red-800",
  featured: "bg-brand-100 text-brand-700",
};

export const TASK_STATUS_COLORS: Record<string, string> = {
  new:         "bg-blue-100 text-blue-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  done:        "bg-green-100 text-green-800",
  cancelled:   "bg-gray-100 text-gray-600",
};

export const PRIORITY_COLORS: Record<string, string> = {
  low:    "bg-gray-100 text-gray-600",
  medium: "bg-blue-100 text-blue-700",
  high:   "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

export const CATEGORY_ICONS: Record<string, string> = {
  "agriculture":    "🌾",
  "electronics":    "📱",
  "vehicles":       "🚗",
  "property":       "🏡",
  "clothing":       "👗",
  "food":           "🍎",
  "furniture":      "🛋️",
  "services":       "🔧",
  "jobs":           "💼",
  "education":      "📚",
  "health":         "💊",
  "other":          "📦",
};

export const LISTING_TYPE_LABELS: Record<string, string> = {
  sell:    "For Sale",
  buy:     "Want to Buy",
  rent:    "For Rent",
  service: "Service",
};
