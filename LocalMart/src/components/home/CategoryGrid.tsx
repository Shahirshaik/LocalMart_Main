import Link from "next/link";

const CATEGORIES = [
  {
    slug:     "vegetables",
    icon:     "🥬",
    label:    "Vegetables & Fruits",
    hindi:    "सब्जी बाज़ार",
    desc:     "Farm-fresh mandi prices daily",
    gradient: "from-green-500 to-emerald-400",
    bg:       "bg-green-50",
    border:   "border-green-100",
    text:     "text-green-800",
    pill:     "bg-green-100 text-green-700",
    // Indian farmer placeholder image composition
    persona:  { role: "Farmer", emoji: "👨‍🌾", location: "Nalgonda, Telangana" },
    listing_sample: "500 kg Tomatoes – ₹22/kg",
  },
  {
    slug:     "food",
    icon:     "🍽️",
    label:    "Tiffin & Restaurants",
    hindi:    "टिफिन सर्विस",
    desc:     "Home-cooked meals delivered",
    gradient: "from-orange-500 to-amber-400",
    bg:       "bg-orange-50",
    border:   "border-orange-100",
    text:     "text-orange-800",
    pill:     "bg-orange-100 text-orange-700",
    persona:  { role: "Home Chef", emoji: "👩‍🍳", location: "Hyderabad, Telangana" },
    listing_sample: "South Indian Tiffin – ₹60/day",
  },
  {
    slug:     "gas",
    icon:     "🔥",
    label:    "Gas & Cylinder",
    hindi:    "गैस सिलेंडर",
    desc:     "HP, Indane, Bharat doorstep",
    gradient: "from-red-500 to-rose-400",
    bg:       "bg-red-50",
    border:   "border-red-100",
    text:     "text-red-800",
    pill:     "bg-red-100 text-red-700",
    persona:  { role: "Gas Dealer", emoji: "🧑‍💼", location: "Pune, Maharashtra" },
    listing_sample: "HP Gas Refill – ₹903 subsidised",
  },
  {
    slug:     "construction",
    icon:     "🏗️",
    label:    "Construction",
    hindi:    "निर्माण सामग्री",
    desc:     "Sand, cement, bricks, labour",
    gradient: "from-amber-600 to-yellow-400",
    bg:       "bg-amber-50",
    border:   "border-amber-100",
    text:     "text-amber-900",
    pill:     "bg-amber-100 text-amber-800",
    persona:  { role: "Contractor", emoji: "👷", location: "Nagpur, Maharashtra" },
    listing_sample: "M-Sand 1 Tonne – ₹1,400",
  },
  {
    slug:     "property",
    icon:     "🏠",
    label:    "Land & Home Sale",
    hindi:    "भूमि बिक्री",
    desc:     "Verified plots, houses, lands",
    gradient: "from-violet-600 to-purple-400",
    bg:       "bg-purple-50",
    border:   "border-purple-100",
    text:     "text-purple-800",
    pill:     "bg-purple-100 text-purple-700",
    persona:  { role: "Agent", emoji: "🧑‍💼", location: "Vijayawada, AP" },
    listing_sample: "3 Acres Farm Land – ₹28 Lakh",
  },
  {
    slug:     "rentals",
    icon:     "🏘️",
    label:    "House Rentals",
    hindi:    "मकान किराया",
    desc:     "1BHK, 2BHK, PG, shops",
    gradient: "from-blue-600 to-sky-400",
    bg:       "bg-blue-50",
    border:   "border-blue-100",
    text:     "text-blue-800",
    pill:     "bg-blue-100 text-blue-700",
    persona:  { role: "Landlord", emoji: "🏡", location: "Bengaluru, Karnataka" },
    listing_sample: "2BHK Flat Rent – ₹12,000/mo",
  },
  {
    slug:     "mechanics",
    icon:     "🔧",
    label:    "Car & Bike Mechanic",
    hindi:    "मैकेनिक सेवा",
    desc:     "Home service, repairs, spares",
    gradient: "from-slate-600 to-gray-400",
    bg:       "bg-slate-50",
    border:   "border-slate-100",
    text:     "text-slate-800",
    pill:     "bg-slate-100 text-slate-700",
    persona:  { role: "Mechanic", emoji: "🧑‍🔧", location: "Coimbatore, Tamil Nadu" },
    listing_sample: "Bike Servicing – ₹350",
  },
  {
    slug:     "grocery",
    icon:     "🛒",
    label:    "Grocery & Kirana",
    hindi:    "किराना दुकान",
    desc:     "Daily essentials, free delivery",
    gradient: "from-yellow-500 to-lime-400",
    bg:       "bg-yellow-50",
    border:   "border-yellow-100",
    text:     "text-yellow-900",
    pill:     "bg-yellow-100 text-yellow-800",
    persona:  { role: "Kirana Owner", emoji: "🧑‍🏪", location: "Jaipur, Rajasthan" },
    listing_sample: "Premium Basmati Rice 5kg – ₹380",
  },
  {
    slug:     "jobs",
    icon:     "💼",
    label:    "Local Jobs",
    hindi:    "स्थानीय नौकरियां",
    desc:     "Factory, farm, tech, domestic",
    gradient: "from-indigo-600 to-blue-400",
    bg:       "bg-indigo-50",
    border:   "border-indigo-100",
    text:     "text-indigo-800",
    pill:     "bg-indigo-100 text-indigo-700",
    persona:  { role: "Job Seeker", emoji: "🙋‍♂️", location: "Nashik, Maharashtra" },
    listing_sample: "Welder Wanted – ₹18,000/mo",
  },
  {
    slug:     "vehicles",
    icon:     "🚗",
    label:    "Vehicles",
    hindi:    "गाड़ी बाज़ार",
    desc:     "Cars, bikes, tractors, autos",
    gradient: "from-cyan-600 to-teal-400",
    bg:       "bg-cyan-50",
    border:   "border-cyan-100",
    text:     "text-cyan-800",
    pill:     "bg-cyan-100 text-cyan-700",
    persona:  { role: "Seller", emoji: "🚜", location: "Ludhiana, Punjab" },
    listing_sample: "Honda Activa 6G 2022 – ₹68,000",
  },
  {
    slug:     "furniture",
    icon:     "🛋️",
    label:    "Furniture & Home",
    hindi:    "फर्नीचर",
    desc:     "New & second-hand furniture",
    gradient: "from-rose-600 to-pink-400",
    bg:       "bg-rose-50",
    border:   "border-rose-100",
    text:     "text-rose-800",
    pill:     "bg-rose-100 text-rose-700",
    persona:  { role: "Seller", emoji: "🪑", location: "Jodhpur, Rajasthan" },
    listing_sample: "Wooden Sofa Set – ₹22,000",
  },
  {
    slug:     "mobiles",
    icon:     "📱",
    label:    "Electronics",
    hindi:    "इलेक्ट्रॉनिक्स",
    desc:     "Phones, TVs, AC, appliances",
    gradient: "from-violet-600 to-fuchsia-400",
    bg:       "bg-violet-50",
    border:   "border-violet-100",
    text:     "text-violet-800",
    pill:     "bg-violet-100 text-violet-700",
    persona:  { role: "Shop Owner", emoji: "👨‍💻", location: "Chennai, Tamil Nadu" },
    listing_sample: "Samsung Galaxy A54 – ₹31,000",
  },
];

interface Props { pinCode?: string }

export default function CategoryGrid({ pinCode }: Props) {
  const pinParam = pinCode ? `?pin=${pinCode}` : "";

  return (
    <section className="py-20 px-4" style={{ background: "linear-gradient(180deg, #FAF5FF 0%, #FFFFFF 100%)" }}>
      <div className="max-w-7xl mx-auto">

        {/* Section header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-5"
            style={{ background: "linear-gradient(135deg,#4C1D95,#7C3AED)", color: "white" }}>
            📦 12 Verticals · Everything Hyperlocal
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mb-3">
            Your Local Marketplace
          </h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            From farm to mechanic to real estate — every service from your neighbourhood, now online.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {CATEGORIES.map((cat, i) => (
            <Link
              key={cat.slug}
              href={`/user/browse?category=${cat.slug}${pinCode ? `&pin=${pinCode}` : ""}`}
              className={`group relative rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:scale-105 ${cat.bg} ${cat.border}`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              {/* Gradient accent bar at top */}
              <div className={`h-1 w-full bg-gradient-to-r ${cat.gradient}`} />

              <div className="p-5">
                {/* Icon + hindi label */}
                <div className="flex items-start justify-between mb-3">
                  <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center text-3xl shadow-lg`}>
                    {cat.icon}
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cat.pill}`}>
                    New
                  </span>
                </div>

                {/* Category name */}
                <h3 className={`font-black text-sm leading-tight mb-0.5 ${cat.text}`}>
                  {cat.label}
                </h3>

                <p className="text-gray-500 text-xs leading-snug mb-3 hidden sm:block">{cat.desc}</p>

                {/* Sample listing preview */}
                <div className="rounded-xl bg-white/70 border border-white/80 p-2.5 mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{cat.persona.emoji}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{cat.listing_sample}</p>
                      <p className="text-xs text-gray-400 truncate">{cat.persona.location}</p>
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <div className={`flex items-center justify-between text-xs font-bold ${cat.text} group-hover:gap-3 transition-all`}>
                  <span>Browse {cat.label.split(" ")[0]}</span>
                  <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* View all CTA */}
        <div className="text-center mt-10">
          <Link href={`/user/browse${pinParam}`}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90 hover:shadow-xl"
            style={{ background: "linear-gradient(135deg,#4C1D95,#7C3AED)", boxShadow: "0 4px 20px rgba(124,58,237,0.35)" }}>
            View All Listings
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
