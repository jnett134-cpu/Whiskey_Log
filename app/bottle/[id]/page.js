import { getSupabaseServerClient } from "../../../lib/supabaseServer";

export const dynamic = "force-dynamic";

export default async function BottlePage({ params }) {
  const { id } = await params;
  const supabase = getSupabaseServerClient();
  const { data: bottle } = await supabase
    .from("bottles")
    .select("*")
    .eq("id", id)
    .single();

  if (!bottle) {
    return (
      <main>
        <p>Bottle not found.</p>
      </main>
    );
  }

  return (
    <main className="bottle-detail">
      <img src={bottle.image_url} alt={bottle.name} />
      <h1>{bottle.name}</h1>
      {bottle.rating && (
        <p>
          {"★".repeat(bottle.rating)}
          {"☆".repeat(5 - bottle.rating)}
        </p>
      )}
      <p>{bottle.notes}</p>
    </main>
  );
}
