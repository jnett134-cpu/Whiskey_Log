import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "../../../../lib/supabaseServer";

// Public URLs look like:
//   https://<project>.supabase.co/storage/v1/object/public/bottle-images/labels/...
// Pull out everything after the bucket name so we can pass it to remove().
function storagePathFromPublicUrl(publicUrl) {
  const marker = "/bottle-images/";
  const idx = publicUrl?.indexOf(marker) ?? -1;
  return idx === -1 ? null : publicUrl.slice(idx + marker.length);
}

// Updates an existing bottle's name/rating/notes, and optionally replaces
// the label photo if a new file was included. When the photo is replaced,
// the old file in storage is deleted after the new one is saved — the
// client confirms this with the user before ever sending the new file.
export async function PATCH(request, { params }) {
  const { id } = await params;

  try {
    const formData = await request.formData();
    const file = formData.get("image");
    const name = formData.get("name");
    const notes = formData.get("notes") || "";
    const ratingRaw = formData.get("rating");
    const rating = ratingRaw ? Number(ratingRaw) : null;
    const tastedOn = formData.get("tasted_on") || null;
    const location = formData.get("location") || null;
    const category = formData.get("category") || null;

    if (!name) {
      return NextResponse.json({ error: "Bottle name is required." }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const update = { name, notes, rating, tasted_on: tastedOn, location, category };
    const isReplacingImage = file && typeof file !== "string" && file.size > 0;
    let previousImageUrl = null;

    if (isReplacingImage) {
      // Grab the current photo URL so we can delete it once the swap succeeds.
      const { data: existing } = await supabase
        .from("bottles")
        .select("image_url")
        .eq("id", id)
        .single();
      previousImageUrl = existing?.image_url ?? null;

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const fileExt = file.name.split(".").pop() || "jpg";
      const filePath = `labels/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("bottle-images")
        .upload(filePath, buffer, { contentType: file.type });

      if (uploadError) {
        return NextResponse.json({ error: uploadError.message }, { status: 500 });
      }

      const { data: publicUrlData } = supabase.storage
        .from("bottle-images")
        .getPublicUrl(filePath);

      update.image_url = publicUrlData.publicUrl;
    }

    const { data: bottle, error: updateError } = await supabase
      .from("bottles")
      .update(update)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Best-effort cleanup — the row already points at the new photo, so a
    // failure here just leaves an orphaned file rather than losing data.
    if (isReplacingImage && previousImageUrl) {
      const oldPath = storagePathFromPublicUrl(previousImageUrl);
      if (oldPath) {
        const { error: removeError } = await supabase.storage
          .from("bottle-images")
          .remove([oldPath]);
        if (removeError) {
          console.error("Failed to delete old bottle image:", removeError.message);
        }
      }
    }

    return NextResponse.json({ bottle }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
