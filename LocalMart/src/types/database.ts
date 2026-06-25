export type UserRole = "customer" | "agent" | "ceo";
export type ListingType = "sell" | "buy" | "rent" | "service";
export type PriceType = "fixed" | "negotiable" | "free";
export type ListingStatus = "pending" | "active" | "sold" | "rejected" | "featured";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type TaskStatus = "pending" | "new" | "in_progress" | "done" | "cancelled";

export interface Village {
  id: string;
  name: string;
  region: string;
  district: string | null;
  city: string | null;
  mandal: string | null;
  state: string;
  pin_code: string | null;
  is_active: boolean;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  village_id: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  name_en: string;   // actual DB column
  name?: string;     // added by migration — may not exist yet
  slug: string;
  icon: string;
  description: string | null;
}

export interface Listing {
  id: string;
  title: string;
  description: string | null;
  type: ListingType;
  category_id: string | null;
  village_id: string | null;
  seller_id: string;
  price: number | null;
  price_type: PriceType;
  status: ListingStatus;
  images: string[];
  tags: string[];
  contact_phone: string | null;
  whatsapp_number: string | null;
  view_count: number;
  assigned_agent_id: string | null;
  // India address fields (added via migration)
  state: string | null;
  district: string | null;
  city: string | null;
  area: string | null;
  pin_code: string | null;
  created_at: string;
  updated_at: string;
}

export interface Agent {
  id: string;
  user_id: string;
  assigned_villages: string[];
  total_listings: number;
  closed_listings: number;
  commission_rate?: number | null;
  rating: number | null;
  is_active: boolean;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  assigned_to: string;
  created_by: string;
  listing_id: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  link: string | null;
  created_at: string;
}

// Joined types
export interface ListingFull extends Listing {
  village?: Village | null;
  category?: Category | null;
  seller?: User | null;
}

export interface AgentSummary extends Agent {
  user?: User;
  close_rate?: number;
}

export type InsertListing = Omit<Listing, "id" | "view_count" | "created_at" | "updated_at">;
export type InsertTask = Omit<Task, "id" | "created_at" | "completed_at">;
