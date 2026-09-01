"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UploadPage() {
  const router = useRouter();
  const [preview, setPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (file) setPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const formData = new FormData(e.target);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Something went wrong.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main className="upload-page">
      <h1>Add a bottle</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Label photo
          {/* capture="environment" opens the rear camera directly on mobile */}
          <input
            type="file"
            name="image"
            accept="image/*"
            capture="environment"
            required
            onChange={handleFileChange}
          />
        </label>

        {preview && <img src={preview} alt="Preview" className="preview" />}

        <label>
          Bottle name
          <input type="text" name="name" placeholder="e.g. Buffalo Trace" required />
        </label>

        <label>
          Rating (1–5)
          <input type="number" name="rating" min="1" max="5" step="1" />
        </label>

        <label>
          Date
          <input
            type="date"
            name="tasted_on"
            defaultValue={new Date().toISOString().slice(0, 10)}
          />
        </label>

        <label>
          Location
          <input type="text" name="location" placeholder="e.g. Home, or The Bar Downtown" />
        </label>

        <label>
          Notes
          <textarea name="notes" rows="4" placeholder="Tasting notes..." />
        </label>

        <button type="submit" disabled={submitting}>
          {submitting ? "Uploading..." : "Save bottle"}
        </button>

        {error && <p className="error">{error}</p>}
      </form>
    </main>
  );
}
