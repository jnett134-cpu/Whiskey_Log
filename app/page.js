import Link from "next/link";
import { getSupabaseServerClient } from "../lib/supabaseServer";

// Always fetch fresh data — this is a personal log, not a page you want cached.
export const dynamic = "force-dynamic";

const SORTS = {
  date: { label: "Date Added", column: "created_at", ascending: false },
  name: { label: "Name", column: "name", ascending: true },
  rating: { label: "Rating", column: "rating", ascending: false },
  category: { label: "Category", column: "category", ascending: true },
};

export default async function HomePage({ searchParams }) {
  const { q, sort: sortParam } = await searchParams;
  const query = (q ?? "").trim();
  const sort = SORTS[sortParam] ? sortParam : "date";

  // Rebuild the query string, keeping whichever of q / sort still apply.
  const buildHref = ({ q: nextQ = query, sort: nextSort = sort } = {}) => {
    const params = new URLSearchParams();
    if (nextQ) params.set("q", nextQ);
    if (nextSort && nextSort !== "date") params.set("sort", nextSort);
    const qs = params.toString();
    return qs ? `/?${qs}` : "/";
  };

  const supabase = getSupabaseServerClient();
  let request = supabase.from("bottles").select("*");

  const { column, ascending } = SORTS[sort];
  request = request.order(column, { ascending, nullsFirst: false });
  // Stable, readable tiebreak for the sorts with lots of repeats / nulls.
  if (sort === "rating" || sort === "category") {
    request = request.order("name", { ascending: true });
  }

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

      <div className="controls">
        <form className="search" method="get" action="/">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search name, location, category, notes…"
            aria-label="Search entries"
          />
          {sort !== "date" && <input type="hidden" name="sort" value={sort} />}
          {query && <Link href={buildHref({ q: "" })}>Clear</Link>}
        </form>

        <details key={sort} className="sort-menu">
          <summary>Sort: {SORTS[sort].label}</summary>
          <div className="sort-menu-list">
            {Object.entries(SORTS).map(([key, { label }]) => (
              <Link
                key={key}
                href={buildHref({ sort: key })}
                aria-current={key === sort ? "true" : undefined}
              >
                {label}
              </Link>
            ))}
          </div>
        </details>
      </div>

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
