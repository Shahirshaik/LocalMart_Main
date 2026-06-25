import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  color?: "brand" | "green" | "blue" | "orange" | "red";
  className?: string;
}

const colorMap = {
  brand:  { bg: "bg-brand-50",  icon: "text-brand-600",  ring: "ring-brand-100" },
  green:  { bg: "bg-green-50",  icon: "text-green-600",  ring: "ring-green-100" },
  blue:   { bg: "bg-blue-50",   icon: "text-blue-600",   ring: "ring-blue-100" },
  orange: { bg: "bg-orange-50", icon: "text-orange-600", ring: "ring-orange-100" },
  red:    { bg: "bg-red-50",    icon: "text-red-600",    ring: "ring-red-100" },
};

export function StatCard({ title, value, icon: Icon, trend, color = "brand", className }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div className={cn("card p-5 flex items-start gap-4", className)}>
      <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-2", c.bg, c.ring)}>
        <Icon className={cn("h-5 w-5", c.icon)} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500 truncate">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
        {trend && (
          <p className={cn("text-xs mt-1", trend.value >= 0 ? "text-green-600" : "text-red-500")}>
            {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}% {trend.label}
          </p>
        )}
      </div>
    </div>
  );
}
