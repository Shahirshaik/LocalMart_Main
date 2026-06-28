"use client";

import { useEffect, useRef, useState } from "react";

const FEED_ITEMS = [
  { icon: "🥬", text: "Ravi Kumar sold 200kg tomatoes in Nalgonda",      time: "2m ago",  tag: "Vegetables" },
  { icon: "🏠", text: "3 BHK flat listed in Bengaluru – ₹45 Lakh",        time: "5m ago",  tag: "Property"  },
  { icon: "🔧", text: "Suresh Garage accepted 4 new service requests",     time: "8m ago",  tag: "Mechanic"  },
  { icon: "💼", text: "12 applications for Welder role in Nashik",         time: "11m ago", tag: "Jobs"      },
  { icon: "🛒", text: "Kirana store in Jaipur fulfilled 38 orders today",  time: "14m ago", tag: "Grocery"   },
  { icon: "🔥", text: "HP Gas cylinder restocked in Pune – book now",      time: "17m ago", tag: "Gas"       },
  { icon: "🚗", text: "Honda Activa sold in 2hrs in Ludhiana",             time: "22m ago", tag: "Vehicles"  },
  { icon: "🏗️", text: "M-Sand 50 tonnes delivered to Nagpur site",         time: "29m ago", tag: "Construct" },
];

const TAG_COLORS: Record<string, string> = {
  Vegetables: "bg-green-100 text-green-700",
  Property:   "bg-purple-100 text-purple-700",
  Mechanic:   "bg-slate-100 text-slate-700",
  Jobs:       "bg-indigo-100 text-indigo-700",
  Grocery:    "bg-yellow-100 text-yellow-800",
  Gas:        "bg-red-100 text-red-700",
  Vehicles:   "bg-cyan-100 text-cyan-700",
  Construct:  "bg-amber-100 text-amber-800",
};

export default function LiveTicker() {
  const [index, setIndex]    = useState(0);
  const [visible, setVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex(i => (i + 1) % FEED_ITEMS.length);
        setVisible(true);
      }, 300);
    }, 3200);
    return () => clearInterval(timerRef.current);
  }, []);

  const item = FEED_ITEMS[index];

  return (
    <div className="py-3 border-b border-gray-100 bg-white"
      style={{ borderTop: "2px solid #7C3AED" }}>
      <div className="max-w-7xl mx-auto px-4 flex items-center gap-4">
        {/* Live dot */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Live</span>
        </div>

        <div className="flex-1 min-w-0 overflow-hidden">
          <div className={`flex items-center gap-3 transition-all duration-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"}`}>
            <span className="text-base shrink-0">{item.icon}</span>
            <p className="text-sm text-gray-700 font-medium truncate">{item.text}</p>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${TAG_COLORS[item.tag] ?? "bg-gray-100 text-gray-600"}`}>
              {item.tag}
            </span>
            <span className="text-xs text-gray-400 shrink-0">{item.time}</span>
          </div>
        </div>

        {/* Dot navigation */}
        <div className="flex gap-1 shrink-0">
          {FEED_ITEMS.map((_, i) => (
            <button key={i} onClick={() => { setIndex(i); setVisible(true); }}
              className={`h-1.5 rounded-full transition-all ${i === index ? "w-4 bg-purple-600" : "w-1.5 bg-gray-200"}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
