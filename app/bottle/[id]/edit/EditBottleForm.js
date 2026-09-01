"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function EditBottleForm({ bottle }) {
  const router = useRouter();
  const [preview, setPreview] = useState(bottle.image_url);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    const confirmed = window.confirm(
      "Replacing this photo will permanently delete the original once you save. Continue?"
    );

    if (!confirmed) {
      e.target.value = "";
      return;
    }

    setPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const formData = new FormData(e.target);
    // No new photo picked — drop the empty file field so the server knows
    // to keep the existing image instead of trying to upload nothing.
    const image = formData.get("image");
    if (!image || image.size === 0) {
      formData.delete("image");
    }

    const res = await fetch(`/api/bottle/${bottle.id}`, {
      method: "PATCH",
      body: formData,
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Something went wrong.");
      return;
    }

    router.push(`/bottle/${bottle.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Label photo
        {/* capture="environment" opens the rear camera directly on mobile */}
        <input
          type="file"
          name="image"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
        />
      </label>

      {preview && <img src={preview} alt="Preview" className="preview" />}

      <label>
        Bottle name
        <input type="text" name="name" defaultValue={bottle.name} required />
      </label>

      <label>
        Rating (1–5)
        <input
          type="number"
          name="rating"
          min="1"
          max="5"
          step="1"
          defaultValue={bottle.rating ?? ""}
        />
      </label>

      <label>
        Notes
        <textarea name="notes" rows="4" defaultValue={bottle.notes ?? ""} />
      </label>

      <button type="submit" disabled={submitting}>
        {submitting ? "Saving..." : "Save changes"}
      </button>

      {error && <p className="error">{error}</p>}
    </form>
  );
}
