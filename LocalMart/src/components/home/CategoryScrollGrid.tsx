"use client";

import Link from "next/link";

const CATEGORIES = [
  { id: "cars",        name: "Cars",                emoji: "🚗", href: "/listings?q=cars" },
  { id: "property",    name: "Properties",          emoji: "🏠", href: "/listings?q=property" },
  { id: "mobiles",     name: "Mobiles",             emoji: "📱", href: "/listings?q=mobiles" },
  { id: "jobs",        name: "Jobs",                emoji: "💼", href: "/listings?q=jobs" },
  { id: "fashion",     name: "Fashion",             emoji: "👗", href: "/listings?q=fashion" },
  { id: "bikes",       name: "Bikes",               emoji: "🏍️", href: "/listings?q=bikes" },
  { id: "electronics", name: "Electronics",         emoji: "🖥️", href: "/listings?q=electronics" },
  { id: "commercial",  name: "Commercial Vehicles", emoji: "🚕", href: "/listings?q=commercial+vehicles" },
  { id: "furniture",   name: "Furniture",           emoji: "🛋️", href: "/listings?q=furniture" },
  { id: "vegetables",  name: "Vegetables",          emoji: "🥬", href: "/listings?q=vegetables" },
  { id: "tiffin",      name: "Tiffin / Food",       emoji: "🍽️", href: "/listings?q=tiffin" },
  { id: "gas",         name: "Gas Cylinder",        emoji: "🔥", href: "/listings?q=gas" },
  { id: "grocery",     name: "Grocery",             emoji: "🛒", href: "/listings?q=grocery" },
  { id: "mechanics",   name: "Mechanics",           emoji: "🔧", href: "/listings?q=mechanics" },
  { id: "pets",        name: "Pets & Animals",      emoji: "🐾", href: "/listings?q=pets" },
];

export function CategoryScrollGrid() {
  return (
    <section className="bg-white py-4 border-b border-[#e0e0e0]">
      <div className="overflow-x-auto no-scrollbar px-4">
        {/* 2-row grid, columns flow horizontally */}
        <div
          className="grid grid-rows-2 grid-flow-col gap-x-3 gap-y-4"
          style={{ gridAutoColumns: 96 }}
        >
          {CATEGORIES.map(cat => (
            <Link
              key={cat.id}
              href={cat.href}
              className="flex flex-col items-center group"
              style={{ width: 96 }}
            >
              <div
                className="w-24 h-20 flex items-center justify-center rounded-xl bg-white border border-[#e0e0e0] mb-1.5
                  group-hover:border-purple-300 group-hover:shadow-md transition-all"
              >
                <span style={{ fontSize: 36 }}>{cat.emoji}</span>
              </div>
              <span
                className="text-center text-[11px] font-medium leading-tight text-[#3a3a3a] line-clamp-2"
                style={{ maxWidth: 88 }}
              >
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
