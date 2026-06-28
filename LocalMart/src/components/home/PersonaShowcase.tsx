// PersonaShowcase — realistic Indian user portraits using CSS art + gradients
// Each persona card represents a real local user archetype

import Link from "next/link";

const PERSONAS = [
  {
    name:     "Ravi Kumar",
    role:     "Vegetable Farmer",
    location: "Nalgonda, Telangana",
    story:    "Sold 500 kg tomatoes directly to 12 buyers in same mandal. Earned ₹2,200 more vs mandi commission.",
    stat:     { value: "₹2,200", label: "Extra income per week" },
    emoji:    "👨‍🌾",
    vertical: "Vegetables",
    gradient: "from-green-800 via-green-700 to-emerald-600",
    accent:   "#4ADE80",
    tag:      "vegetables",
    // Visual composition colors
    skin:     "#A0522D",
    shirt:    "#2D6A2D",
  },
  {
    name:     "Meena Devi",
    role:     "Tiffin Service Owner",
    location: "Hyderabad, Telangana",
    story:    "Started with 5 regular customers from LocalMart. Now serves 47 office workers daily, fully booked.",
    stat:     { value: "47", label: "Daily customers from app" },
    emoji:    "👩‍🍳",
    vertical: "Restaurants",
    gradient: "from-orange-800 via-orange-700 to-amber-600",
    accent:   "#FB923C",
    tag:      "food",
    skin:     "#8B6347",
    shirt:    "#C2410C",
  },
  {
    name:     "Suresh Nair",
    role:     "Bike & Car Mechanic",
    location: "Kochi, Kerala",
    story:    "My garage gets 10+ home visit requests weekly. Revenue up 3x since joining LocalMart.",
    stat:     { value: "3×", label: "Revenue increase in 6 months" },
    emoji:    "🧑‍🔧",
    vertical: "Mechanics",
    gradient: "from-slate-800 via-slate-700 to-gray-600",
    accent:   "#94A3B8",
    tag:      "mechanics",
    skin:     "#7B4F2E",
    shirt:    "#1E293B",
  },
  {
    name:     "Lakshmi Reddy",
    role:     "Property Agent",
    location: "Vijayawada, AP",
    story:    "Closed 3 land deals worth ₹80 Lakh in one month. LocalMart brought serious buyers from across districts.",
    stat:     { value: "₹80L", label: "Properties closed this month" },
    emoji:    "👩‍💼",
    vertical: "Property",
    gradient: "from-violet-800 via-violet-700 to-purple-600",
    accent:   "#A78BFA",
    tag:      "property",
    skin:     "#A0522D",
    shirt:    "#5B21B6",
  },
];

function PersonaCard({ p }: { p: typeof PERSONAS[0] }) {
  return (
    <div className="group relative rounded-3xl overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl cursor-pointer"
      style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.15)" }}>

      {/* Gradient background with persona illustration */}
      <div className={`relative h-56 bg-gradient-to-br ${p.gradient} flex items-end justify-between p-5 overflow-hidden`}>

        {/* Subtle geometric pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute rounded-full border border-white/30"
              style={{
                width:  `${60 + i * 30}px`, height: `${60 + i * 30}px`,
                right:  `-${10 + i * 5}px`,  bottom: `-${10 + i * 5}px`,
              }} />
          ))}
        </div>

        {/* Large emoji avatar — AI image placeholder */}
        <div className="relative z-10 flex-1">
          {/* Avatar circle */}
          <div className="relative inline-block">
            {/* Shadow ring */}
            <div className="absolute inset-0 rounded-full blur-md opacity-40" style={{ background: p.accent }} />
            {/* Main avatar */}
            <div className="relative h-20 w-20 rounded-full border-4 border-white/30 flex items-center justify-center text-5xl"
              style={{ background: `radial-gradient(circle at 40% 35%, rgba(255,255,255,0.25), rgba(0,0,0,0.3))`, backdropFilter: "blur(4px)" }}>
              {p.emoji}
            </div>
            {/* Verified badge */}
            <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-white flex items-center justify-center shadow-md">
              <svg className="h-3.5 w-3.5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        {/* Stat badge */}
        <div className="relative z-10 text-right">
          <div className="inline-block px-3 py-2 rounded-2xl"
            style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.2)" }}>
            <div className="text-xl font-black text-white leading-none">{p.stat.value}</div>
            <div className="text-xs text-white/70 mt-0.5 leading-tight max-w-20 text-right">{p.stat.label}</div>
          </div>
        </div>

        {/* Vertical tag */}
        <div className="absolute top-4 right-4">
          <span className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ background: "rgba(255,255,255,0.2)", color: "white", border: "1px solid rgba(255,255,255,0.3)" }}>
            {p.vertical}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white p-5">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-black text-gray-900 text-base">{p.name}</h3>
            <p className="text-xs font-semibold text-gray-500">{p.role}</p>
          </div>
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <svg key={i} className="h-3 w-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1.5 mb-3">
          <svg className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          <span className="text-xs text-gray-400">{p.location}</span>
        </div>

        <p className="text-sm text-gray-600 leading-relaxed mb-4 line-clamp-3">"{p.story}"</p>

        <Link href={`/user/browse?category=${p.tag}`}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
          style={{ background: `linear-gradient(135deg, #4C1D95, #7C3AED)` }}>
          Browse {p.vertical}
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

export default function PersonaShowcase() {
  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-5"
            style={{ background: "rgba(124,58,237,0.1)", color: "#6D28D9", border: "1px solid rgba(124,58,237,0.2)" }}>
            ⭐ Real Success Stories
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3">
            Real Indians. Real Income.
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            From farmers to mechanics to property agents — LocalMart creates livelihoods at the village level.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {PERSONAS.map(p => <PersonaCard key={p.name} p={p} />)}
        </div>
      </div>
    </section>
  );
}
