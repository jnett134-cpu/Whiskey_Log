import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "../../../lib/supabaseServer";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("image");
    const name = formData.get("name") || "Untitled bottle";
    const notes = formData.get("notes") || "";
    const ratingRaw = formData.get("rating");
    const rating = ratingRaw ? Number(ratingRaw) : null;

    if (!file || typeof file === "string") {
      return NextResponse.json(
        { error: "No image file was provided." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();

    // Turn the uploaded file into a Buffer Supabase Storage can accept.
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

    const { data: bottle, error: insertError } = await supabase
      .from("bottles")
      .insert({
        name,
        image_url: publicUrlData.publicUrl,
        notes,
        rating,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ bottle }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
