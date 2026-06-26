import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const supabase = await createClient();

  // Auth check — CEO only
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (profile?.role !== "ceo") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const village  = searchParams.get("village")  || "";
  const district = searchParams.get("district") || "";
  const state    = searchParams.get("state")    || "";
  const status   = searchParams.get("status")   || "";

  let query = supabase
    .from("listings")
    .select(`
      id, title, type, status, price, price_type,
      state, district, city, area, pin_code,
      contact_phone, whatsapp_number, tags,
      images, view_count, created_at,
      seller:users!listings_seller_id_fkey(full_name, phone),
      category:categories(name_en),
      village:villages(name, mandal, region),
      assigned_agent:agents!listings_assigned_agent_id_fkey(
        user:users!agents_user_id_fkey(full_name, phone)
      )
    `)
    .order("created_at", { ascending: false })
    .limit(5000);

  if (village)  query = query.eq("village_id", village);
  if (district) query = query.ilike("district", `%${district}%`);
  if (state)    query = query.ilike("state", `%${state}%`);
  if (status)   query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Build CSV
  const headers = [
    "ID", "Title", "Category", "Type", "Status",
    "Price", "Price Type",
    "Area", "City", "District", "State", "PIN",
    "Village", "Mandal", "Region",
    "Seller Name", "Seller Phone",
    "Contact Phone", "WhatsApp",
    "Assigned Agent", "Agent Phone",
    "Tags", "Images Count", "Views", "Created Date",
  ];

  function esc(v: unknown): string {
    const s = v == null ? "" : String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  }

  const rows = (data ?? []).map((l: any) => [
    l.id,
    l.title,
    l.category?.name_en ?? "",
    l.type,
    l.status,
    l.price ?? "",
    l.price_type ?? "",
    l.area ?? "",
    l.city ?? "",
    l.district ?? "",
    l.state ?? "",
    l.pin_code ?? "",
    l.village?.name ?? "",
    l.village?.mandal ?? "",
    l.village?.region ?? "",
    l.seller?.full_name ?? "",
    l.seller?.phone ?? "",
    l.contact_phone ?? "",
    l.whatsapp_number ?? "",
    l.assigned_agent?.user?.full_name ?? "Unassigned",
    l.assigned_agent?.user?.phone ?? "",
    (l.tags ?? []).join("; "),
    (l.images ?? []).length,
    l.view_count ?? 0,
    new Date(l.created_at).toLocaleDateString("en-IN"),
  ].map(esc).join(","));

  const csv = [headers.join(","), ...rows].join("\r\n");
  const filename = `localmart-listings-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
