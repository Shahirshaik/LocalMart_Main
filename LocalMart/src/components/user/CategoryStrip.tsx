"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";

const CATEGORIES = [
  {
    key: "vegetables",
    slug: "vegetables",
    emoji: "🥦",
    gradient: "from-green-500 to-emerald-600",
    bg: "bg-green-50",
    border: "border-green-100",
    text: "text-green-700",
  },
  {
    key: "restaurants",
    slug: "restaurants",
    emoji: "🍱",
    gradient: "from-orange-500 to-red-500",
    bg: "bg-orange-50",
    border: "border-orange-100",
    text: "text-orange-700",
  },
  {
    key: "gas",
    slug: "gas",
    emoji: "🔴",
    gradient: "from-red-500 to-rose-600",
    bg: "bg-red-50",
    border: "border-red-100",
    text: "text-red-700",
  },
  {
    key: "construction",
    slug: "construction",
    emoji: "🏗️",
    gradient: "from-yellow-500 to-amber-600",
    bg: "bg-yellow-50",
    border: "border-yellow-100",
    text: "text-yellow-700",
  },
  {
    key: "land",
    slug: "land",
    emoji: "🏠",
    gradient: "from-blue-500 to-indigo-600",
    bg: "bg-blue-50",
    border: "border-blue-100",
    text: "text-blue-700",
  },
  {
    key: "rentals",
    slug: "rentals",
    emoji: "🛋️",
    gradient: "from-cyan-500 to-teal-600",
    bg: "bg-cyan-50",
    border: "border-cyan-100",
    text: "text-cyan-700",
  },
  {
    key: "mechanics",
    slug: "mechanics",
    emoji: "🔧",
    gradient: "from-slate-600 to-gray-700",
    bg: "bg-slate-50",
    border: "border-slate-100",
    text: "text-slate-700",
  },
  {
    key: "electronics",
    slug: "electronics",
    emoji: "📱",
    gradient: "from-purple-500 to-violet-600",
    bg: "bg-purple-50",
    border: "border-purple-100",
    text: "text-purple-700",
  },
  {
    key: "jobs",
    slug: "jobs",
    emoji: "💼",
    gradient: "from-indigo-500 to-blue-600",
    bg: "bg-indigo-50",
    border: "border-indigo-100",
    text: "text-indigo-700",
  },
  {
    key: "fashion",
    slug: "fashion",
    emoji: "👗",
    gradient: "from-pink-500 to-rose-500",
    bg: "bg-pink-50",
    border: "border-pink-100",
    text: "text-pink-700",
  },
  {
    key: "health",
    slug: "health",
    emoji: "🩺",
    gradient: "from-teal-500 to-green-600",
    bg: "bg-teal-50",
    border: "border-teal-100",
    text: "text-teal-700",
  },
  {
    key: "education",
    slug: "education",
    emoji: "📚",
    gradient: "from-amber-500 to-orange-600",
    bg: "bg-amber-50",
    border: "border-amber-100",
    text: "text-amber-700",
  },
] as const;

export default function CategoryStrip() {
  const { t } = useI18n();

  return (
    <section className="py-6">
      <div className="flex items-baseline justify-between mb-4 px-1">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{t("categories.title")}</h2>
          <p className="text-xs text-gray-500 mt-0.5">{t("categories.subtitle")}</p>
        </div>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-3">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.key}
            href={`/user/category/${cat.slug}`}
            className={`group flex flex-col items-center gap-2 p-3 rounded-2xl border ${cat.bg} ${cat.border} hover:shadow-md transition-all hover:-translate-y-0.5`}
          >
            <div
              className={`h-11 w-11 rounded-xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center text-xl shadow-sm group-hover:scale-110 transition-transform`}
            >
              {cat.emoji}
            </div>
            <span className={`text-[10px] font-semibold text-center leading-tight ${cat.text} line-clamp-2`}>
              {t(`categories.${cat.key}`)}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
