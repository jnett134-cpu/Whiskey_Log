import Link from "next/link";
import { getSupabaseServerClient } from "../lib/supabaseServer";

// Always fetch fresh data — this is a personal log, not a page you want cached.
export const dynamic = "force-dynamic";

export default async function HomePage({ searchParams }) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  const supabase = getSupabaseServerClient();
  let request = supabase
    .from("bottles")
    .select("*")
    .order("created_at", { ascending: false });

  if (query) {
    // Drop characters that would break PostgREST's or() filter grammar,
    // then match the term anywhere in any of these text fields.
    const term = query.replace(/[,()]/g, " ").trim();
    if (term) {
      const pattern = `%${term}%`;
      request = request.or(
        [
          `name.ilike.${pattern}`,
          `location.ilike.${pattern}`,
          `category.ilike.${pattern}`,
          `notes.ilike.${pattern}`,
        ].join(",")
      );
    }
  }

  const { data: bottles, error } = await request;

  return (
    <main>
      <div className="header-row">
        <h1>My Tasting Log</h1>
        <Link href="/upload">+ Add bottle</Link>
      </div>

      <form className="search" method="get" action="/">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Search name, location, category, notes…"
          aria-label="Search entries"
        />
        {query && <Link href="/">Clear</Link>}
      </form>

      {error && <p className="error">Couldn&apos;t load bottles.</p>}
      {bottles && bottles.length === 0 && (
        <p>
          {query
            ? `No entries match “${query}”.`
            : "No bottles yet — add your first one."}
        </p>
      )}

      <div className="gallery">
        {bottles?.map((bottle) => (
          <Link key={bottle.id} href={`/bottle/${bottle.id}`} className="card">
            <img src={bottle.image_url} alt={bottle.name} />
            <h3>{bottle.name}</h3>
            {bottle.rating && (
              <p>
                {"★".repeat(bottle.rating)}
                {"☆".repeat(5 - bottle.rating)}
              </p>
            )}
            {(bottle.category || bottle.location) && (
              <p className="meta">
                {[bottle.category, bottle.location].filter(Boolean).join(" · ")}
              </p>
            )}
          </Link>
        ))}
      </div>
    </main>
  );
}
