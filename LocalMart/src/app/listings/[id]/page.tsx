import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ListingStatusBadge } from "@/components/ui/StatusBadge";
import { formatPrice, timeAgo, CATEGORY_ICONS, LISTING_TYPE_LABELS } from "@/lib/utils";
import { Phone, MessageCircle, MapPin, Clock, Eye, Tag, ArrowLeft } from "lucide-react";
import type { UserRole, ListingFull } from "@/types/database";

interface Props { params: Promise<{ id: string }> }

export default async function ListingDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  let userRole: UserRole | null = null;
  if (user) {
    const { data } = await supabase.from("users").select("role").eq("id", user.id).single();
    userRole = data?.role ?? null;
  }

  const { data: listing } = await supabase
    .from("listings")
    .select("*, village:villages(*), category:categories(*), seller:users!seller_id(full_name, phone)")
    .eq("id", id)
    .single();

  if (!listing) notFound();

  await supabase.from("listings")
    .update({ view_count: listing.view_count + 1 }).eq("id", id);

  const l = listing as ListingFull & { seller?: { full_name: string; phone: string } };
  const icon = CATEGORY_ICONS[l.category?.slug ?? "other"] ?? "📦";
  const phone = l.contact_phone || l.seller?.phone;
  const whatsapp = l.whatsapp_number || phone;

  const { data: related } = await supabase
    .from("listings")
    .select("id, title, price, price_type, status, created_at, images, type")
    .eq("category_id", l.category_id ?? "")
    .eq("status", "active")
    .neq("id", id)
    .limit(4);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar userRole={userRole} userEmail={user?.email} />

      <main className="flex-1 bg-gray-50">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-5">
            <Link href="/" className="hover:text-brand-600">Home</Link>
            <span>/</span>
            <Link href="/listings" className="hover:text-brand-600">Listings</Link>
            {l.category && (
              <>
                <span>/</span>
                <Link href={"/listings?category=" + l.category.slug} className="hover:text-brand-600">
                  {l.category.name_en ?? l.category.name}
                </Link>
              </>
            )}
            <span>/</span>
            <span className="text-gray-900 truncate max-w-[180px]">{l.title}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-5">
              <div className="card overflow-hidden">
                {l.images?.[0] ? (
                  <img src={l.images[0]} alt={l.title} className="w-full h-72 md:h-96 object-cover" />
                ) : (
                  <div className="h-72 md:h-96 bg-gradient-to-br from-brand-400 to-purple-600 flex items-center justify-center">
                    <span className="text-8xl opacity-70">{icon}</span>
                  </div>
                )}
              </div>

              <div className="card p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <h1 className="text-2xl font-bold text-gray-900 leading-snug">{l.title}</h1>
                  <ListingStatusBadge status={l.status} />
                </div>

                <p className="text-3xl font-extrabold text-brand-600 mb-1">
                  {formatPrice(l.price, l.price_type)}
                  {l.price_type === "negotiable" && (
                    <span className="ml-2 text-sm font-normal text-gray-400">negotiable</span>
                  )}
                </p>

                <div className="flex flex-wrap gap-3 mt-4 mb-5 text-sm text-gray-500">
                  {(l.area || l.city || l.district || l.state || l.village) && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-brand-500" />
                      {[l.area || l.village?.name, l.city, l.district || l.village?.region, l.state || l.village?.state]
                        .filter(Boolean).slice(0, 3).join(", ")}
                    </span>
                  )}
                  {l.category && (
                    <span className="flex items-center gap-1.5">
                      <Tag className="h-4 w-4 text-brand-500" /> {l.category.name_en ?? l.category.name}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-gray-400" /> {timeAgo(l.created_at)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Eye className="h-4 w-4 text-gray-400" /> {l.view_count + 1} views
                  </span>
                </div>

                {l.tags && l.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-5">
                    {l.tags.map((tag) => (
                      <Link key={tag} href={"/listings?q=" + tag}
                        className="badge bg-gray-100 text-gray-600 hover:bg-brand-100 hover:text-brand-700 transition-colors">
                        #{tag}
                      </Link>
                    ))}
                  </div>
                )}

                {l.description && (
                  <div>
                    <h2 className="text-sm font-semibold text-gray-700 mb-2">Description</h2>
                    <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{l.description}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="card p-5">
                <h2 className="text-sm font-semibold text-gray-700 mb-4">Contact Seller</h2>
                {l.seller && (
                  <div className="mb-4 pb-4 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">{l.seller.full_name}</p>
                    <p className="text-xs text-gray-400">Seller</p>
                  </div>
                )}
                <div className="space-y-3">
                  {phone && (
                    <a href={"tel:" + phone}
                      className="flex items-center justify-center gap-2 w-full rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700 transition-colors">
                      <Phone className="h-4 w-4" /> Call Seller
                    </a>
                  )}
                  {whatsapp && (
                    <a href={"https://wa.me/" + String(whatsapp).replace(/\D/g, "")}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full rounded-xl bg-[#25d366] px-4 py-3 text-sm font-semibold text-white hover:bg-[#1ebe5d] transition-colors">
                      <MessageCircle className="h-4 w-4" /> WhatsApp
                    </a>
                  )}
                  {!phone && !whatsapp && (
                    <p className="text-sm text-gray-400 text-center py-2">No contact info available</p>
                  )}
                </div>
              </div>

              <div className="card p-5">
                <h2 className="text-sm font-semibold text-gray-700 mb-3">Listing Info</h2>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Type</dt>
                    <dd className="font-medium text-gray-800">{LISTING_TYPE_LABELS[l.type]}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Price</dt>
                    <dd className="font-medium text-gray-800 capitalize">{l.price_type}</dd>
                  </div>
                  {(l.state || l.village?.state) && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500">State</dt>
                      <dd className="font-medium text-gray-800">{l.state || l.village?.state}</dd>
                    </div>
                  )}
                  {(l.district || l.village?.region) && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500">District</dt>
                      <dd className="font-medium text-gray-800">{l.district || l.village?.region}</dd>
                    </div>
                  )}
                  {(l.city || l.village?.name) && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500">City / Village</dt>
                      <dd className="font-medium text-gray-800">{l.city || l.area || l.village?.name}</dd>
                    </div>
                  )}
                  {l.pin_code && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500">PIN Code</dt>
                      <dd className="font-medium text-gray-800">{l.pin_code}</dd>
                    </div>
                  )}
                </dl>
              </div>

              <Link href="/listings" className="btn-ghost w-full justify-center text-sm">
                <ArrowLeft className="h-4 w-4" /> Back to Listings
              </Link>
            </div>
          </div>

          {related && related.length > 0 && (
            <div className="mt-10">
              <h2 className="section-title mb-5">Similar Listings</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {related.map((r) => (
                  <Link key={r.id} href={"/listings/" + r.id}
                    className="card p-3 hover:shadow-md transition-all group">
                    <div className="h-24 rounded-lg bg-gradient-to-br from-brand-100 to-purple-100 flex items-center justify-center mb-2">
                      <span className="text-2xl">{icon}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 line-clamp-1 group-hover:text-brand-600">{r.title}</p>
                    <p className="text-sm font-bold text-brand-600 mt-0.5">{formatPrice(r.price, r.price_type)}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
