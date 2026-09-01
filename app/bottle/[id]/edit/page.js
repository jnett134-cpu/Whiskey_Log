import { getSupabaseServerClient } from "../../../../lib/supabaseServer";
import EditBottleForm from "./EditBottleForm";

export const dynamic = "force-dynamic";

export default async function EditBottlePage({ params }) {
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
    <main className="upload-page">
      <h1>Edit bottle</h1>
      <EditBottleForm bottle={bottle} />
    </main>
  );
}
