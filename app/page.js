import Link from "next/link";
import { getSupabaseServerClient } from "../lib/supabaseServer";

// Always fetch fresh data — this is a personal log, not a page you want cached.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = getSupabaseServerClient();
  const { data: bottles, error } = await supabase
    .from("bottles")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <main>
      <div className="header-row">
        <h1>My whiskey log</h1>
        <Link href="/upload">+ Add bottle</Link>
      </div>

      {error && <p className="error">Couldn&apos;t load bottles.</p>}
      {bottles && bottles.length === 0 && <p>No bottles yet — add your first one.</p>}

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
          </Link>
        ))}
      </div>
    </main>
  );
}
