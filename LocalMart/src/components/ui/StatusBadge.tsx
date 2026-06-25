import { cn } from "@/lib/utils";
import type { ListingStatus, TaskStatus, TaskPriority } from "@/types/database";

const LISTING_STATUS: Record<ListingStatus, string> = {
  pending:  "bg-yellow-100 text-yellow-800",
  active:   "bg-green-100 text-green-800",
  sold:     "bg-gray-100 text-gray-600",
  rejected: "bg-red-100 text-red-800",
  featured: "bg-brand-100 text-brand-700",
};

const TASK_STATUS: Record<TaskStatus, string> = {
  new:         "bg-blue-100 text-blue-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  done:        "bg-green-100 text-green-800",
  cancelled:   "bg-gray-100 text-gray-600",
  pending:     "bg-gray-100 text-gray-600",
};

const PRIORITY: Record<TaskPriority, string> = {
  low:    "bg-gray-100 text-gray-600",
  medium: "bg-blue-100 text-blue-700",
  high:   "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

const LISTING_LABEL: Record<ListingStatus, string> = {
  pending:  "Pending",
  active:   "Active",
  sold:     "Sold",
  rejected: "Rejected",
  featured: "Featured",
};

const TASK_LABEL: Record<string, string> = {
  new:         "New",
  in_progress: "In Progress",
  done:        "Done",
  cancelled:   "Cancelled",
  pending:     "Pending",
};

export function ListingStatusBadge({ status }: { status: ListingStatus }) {
  return (
    <span className={cn("badge", LISTING_STATUS[status])}>
      {LISTING_LABEL[status]}
    </span>
  );
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span className={cn("badge", TASK_STATUS[status] ?? "bg-gray-100 text-gray-600")}>
      {TASK_LABEL[status] ?? status}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <span className={cn("badge capitalize", PRIORITY[priority])}>
      {priority}
    </span>
  );
}
