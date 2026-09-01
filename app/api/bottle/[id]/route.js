import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "../../../../lib/supabaseServer";

// Updates an existing bottle's name/rating/notes, and optionally replaces
// the label photo if a new file was included.
export async function PATCH(request, { params }) {
  const { id } = await params;

  try {
    const formData = await request.formData();
    const file = formData.get("image");
    const name = formData.get("name");
    const notes = formData.get("notes") || "";
    const ratingRaw = formData.get("rating");
    const rating = ratingRaw ? Number(ratingRaw) : null;

    if (!name) {
      return NextResponse.json({ error: "Bottle name is required." }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const update = { name, notes, rating };

    // Only touch storage/image_url if a new photo was actually attached.
    if (file && typeof file !== "string" && file.size > 0) {
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

    return NextResponse.json({ bottle }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
